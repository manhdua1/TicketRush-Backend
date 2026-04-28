package com.ticketrush.backend.dto.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EventResponse {
    Integer id;
    String title;
    String description;
    String venue;
    LocalDateTime startTime;
    LocalDateTime endTime;
    String posterUrl;
    String status;
    String type;
    List<ZoneResponse> zones;
    LocalDateTime createdAt;
}
