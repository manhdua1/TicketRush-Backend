package com.ticketrush.backend.dto.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

@Getter @Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class QueueJoinResponse {
    String token;
    Integer position;
    Integer totalInQueue;
    String message;
}
