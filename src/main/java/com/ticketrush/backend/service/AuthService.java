package com.ticketrush.backend.service;

import com.ticketrush.backend.dto.request.LoginRequest;
import com.ticketrush.backend.dto.request.RegisterRequest;
import com.ticketrush.backend.dto.response.AuthResponse;
import com.ticketrush.backend.dto.response.UserResponse;
import com.ticketrush.backend.entity.User;
import com.ticketrush.backend.exception.AppException;
import com.ticketrush.backend.exception.ErrorCode;
import com.ticketrush.backend.mapper.UserMapper;
import com.ticketrush.backend.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class AuthService {
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;
    UserMapper userMapper;
    JwtService jwtService;

    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        String passwordHashed = passwordEncoder.encode(request.getPassword());

        User user = User.builder()
                .email(request.getEmail())
                .fullName(request.getFullName())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .passwordHash(passwordHashed)
                .role(User.Role.CUSTOMER)
                .createdAt(LocalDateTime.now())
                .build();

        userRepository.save(user);

        return userMapper.toUserResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_CREDENTIALS));

        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());



        if (!authenticated)
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);

        var token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .authenticated(true)
                .build();
    }
}
