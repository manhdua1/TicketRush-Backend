package com.ticketrush.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SpotlightRequest {
    @NotNull(message = "SPOTLIGHT_REQUIRED")
    Boolean spotlight;
}

