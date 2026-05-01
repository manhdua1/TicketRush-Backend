package com.ticketrush.backend.dto.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

@Getter @Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AgeGroupStatsResponse {
    String ageGroup; // "18-24", "25-34"...
    Integer count;
    double percentage;
}
