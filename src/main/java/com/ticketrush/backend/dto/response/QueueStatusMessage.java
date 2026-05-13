package com.ticketrush.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

/**
 * Message gửi qua WebSocket khi user được GRANTED hoặc cập nhật vị trí queue.
 */
@Getter @Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class QueueStatusMessage {
    Integer eventId;
    String status;    // GRANTED, WAITING, EXPIRED
    Integer position;
    Integer totalInQueue;
    Integer estimatedWaitSeconds;
}
