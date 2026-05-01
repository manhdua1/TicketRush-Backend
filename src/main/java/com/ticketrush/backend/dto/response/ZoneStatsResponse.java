package com.ticketrush.backend.dto.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Getter @Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ZoneStatsResponse {
    Integer zoneId;
    String zoneName;
    String colorHex;
    BigDecimal price;
    Integer totalSeats;
    Integer soldSeats;
    Integer lockedSeats;
    Integer availableSeats;
    double occupancyRate;
    BigDecimal revenue;
}