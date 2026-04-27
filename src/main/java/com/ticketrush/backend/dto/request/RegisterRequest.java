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
    private String fullName;

    @Email(message = "INVALID_EMAIL") @NotBlank(message = "EMAIL_REQUIRED")
    private String email;

    @NotBlank(message = "PASSWORD_REQUIRED") @Size(min = 6, max = 20, message = "INVALID_PASSWORD")
    private String password;

    @PastOrPresent(message = "INVALID_DOB")
    private LocalDate dateOfBirth;

    @NotNull(message = "GENDER_REQUIRED")
    private User.Gender gender;
}
