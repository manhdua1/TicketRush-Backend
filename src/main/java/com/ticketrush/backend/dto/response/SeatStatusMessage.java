package com.ticketrush.backend.dto.response;

import com.ticketrush.backend.entity.Seat;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.experimental.FieldDefaults;

@Getter @Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SeatStatusMessage {
    Integer seatId;
    String label;
    Seat.Status status;
    Integer eventId;
}
