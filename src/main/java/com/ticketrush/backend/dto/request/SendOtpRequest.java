package com.ticketrush.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SendOtpRequest {
    @Email(message = "INVALID_EMAIL") @NotBlank(message = "EMAIL_REQUIRED")
    private String email;
}
