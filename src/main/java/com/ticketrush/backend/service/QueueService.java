package com.ticketrush.backend.service;

import com.ticketrush.backend.dto.response.QueueJoinResponse;
import com.ticketrush.backend.dto.response.QueueStatusMessage;
import com.ticketrush.backend.dto.response.QueueStatusResponse;
import com.ticketrush.backend.entity.Event;
import com.ticketrush.backend.entity.QueueToken;
import com.ticketrush.backend.entity.User;
import com.ticketrush.backend.exception.AppException;
import com.ticketrush.backend.exception.ErrorCode;
import com.ticketrush.backend.repository.EventRepository;
import com.ticketrush.backend.repository.QueueTokenRepository;
import com.ticketrush.backend.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Slf4j
public class QueueService {
    final RedisTemplate<String, Object> redisTemplate;
    final QueueTokenRepository queueTokenRepository;
    final UserRepository userRepository;
    final EventRepository eventRepository;
    final SimpMessagingTemplate messagingTemplate;

    // ---------- Cấu hình từ application.yaml ----------
    @Value("${queue.threshold:10}")
    int queueThreshold;

    @Value("${queue.batch-size:10}")
    int batchSize;

    @Value("${queue.granted-ttl:10}")
    int grantedTtlMinutes;

    @Value("${queue.active-user-ttl:60}")
    int activeUserTtlSeconds;

    // ---------- Redis key patterns ----------
    private String queueKey(Integer eventId) {
        return "queue:" + eventId;
    }

    private String grantedKey(String token) {
        return "queue:granted:" + token;
    }

    private String activeUsersKey(Integer eventId) {
        return "event:active:" + eventId;
    }

    private String activeUserSessionKey(Integer eventId, Integer userId) {
        return "event:active:" + eventId + ":user:" + userId;
    }

    // =====================================================
    //  1) TRACKING ACTIVE USERS — đếm người đang xem event
    // =====================================================

    /**
     * Ghi nhận user đang xem event.
     * Dùng Redis SET để deduplicate, mỗi user có key session riêng với TTL.
     */
    public void trackActiveUser(Integer eventId, Integer userId) {
        String setKey = activeUsersKey(eventId);
        String sessionKey = activeUserSessionKey(eventId, userId);

        // Thêm userId vào SET của event
        redisTemplate.opsForSet().add(setKey, userId.toString());

        // Đặt TTL cho session key riêng (tự hết hạn khi user rời đi)
        redisTemplate.opsForValue().set(sessionKey, "1",
                Duration.ofSeconds(activeUserTtlSeconds));

        // TTL cho SET key — tự cleanup nếu không ai truy cập
        redisTemplate.expire(setKey, Duration.ofSeconds(activeUserTtlSeconds * 2L));
    }

    /**
     * Đếm số user đang active trên event.
     */
    public int getActiveUserCount(Integer eventId) {
        Long size = redisTemplate.opsForSet().size(activeUsersKey(eventId));
        return size != null ? size.intValue() : 0;
    }

    /**
     * Kiểm tra event có yêu cầu hàng chờ không.
     */
    public boolean isQueueRequired(Integer eventId) {
        return getActiveUserCount(eventId) >= queueThreshold;
    }

    // =====================================================
    //  2) JOIN QUEUE
    // =====================================================

    /**
     * User xin vào hàng chờ.
     * Lưu vào Redis Sorted Set với score = timestamp.
     */
    @Transactional
    public QueueJoinResponse joinQueue(Integer eventId, Integer userId) {
        eventRepository.findById(eventId)
                .orElseThrow(() -> new AppException(ErrorCode.EVENT_NOT_FOUND));

        // Kiểm tra user đã có token chưa
        Optional<QueueToken> existing = queueTokenRepository
                .findByUserIdAndEventIdAndStatusIn(
                        userId, eventId,
                        List.of(QueueToken.Status.WAITING, QueueToken.Status.GRANTED));

        if (existing.isPresent()) {
            QueueToken qt = existing.get();

            // Nếu đã GRANTED, trả luôn
            if (qt.getStatus() == QueueToken.Status.GRANTED) {
                return QueueJoinResponse.builder()
                        .token(qt.getToken())
                        .position(0)
                        .totalInQueue(getQueueSize(eventId))
                        .message("Bạn đã được cấp quyền đặt vé")
                        .build();
            }

            Long position = getPosition(eventId, qt.getToken());
            return QueueJoinResponse.builder()
                    .token(qt.getToken())
                    .position(position != null ? position.intValue() + 1 : 1)
                    .totalInQueue(getQueueSize(eventId))
                    .message("Bạn đã trong hàng chờ")
                    .build();
        }

        String token = UUID.randomUUID().toString();
        long score = System.currentTimeMillis();

        // Lưu vào Redis Sorted Set
        redisTemplate.opsForZSet().add(queueKey(eventId), token, score);

        // Lưu vào DB để tracking
        User user = userRepository.findById(userId).orElseThrow();
        Event event = eventRepository.findById(eventId).orElseThrow();

        Long position = redisTemplate.opsForZSet().rank(queueKey(eventId), token);
        int pos = position != null ? position.intValue() + 1 : 1;

        QueueToken queueToken = QueueToken.builder()
                .user(user)
                .event(event)
                .token(token)
                .position(pos)
                .status(QueueToken.Status.WAITING)
                .build();
        queueTokenRepository.save(queueToken);

        log.info("User {} joined queue for event {}, position={}", userId, eventId, pos);

        return QueueJoinResponse.builder()
                .token(token)
                .position(pos)
                .totalInQueue(getQueueSize(eventId))
                .message("Vui lòng chờ, đừng tải lại trang")
                .build();
    }

    // =====================================================
    //  3) CHECK QUEUE STATUS
    // =====================================================

    /**
     * Kiểm tra vị trí trong hàng chờ.
     */
    public QueueStatusResponse getQueueStatus(String token) {
        QueueToken queueToken = queueTokenRepository.findByToken(token)
                .orElseThrow(() -> new AppException(ErrorCode.QUEUE_TOKEN_NOT_FOUND));

        // Nếu đã được granted
        if (queueToken.getStatus() == QueueToken.Status.GRANTED) {
            return QueueStatusResponse.builder()
                    .token(token)
                    .status("GRANTED")
                    .position(0)
                    .totalInQueue(0)
                    .estimatedWaitSeconds(0)
                    .build();
        }

        // Nếu expired
        if (queueToken.getStatus() == QueueToken.Status.EXPIRED) {
            return QueueStatusResponse.builder()
                    .token(token)
                    .status("EXPIRED")
                    .position(-1)
                    .totalInQueue(0)
                    .estimatedWaitSeconds(0)
                    .build();
        }

        Integer eventId = queueToken.getEvent().getId();
        Long position = getPosition(eventId, token);
        int pos = position != null ? position.intValue() + 1 : 1;
        int total = getQueueSize(eventId);

        // Ước tính thời gian chờ: mỗi lượt 30 giây, mỗi lượt batchSize người
        int estimatedWait = (pos / batchSize + 1) * 30;

        return QueueStatusResponse.builder()
                .token(token)
                .status("WAITING")
                .position(pos)
                .totalInQueue(total)
                .estimatedWaitSeconds(estimatedWait)
                .build();
    }

    /**
     * Kiểm tra token có được phép vào đặt vé không.
     */
    public boolean isGranted(String token) {
        Boolean exists = redisTemplate.hasKey(grantedKey(token));
        return Boolean.TRUE.equals(exists);
    }

    // =====================================================
    //  4) SCHEDULED JOB — Grant batch + WebSocket push
    // =====================================================

    /**
     * Scheduled job — chạy mỗi 30 giây để cấp quyền cho batch người đầu hàng.
     * KHÔNG đặt @Transactional ở đây vì @Scheduled gọi trực tiếp vào bean,
     * bỏ qua Spring proxy → transaction không bao giờ được tạo.
     * Thay vào đó, gọi method @Transactional riêng bên dưới.
     */
    @Scheduled(fixedDelay = 30000) // 30 giây/lượt
    public void processQueue() {
        // Lấy tất cả queue đang active (key format: "queue:<eventId>")
        Set<String> queueKeys = redisTemplate.keys("queue:*");
        if (queueKeys == null || queueKeys.isEmpty()) {
            log.debug("processQueue: Không có queue nào đang active");
            return;
        }

        queueKeys.forEach(key -> {
            // Bỏ qua các key của granted tokens (format: "queue:granted:<token>")
            if (key.contains("granted")) return;

            String eventIdStr = key.replace("queue:", "");
            try {
                Integer eventId = Integer.parseInt(eventIdStr);
                grantBatch(eventId);
            } catch (NumberFormatException e) {
                log.warn("processQueue: Key Redis không hợp lệ: {}", key);
            }
        });
    }

    /**
     * Cấp quyền cho batchSize người đầu của một event queue.
     * Method này có @Transactional riêng để đảm bảo DB update được commit đúng cách.
     */
    @Transactional
    public void grantBatch(Integer eventId) {
        Set<Object> batch = redisTemplate.opsForZSet()
                .range(queueKey(eventId), 0, batchSize - 1);

        if (batch == null || batch.isEmpty()) return;

        batch.forEach(tokenObj -> {
            String token = tokenObj.toString();

            // Lưu token granted vào Redis với TTL
            redisTemplate.opsForValue().set(
                    grantedKey(token), "1",
                    Duration.ofMinutes(grantedTtlMinutes));

            // Xoá khỏi hàng chờ
            redisTemplate.opsForZSet().remove(queueKey(eventId), token);

            // Cập nhật DB
            queueTokenRepository.findByToken(token).ifPresent(qt -> {
                qt.setStatus(QueueToken.Status.GRANTED);
                qt.setGrantedAt(LocalDateTime.now());
                queueTokenRepository.save(qt);
            });

            // ★ Push thông báo GRANTED qua WebSocket
            QueueStatusMessage message = QueueStatusMessage.builder()
                    .eventId(eventId)
                    .token(token)
                    .status("GRANTED")
                    .position(0)
                    .totalInQueue(getQueueSize(eventId))
                    .estimatedWaitSeconds(0)
                    .build();
            messagingTemplate.convertAndSend(
                    "/topic/queue/" + eventId, message);

            log.info("Granted token={} eventId={}", token, eventId);
        });

        // ★ Cập nhật vị trí cho tất cả người còn lại trong queue
        broadcastQueueUpdate(eventId);
    }

    // =====================================================
    //  5) CLEANUP ACTIVE USERS — dọn user đã hết session
    // =====================================================

    /**
     * Chạy mỗi 30 giây, dọn dẹp user đã hết TTL khỏi active set.
     */
    @Scheduled(fixedDelay = 30000)
    public void cleanupActiveUsers() {
        Set<String> activeKeys = redisTemplate.keys("event:active:*");
        if (activeKeys == null) return;

        activeKeys.forEach(key -> {
            // Chỉ xử lý SET key (format: "event:active:<eventId>"), bỏ qua session key
            if (key.chars().filter(c -> c == ':').count() > 2) return;

            String eventIdStr = key.replace("event:active:", "");
            try {
                Integer eventId = Integer.parseInt(eventIdStr);
                Set<Object> members = redisTemplate.opsForSet().members(key);
                if (members == null) return;

                members.forEach(userIdObj -> {
                    String sessionKey = activeUserSessionKey(eventId, Integer.parseInt(userIdObj.toString()));
                    Boolean exists = redisTemplate.hasKey(sessionKey);
                    if (!Boolean.TRUE.equals(exists)) {
                        // Session đã hết hạn, xoá khỏi SET
                        redisTemplate.opsForSet().remove(key, userIdObj);
                        log.debug("Removed inactive user {} from event {}", userIdObj, eventId);
                    }
                });
            } catch (NumberFormatException ignored) {
            }
        });
    }

    // =====================================================
    //  6) HELPER METHODS
    // =====================================================

    /**
     * Broadcast cập nhật vị trí cho tất cả user đang chờ.
     */
    private void broadcastQueueUpdate(Integer eventId) {
        Set<Object> remaining = redisTemplate.opsForZSet()
                .range(queueKey(eventId), 0, -1);

        if (remaining == null || remaining.isEmpty()) return;

        int total = remaining.size();
        int pos = 1;
        for (Object tokenObj : remaining) {
            String token = tokenObj.toString();
            int estimatedWait = (pos / batchSize + 1) * 30;

            QueueStatusMessage msg = QueueStatusMessage.builder()
                    .eventId(eventId)
                    .token(token)
                    .status("WAITING")
                    .position(pos)
                    .totalInQueue(total)
                    .estimatedWaitSeconds(estimatedWait)
                    .build();

            messagingTemplate.convertAndSend(
                    "/topic/queue/" + eventId, msg);
            pos++;
        }
    }

    private Long getPosition(Integer eventId, String token) {
        return redisTemplate.opsForZSet().rank(queueKey(eventId), token);
    }

    private int getQueueSize(Integer eventId) {
        Long size = redisTemplate.opsForZSet().size(queueKey(eventId));
        return size != null ? size.intValue() : 0;
    }
}
