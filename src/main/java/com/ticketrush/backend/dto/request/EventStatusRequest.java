package com.ticketrush.backend.dto.request;

import com.ticketrush.backend.entity.Event;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class EventStatusRequest {
    @NotNull
    private Event.Status status;
}
