package com.ticketrush.backend.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter @Setter
public class BookingRequest {
    @NotEmpty
    private List<Integer> seatIds;

    // Deprecated: queue token is now read from HttpOnly cookie.
    private String queueToken;
}
