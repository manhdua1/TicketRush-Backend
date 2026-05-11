package com.ticketrush.backend.dto.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

@Getter @Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class QueueStatusResponse {
    String token;
    String status; // WAITING, GRANTED, EXPIRED
    Integer position;
    Integer totalInQueue;
    Integer estimatedWaitSeconds;
}
