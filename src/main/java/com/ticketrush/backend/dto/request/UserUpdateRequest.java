package com.ticketrush.backend.dto.request;

import com.ticketrush.backend.entity.User;
import jakarta.validation.constraints.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Getter
@Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserUpdateRequest {
    @NotBlank(message = "FULLNAME_REQUIRED")
    String fullName;

    @PastOrPresent(message = "INVALID_DOB")
    LocalDate dateOfBirth;

    @NotNull(message = "GENDER_REQUIRED")
    User.Gender gender;
}
