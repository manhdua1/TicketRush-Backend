package com.ticketrush.backend.dto.request;

import com.ticketrush.backend.entity.Event;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EventRequest {
    @NotBlank(message = "TITLE_REQUIRED")
    String title;

    String description;

    @NotBlank(message = "VENUE_REQUIRED")
    String venue;

    @NotNull(message = "EVENT_DATE_REQUIRED")
    @Future(message = "INVALID_EVENT_DATE")
    LocalDateTime startTime;

    @NotNull(message = "EVENT_DATE_REQUIRED")
    LocalDateTime endTime;

    @NotNull(message = "EVENT_TYPE_REQUIRED")
    Event.Type type;

    String posterUrl;

    @AssertTrue(message = "INVALID_END_TIME")
    public boolean isEndTimeAfterStartTime() {
        if (startTime == null || endTime == null) return true;
        return endTime.isAfter(startTime);
    }
}
