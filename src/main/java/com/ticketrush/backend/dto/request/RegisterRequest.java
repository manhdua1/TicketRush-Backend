package com.ticketrush.backend.dto.request;

import com.ticketrush.backend.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Getter @Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RegisterRequest {
    @NotBlank
    private String fullName;

    @Email @NotBlank
    private String email;

    @NotBlank @Size(min = 6)
    private String password;

    private LocalDate dateOfBirth;

    private User.Gender gender;
}
