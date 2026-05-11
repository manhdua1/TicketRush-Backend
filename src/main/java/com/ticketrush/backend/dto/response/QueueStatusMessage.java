package com.ticketrush.backend.dto.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

/**
 * Message gửi qua WebSocket khi user được GRANTED hoặc cập nhật vị trí queue.
 */
@Getter @Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class QueueStatusMessage {
    Integer eventId;
    String token;
    String status;    // GRANTED, WAITING, EXPIRED
    Integer position;
    Integer totalInQueue;
    Integer estimatedWaitSeconds;
}
