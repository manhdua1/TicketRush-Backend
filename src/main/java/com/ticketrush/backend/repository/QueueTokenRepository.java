package com.ticketrush.backend.repository;

import com.ticketrush.backend.entity.QueueToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QueueTokenRepository extends JpaRepository<QueueToken, Integer> {
    Optional<QueueToken> findByToken(String token);

    Optional<QueueToken> findByTokenAndUserIdAndEventId(String token, Integer userId, Integer eventId);

    Optional<QueueToken> findByUserIdAndEventIdAndStatusIn(
            Integer userId, Integer eventId, List<QueueToken.Status> statuses);
}
