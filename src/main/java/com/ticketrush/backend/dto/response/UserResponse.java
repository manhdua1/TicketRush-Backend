package com.ticketrush.backend.dto.response;

import com.ticketrush.backend.entity.User;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class UserResponse {
    Integer id;
    String email;
    String fullName;
    LocalDate dateOfBirth;
    User.Gender gender;
    User.Role role = User.Role.CUSTOMER;
    LocalDateTime createdAt = LocalDateTime.now();
}
