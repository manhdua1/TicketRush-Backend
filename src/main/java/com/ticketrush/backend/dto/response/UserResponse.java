package com.ticketrush.backend.dto.response;

import com.ticketrush.backend.entity.User;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    Integer id;
    String email;
    String fullName;
    LocalDate dateOfBirth;
    User.Gender gender;
    User.Role role;
    String avatarUrl;
    LocalDateTime createdAt;
}
