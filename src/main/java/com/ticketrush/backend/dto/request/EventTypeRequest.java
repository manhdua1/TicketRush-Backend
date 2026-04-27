package com.ticketrush.backend.dto.request;

import com.ticketrush.backend.entity.Event;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter @Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EventTypeRequest {
    @NotNull
    Event.Type type;
}
