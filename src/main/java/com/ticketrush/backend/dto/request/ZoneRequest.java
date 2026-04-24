package com.ticketrush.backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter @Setter
public class ZoneRequest {
    @NotBlank(message = "ZONE_NAME_REQUIRED")
    private String name;

    @NotNull(message = "PRICE_REQUIRED") @Positive(message = "INVALID_PRICE")
    private BigDecimal price;

    @NotNull(message = "TOTAL_ROWS_REQUIRED")
    @Min(value = 1, message = "INVALID_ROWS")
    @Max(value = 50, message = "INVALID_ROWS")
    private Integer totalRows;

    @NotNull(message = "TOTAL_COLS_REQUIRED")
    @Min(value = 1, message = "INVALID_COLS")
    @Max(value = 50, message = "INVALID_COLS")
    private Integer totalCols;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "INVALID_COLOR")
    private String colorHex;
}
