package com.ticketrush.backend.dto.response;

import com.ticketrush.backend.entity.Seat;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Getter @Setter @Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SeatResponse {
    Integer id;
    Integer zoneId;
    String zoneName;
    String colorHex;
    BigDecimal price;
    Integer rowNumber;
    Integer colNumber;
    String label;
    Seat.Status status;
}
