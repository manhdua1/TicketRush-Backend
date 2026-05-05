package com.ticketrush.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ChangePasswordRequest {
    @NotBlank(message = "PASSWORD_REQUIRED")
    private String currentPassword;

    @NotBlank(message = "PASSWORD_REQUIRED") @Size(min = 6, max = 20, message = "INVALID_PASSWORD")
    private String newPassword;
}
