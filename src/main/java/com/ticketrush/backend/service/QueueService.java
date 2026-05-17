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

    @Value("${queue.threshold:10}")
    int queueThreshold;

    @Value("${queue.batch-size:10}")
    int batchSize;

    @Value("${queue.granted-ttl:10}")
    int grantedTtlMinutes;

    @Value("${queue.active-user-ttl:60}")
    int activeUserTtlSeconds;

    @Value("${queue.token-cookie-ttl:60}")
    int tokenCookieTtlMinutes;

    private String queueKey(Integer eventId) {
        return "queue:" + eventId;
    }

    private String grantedKey(String token) {
        return "queue:granted:" + token;
    }

    private String grantedEventKey(Integer eventId) {
        return "queue:granted:event:" + eventId;
    }

    private String activeUsersKey(Integer eventId) {
        return "event:active:" + eventId;
    }

    private String activeUserSessionKey(Integer eventId, Integer userId) {
        return "event:active:" + eventId + ":user:" + userId;
    }

    public void trackActiveUser(Integer eventId, Integer userId) {
        String setKey = activeUsersKey(eventId);
        String sessionKey = activeUserSessionKey(eventId, userId);

        redisTemplate.opsForSet().add(setKey, userId.toString());

        redisTemplate.opsForValue().set(sessionKey, "1",
                Duration.ofSeconds(activeUserTtlSeconds));

        redisTemplate.expire(setKey, Duration.ofSeconds(activeUserTtlSeconds * 2L));
    }

    public int getActiveUserCount(Integer eventId) {
        Long size = redisTemplate.opsForSet().size(activeUsersKey(eventId));
        return size != null ? size.intValue() : 0;
    }

    public boolean isQueueRequired(Integer eventId) {
        return getActiveUserCount(eventId) >= queueThreshold
                || getQueueSize(eventId) > 0
                || hasActiveGrantedTokens(eventId);
    }

    public Duration getTokenCookieTtl() {
        return Duration.ofMinutes(tokenCookieTtlMinutes);
    }

    @Transactional
    public QueueJoinResponse joinQueue(Integer eventId, Integer userId) {
        eventRepository.findById(eventId)
                .orElseThrow(() -> new AppException(ErrorCode.EVENT_NOT_FOUND));

        Optional<QueueToken> existing = queueTokenRepository
                .findByUserIdAndEventIdAndStatusIn(
                        userId, eventId,
                        List.of(QueueToken.Status.WAITING, QueueToken.Status.GRANTED));

        if (existing.isPresent()) {
            QueueToken qt = existing.get();

            if (qt.getStatus() == QueueToken.Status.GRANTED) {
                if (isGranted(qt.getToken(), userId, eventId)) {
                    return QueueJoinResponse.builder()
                            .token(qt.getToken())
                            .position(0)
                            .totalInQueue(getQueueSize(eventId))
                            .message("Bạn đã được cấp quyền đặt vé")
                            .build();
                }

                qt.setStatus(QueueToken.Status.EXPIRED);
                queueTokenRepository.save(qt);
            } else {
                Long position = getPosition(eventId, qt.getToken());
                return QueueJoinResponse.builder()
                        .token(qt.getToken())
                        .position(position != null ? position.intValue() + 1 : 1)
                        .totalInQueue(getQueueSize(eventId))
                        .message("Bạn đã trong hàng chờ")
                        .build();
            }
        }

        String token = UUID.randomUUID().toString();
        long score = System.currentTimeMillis();

        redisTemplate.opsForZSet().add(queueKey(eventId), token, score);

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

    public QueueStatusResponse getQueueStatus(String token, Integer userId, Integer eventId) {
        QueueToken queueToken = queueTokenRepository.findByTokenAndUserIdAndEventId(token, userId, eventId)
                .orElseThrow(() -> new AppException(ErrorCode.QUEUE_TOKEN_NOT_FOUND));

        if (queueToken.getStatus() == QueueToken.Status.GRANTED) {
            if (isGranted(token, userId, eventId)) {
                return QueueStatusResponse.builder()
                        .status("GRANTED")
                        .position(0)
                        .totalInQueue(0)
                        .estimatedWaitSeconds(0)
                        .build();
            }

            removeGrantedToken(eventId, token);
            queueToken.setStatus(QueueToken.Status.EXPIRED);
            queueTokenRepository.save(queueToken);
        }

        if (queueToken.getStatus() == QueueToken.Status.EXPIRED) {
            return QueueStatusResponse.builder()
                    .status("EXPIRED")
                    .position(-1)
                    .totalInQueue(0)
                    .estimatedWaitSeconds(0)
                    .build();
        }

        Long position = getPosition(eventId, token);
        int pos = position != null ? position.intValue() + 1 : 1;
        int total = getQueueSize(eventId);

        int estimatedWait = (pos / batchSize + 1) * 30;

        return QueueStatusResponse.builder()
                .status("WAITING")
                .position(pos)
                .totalInQueue(total)
                .estimatedWaitSeconds(estimatedWait)
                .build();
    }

    public boolean isGranted(String token, Integer userId, Integer eventId) {
        if (token == null || token.isBlank()) {
            return false;
        }

        Optional<QueueToken> queueToken = queueTokenRepository.findByTokenAndUserIdAndEventId(token, userId, eventId);
        if (queueToken.isEmpty() || queueToken.get().getStatus() != QueueToken.Status.GRANTED) {
            return false;
        }

        Boolean exists = redisTemplate.hasKey(grantedKey(token));
        return Boolean.TRUE.equals(exists);
    }

    @Transactional
    public void leaveQueue(String token, Integer userId, Integer eventId) {
        QueueToken queueToken = queueTokenRepository.findByTokenAndUserIdAndEventId(token, userId, eventId)
                .orElseThrow(() -> new AppException(ErrorCode.QUEUE_TOKEN_NOT_FOUND));

        boolean shouldBroadcastQueueUpdate = queueToken.getStatus() == QueueToken.Status.WAITING;

        redisTemplate.opsForZSet().remove(queueKey(eventId), token);
        redisTemplate.delete(grantedKey(token));
        removeGrantedToken(eventId, token);

        if (queueToken.getStatus() != QueueToken.Status.EXPIRED) {
            queueToken.setStatus(QueueToken.Status.EXPIRED);
            queueTokenRepository.save(queueToken);
        }

        if (shouldBroadcastQueueUpdate) {
            broadcastQueueUpdate(eventId);
        }

        log.info("User {} left queue for event {}", userId, eventId);
    }

    @Scheduled(fixedDelay = 30000)
    public void processQueue() {
        Set<String> queueKeys = redisTemplate.keys("queue:*");
        if (queueKeys == null || queueKeys.isEmpty()) {
            log.debug("processQueue: Không có queue nào đang active");
            return;
        }

        queueKeys.forEach(key -> {
            if (key.contains("granted")) return;

            String eventIdStr = key.replace("queue:", "");
            try {
                Integer eventId = Integer.parseInt(eventIdStr);
                grantBatch(eventId);
            } catch (NumberFormatException e) {
                log.warn("processQueue: Key Redis không hợp lệ: {}", key);
            } catch (RuntimeException e) {
                log.error("processQueue: Không thể xử lý queue key {}", key, e);
            }
        });
    }

    @Transactional
    public void grantBatch(Integer eventId) {
        Set<Object> batch = redisTemplate.opsForZSet()
                .range(queueKey(eventId), 0, batchSize - 1);

        if (batch == null || batch.isEmpty()) return;

        int grantedCount = 0;
        for (Object tokenObj : batch) {
            String token = tokenObj.toString();

            try {
                grantToken(eventId, token);
                grantedCount++;
            } catch (RuntimeException e) {
                log.error("grantBatch: Không thể grant token={} eventId={}", token, eventId, e);
            }
        }

        log.info("Granted {}/{} tokens for eventId={}", grantedCount, batch.size(), eventId);

        broadcastQueueUpdate(eventId);
    }

    private void grantToken(Integer eventId, String token) {
        redisTemplate.opsForValue().set(
                grantedKey(token), "1",
                Duration.ofMinutes(grantedTtlMinutes));
        redisTemplate.opsForSet().add(grantedEventKey(eventId), token);
        redisTemplate.expire(grantedEventKey(eventId), Duration.ofMinutes(grantedTtlMinutes));

        redisTemplate.opsForZSet().remove(queueKey(eventId), token);

        Optional<QueueToken> grantedToken = queueTokenRepository.findByToken(token);
        grantedToken.ifPresent(qt -> {
            qt.setStatus(QueueToken.Status.GRANTED);
            qt.setGrantedAt(LocalDateTime.now());
            queueTokenRepository.save(qt);
        });

        if (grantedToken.isEmpty()) {
            log.warn("Granted Redis token={} for eventId={} but DB token was not found", token, eventId);
            return;
        }

        QueueStatusMessage message = QueueStatusMessage.builder()
                .eventId(eventId)
                .status("GRANTED")
                .position(0)
                .totalInQueue(getQueueSize(eventId))
                .estimatedWaitSeconds(0)
                .build();
        try {
            messagingTemplate.convertAndSendToUser(
                    grantedToken.get().getUser().getEmail(),
                    "/queue/queue/" + eventId,
                    message);
        } catch (RuntimeException e) {
            log.warn("Granted token={} eventId={} but failed to send websocket message", token, eventId, e);
        }

        log.info("Granted token={} eventId={}", token, eventId);
    }

    @Scheduled(fixedDelay = 30000)
    public void cleanupActiveUsers() {
        Set<String> activeKeys = redisTemplate.keys("event:active:*");
        if (activeKeys == null) return;

        activeKeys.forEach(key -> {
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
                        redisTemplate.opsForSet().remove(key, userIdObj);
                        log.debug("Removed inactive user {} from event {}", userIdObj, eventId);
                    }
                });
            } catch (NumberFormatException ignored) {
            }
        });
    }

    private void broadcastQueueUpdate(Integer eventId) {
        Set<Object> remaining = redisTemplate.opsForZSet()
                .range(queueKey(eventId), 0, -1);

        if (remaining == null || remaining.isEmpty()) return;

        int total = remaining.size();
        int pos = 1;
        for (Object tokenObj : remaining) {
            String token = tokenObj.toString();
            int currentPos = pos;
            int estimatedWait = (currentPos / batchSize + 1) * 30;
            Optional<QueueToken> queueToken = queueTokenRepository.findByToken(token);
            if (queueToken.isPresent()) {
                QueueStatusMessage msg = QueueStatusMessage.builder()
                        .eventId(eventId)
                        .status("WAITING")
                        .position(currentPos)
                        .totalInQueue(total)
                        .estimatedWaitSeconds(estimatedWait)
                        .build();

                messagingTemplate.convertAndSendToUser(
                        queueToken.get().getUser().getEmail(),
                        "/queue/queue/" + eventId,
                        msg);
            }
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

    private boolean hasActiveGrantedTokens(Integer eventId) {
        String key = grantedEventKey(eventId);
        Set<Object> tokens = redisTemplate.opsForSet().members(key);
        if (tokens == null || tokens.isEmpty()) {
            redisTemplate.delete(key);
            return false;
        }

        boolean hasActiveToken = false;
        for (Object tokenObj : tokens) {
            String token = tokenObj.toString();
            if (Boolean.TRUE.equals(redisTemplate.hasKey(grantedKey(token)))) {
                hasActiveToken = true;
            } else {
                redisTemplate.opsForSet().remove(key, token);
            }
        }

        if (!hasActiveToken) {
            redisTemplate.delete(key);
        }

        return hasActiveToken;
    }

    private void removeGrantedToken(Integer eventId, String token) {
        String key = grantedEventKey(eventId);
        redisTemplate.opsForSet().remove(key, token);
        Long remaining = redisTemplate.opsForSet().size(key);
        if (remaining == null || remaining == 0) {
            redisTemplate.delete(key);
        }
    }
}
