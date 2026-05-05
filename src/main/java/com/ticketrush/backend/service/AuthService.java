package com.ticketrush.backend.service;

import com.ticketrush.backend.dto.request.ChangePasswordRequest;
import com.ticketrush.backend.dto.request.LoginRequest;
import com.ticketrush.backend.dto.request.RegisterRequest;
import com.ticketrush.backend.dto.request.ResetPasswordRequest;
import com.ticketrush.backend.dto.response.AuthResponse;
import com.ticketrush.backend.dto.response.UserDetailsResponse;
import com.ticketrush.backend.dto.response.UserResponse;
import com.ticketrush.backend.entity.User;
import com.ticketrush.backend.exception.AppException;
import com.ticketrush.backend.exception.ErrorCode;
import com.ticketrush.backend.mapper.UserMapper;
import com.ticketrush.backend.repository.UserRepository;
import com.ticketrush.backend.security.JwtService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;
    UserMapper userMapper;
    JwtService jwtService;
    OtpService otpService;
    EmailService emailService;

    public void sendRegisterOtp(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        String otp = otpService.generateOtp("register:" + email);
        emailService.sendOtp(email, otp, "[TicketRush] Mã xác thực đăng ký");
    }

    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        if (!otpService.verifyOtp("register:" + request.getEmail(), request.getOtp())) {
            throw new AppException(ErrorCode.INVALID_OTP);
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

    public void sendForgotPasswordOtp(String email) {
        if (!userRepository.existsByEmail(email)) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
        String otp = otpService.generateOtp("reset:" + email);
        emailService.sendOtp(email, otp, "[TicketRush] Mã xác thực đặt lại mật khẩu)");
    }

    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!otpService.verifyOtp("reset:" + request.getEmail(), request.getOtp())) {
            throw new AppException(ErrorCode.INVALID_OTP);
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public void changePassword(ChangePasswordRequest request, Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        String oldPassword = user.getPasswordHash();

        if (!passwordEncoder.matches(request.getCurrentPassword(), oldPassword)) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public AuthResponse login(LoginRequest request) {
        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_CREDENTIALS));

        boolean authenticated = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());

        log.info(String.valueOf(authenticated));

        if (!authenticated)
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);

        var token = jwtService.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .build();
    }

    public UserDetailsResponse getMe(UserDetails userDetails) {
        String role = userDetails.getAuthorities().stream()
                .findFirst()
                .map(GrantedAuthority::getAuthority)
                .orElse(null);

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return UserDetailsResponse.builder()
                .email(userDetails.getUsername())
                .avatarUrl(user.getAvatarUrl())
                .role(role)
                .build();
    }
}
