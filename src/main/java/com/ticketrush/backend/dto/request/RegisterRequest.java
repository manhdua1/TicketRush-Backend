package com.ticketrush.backend.dto.request;

import com.ticketrush.backend.entity.User;
import jakarta.validation.constraints.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Getter @Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RegisterRequest {
    @NotBlank(message = "FULLNAME_REQUIRED")
    String fullName;

    @Email(message = "INVALID_EMAIL") @NotBlank(message = "EMAIL_REQUIRED")
    String email;

    @NotBlank(message = "PASSWORD_REQUIRED") @Size(min = 6, max = 20, message = "INVALID_PASSWORD")
    String password;

    @PastOrPresent(message = "INVALID_DOB")
    LocalDate dateOfBirth;

    @NotNull(message = "GENDER_REQUIRED")
    User.Gender gender;

    @NotBlank(message = "OTP_REQUIRED")
    String otp;
}
