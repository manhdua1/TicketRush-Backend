package com.ticketrush.backend.service;

import com.ticketrush.backend.dto.response.QueueJoinResponse;
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
import org.springframework.data.redis.core.RedisTemplate;
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
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class QueueService {
    RedisTemplate<String, Object> redisTemplate;
    QueueTokenRepository queueTokenRepository;
    UserRepository userRepository;
    EventRepository eventRepository;

    private static final int BATCH_SIZE = 2;
    private static final int GRANTED_TTL_MINUTES = 10;

    private String queueKey(Integer eventId) {
        return "queue:" + eventId;
    }

    private String grantedKey(String token) {
        return "queue:granted:" + token;
    }

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
            Long position = getPosition(eventId, qt.getToken());
            return QueueJoinResponse.builder()
                    .token(qt.getToken())
                    .position(position != null ? position.intValue() : 0)
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

        return QueueJoinResponse.builder()
                .token(token)
                .position(pos)
                .totalInQueue(getQueueSize(eventId))
                .message("Vui lòng chờ, đừng tải lại trang")
                .build();
    }

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

        // Ước tính thời gian chờ: mỗi lượt 30 giây, mỗi lượt 50 người
        int estimatedWait = (pos / BATCH_SIZE + 1) * 30;

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

    /**
     * Background job — cấp quyền cho 50 người đầu mỗi lượt.
     */
    @Scheduled(fixedDelay = 30000) // 30 giây/lượt
    @Transactional
    public void processQueue() {
        // Lấy tất cả queue đang active
        Set<String> queueKeys = redisTemplate.keys("queue:[0-9]*");
        if (queueKeys == null) return;

        queueKeys.forEach(key -> {
            String keyStr = key.toString();
            Integer eventId = Integer.parseInt(keyStr.replace("queue:", ""));

            // Lấy 50 người đầu hàng
            Set<Object> batch = redisTemplate.opsForZSet()
                    .range(queueKey(eventId), 0, BATCH_SIZE - 1);

            if (batch == null || batch.isEmpty()) return;

            batch.forEach(tokenObj -> {
                String token = tokenObj.toString();

                // Lưu token granted vào Redis với TTL 10 phút
                redisTemplate.opsForValue().set(
                        grantedKey(token), "1",
                        Duration.ofMinutes(GRANTED_TTL_MINUTES));

                // Xoá khỏi hàng chờ
                redisTemplate.opsForZSet().remove(queueKey(eventId), token);

                // Cập nhật DB
                queueTokenRepository.findByToken(token).ifPresent(qt -> {
                    qt.setStatus(QueueToken.Status.GRANTED);
                    qt.setGrantedAt(LocalDateTime.now());
                    queueTokenRepository.save(qt);
                });

                log.info("Granted token={} eventId={}", token, eventId);
            });
        });
    }

    private Long getPosition(Integer eventId, String token) {
        return redisTemplate.opsForZSet().rank(queueKey(eventId), token);
    }

    private int getQueueSize(Integer eventId) {
        Long size = redisTemplate.opsForZSet().size(queueKey(eventId));
        return size != null ? size.intValue() : 0;
    }
}
