package com.ticketrush.backend.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Builder
public class TicketResponse {
    private Integer id;
    private String qrCode;
    private String status;
    private String eventTitle;
    private String venue;
    private LocalDateTime eventDate;
    private String zoneName;
    private String seatLabel;
    private BigDecimal price;
    private LocalDateTime issuedAt;
}