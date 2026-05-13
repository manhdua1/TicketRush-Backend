package com.ticketrush.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

@Getter @Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class QueueStatusResponse {
    String status; // WAITING, GRANTED, EXPIRED
    Integer position;
    Integer totalInQueue;
    Integer estimatedWaitSeconds;
}
