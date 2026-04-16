package com.ticketrush.backend.controller;

import com.ticketrush.backend.dto.request.LoginRequest;
import com.ticketrush.backend.dto.request.RegisterRequest;
import com.ticketrush.backend.dto.response.ApiResponse;
import com.ticketrush.backend.dto.response.AuthResponse;
import com.ticketrush.backend.dto.response.UserResponse;
import com.ticketrush.backend.entity.User;
import com.ticketrush.backend.repository.UserRepository;
import com.ticketrush.backend.service.AuthService;
import io.jsonwebtoken.security.Password;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {
    AuthService authService;

    @PostMapping("/register")
    public ApiResponse<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.success(authService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@RequestBody LoginRequest request) {
        return ApiResponse.success(authService.login(request));
    }
}
