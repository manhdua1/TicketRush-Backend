package com.ticketrush.backend.dto.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

@Getter @Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EventStatsResponse {
    Integer eventId;
    String eventTitle;
    BigDecimal totalRevenue;
    Integer totalSeats;
    Integer soldSeats;
    Integer lockedSeats;
    Integer availableSeats;
    double occupancyRate; // tỉ lệ lấp đầy %
    List<ZoneStatsResponse> zoneStats;
}
