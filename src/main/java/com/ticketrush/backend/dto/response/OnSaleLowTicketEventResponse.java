package com.ticketrush.backend.dto.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OnSaleLowTicketEventResponse {
    Integer eventId;
    String eventTitle;
    String venue;
    LocalDateTime startTime;
    LocalDateTime endTime;
    String posterUrl;
    Integer totalTickets;
    Integer soldTickets;
    Integer lockedTickets;
    Integer remainingTickets;
    double remainingRate;
}
