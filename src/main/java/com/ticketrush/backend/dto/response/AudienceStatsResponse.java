package com.ticketrush.backend.dto.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Getter @Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AudienceStatsResponse {
    Integer eventId;
    Integer totalBuyers;
    List<GenderStatsResponse> genderStats;
    List<AgeGroupStatsResponse> ageGroupStats;
}
