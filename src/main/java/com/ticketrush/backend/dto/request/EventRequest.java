package com.ticketrush.backend.dto.request;

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
    private String title;

    private String description;

    @NotBlank(message = "VENUE_REQUIRED")
    private String venue;

    @NotNull(message = "EVENT_DATE_REQUIRED")
    @Future(message = "INVALID_EVENT_DATE")
    private LocalDateTime eventDate;

    private String posterUrl;
}
