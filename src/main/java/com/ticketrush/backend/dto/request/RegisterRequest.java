package com.ticketrush.backend.dto.request;

import com.ticketrush.backend.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
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

    @NotBlank @Size(min = 6, max = 20, message = "INVALID_PASSWORD")
    private String password;

    @PastOrPresent
    private LocalDate dateOfBirth;

    private User.Gender gender;
}
