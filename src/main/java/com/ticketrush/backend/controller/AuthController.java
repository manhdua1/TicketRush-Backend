package com.ticketrush.backend.controller;

import com.ticketrush.backend.dto.request.*;
import com.ticketrush.backend.dto.response.ApiResponse;
import com.ticketrush.backend.dto.response.AuthResponse;
import com.ticketrush.backend.dto.response.UserDetailsResponse;
import com.ticketrush.backend.dto.response.UserResponse;
import com.ticketrush.backend.exception.AppException;
import com.ticketrush.backend.exception.ErrorCode;
import com.ticketrush.backend.repository.UserRepository;
import com.ticketrush.backend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;


@Tag(name = "Authentication", description = "Đăng ký và đăng nhập")
@RestController
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    AuthService authService;
    UserRepository userRepository;

    @Operation(summary = "Gửi OTP đăng ký")
    @PostMapping("/send-register-otp")
    public ApiResponse<Void> sendRegisterOtp(@Valid @RequestBody SendOtpRequest request) {
        authService.sendRegisterOtp(request.getEmail());
        return ApiResponse.success(null);
    }

    @Operation(summary = "Đăng ký tài khoản mới")
    @PostMapping("/register")
    public ApiResponse<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.success(authService.register(request));
    }

    @Operation(summary = "Đăng nhập vào tài khoản và nhận jwt")
    @PostMapping("/login")
    public ApiResponse<Void> login(@Valid @RequestBody LoginRequest request,
                                           HttpServletResponse response) {
        AuthResponse auth = authService.login(request);

        ResponseCookie accessCookie = ResponseCookie.from("access_token", auth.getToken())
                .httpOnly(true)
                .path("/")
                .maxAge(Duration.ofDays(7))
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());

        return ApiResponse.success(null);
    }

    @Operation(summary = "Gửi OTP quên mật khẩu")
    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@Valid @RequestBody SendOtpRequest request) {
        authService.sendForgotPasswordOtp(request.getEmail());
        return ApiResponse.success(null);
    }

    @Operation(summary = "Đặt lại mật khẩu")
    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ApiResponse.success(null);
    }

    @Operation(summary = "Đổi mật khẩu (cần đăng nhập)")
    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer userId = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow().getId();
        authService.changePassword(request, userId);
        return ApiResponse.success(null);
    }

    @Operation(summary = "Đăng xuất")
    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletResponse response) {

        ResponseCookie deleteCookie = ResponseCookie.from("access_token", "")
                .httpOnly(true)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, deleteCookie.toString());

        return ApiResponse.success(null);
    }

    @GetMapping("/me")
    public ApiResponse<UserDetailsResponse> getMe(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) throw new AppException(ErrorCode.UNAUTHENTICATED);
        return ApiResponse.success(authService.getMe(userDetails));
    }
}
