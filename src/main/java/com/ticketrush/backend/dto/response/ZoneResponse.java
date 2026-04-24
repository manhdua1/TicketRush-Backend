package com.ticketrush.backend.dto.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ZoneResponse {
    private Integer id;
    private String name;
    private BigDecimal price;
    private Integer totalRows;
    private Integer totalCols;
    private String colorHex;
    private long availableSeats;
    private long totalSeats;
}
