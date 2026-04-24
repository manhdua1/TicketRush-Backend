package com.ticketrush.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Builder
public class BookingResponse {
    private Integer id;
    private String status;
    private BigDecimal totalAmount;
    private LocalDateTime expiresAt;
    private List<SeatResponse> seats;
}