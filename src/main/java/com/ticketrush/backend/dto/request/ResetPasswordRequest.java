package com.ticketrush.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResetPasswordRequest {
    @Email(message = "INVALID_EMAIL")
    @NotBlank(message = "EMAIL_REQUIRED")
    String email;

    @NotBlank(message = "OTP_REQUIRED")
    String otp;

    @NotBlank(message = "PASSWORD_REQUIRED") @Size(min = 6, max = 20, message = "INVALID_PASSWORD")
    String newPassword;
}