package com.ticketrush.backend.controller;

import com.ticketrush.backend.dto.request.LoginRequest;
import com.ticketrush.backend.dto.request.RegisterRequest;
import com.ticketrush.backend.dto.response.ApiResponse;
import com.ticketrush.backend.dto.response.AuthResponse;
import com.ticketrush.backend.dto.response.UserResponse;
import com.ticketrush.backend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@Tag(name = "Authentication", description = "Đăng ký và đăng nhập")
@RestController
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    AuthService authService;

    @Operation(summary = "Đăng ký tài khoản mới")
    @io.swagger.v3.oas.annotations.responses.ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "1000", description = "Đăng ký thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "1001", description = "Email đã được sử dụng"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "1003", description = "Họ và tên không được để trống"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "1004", description = "Email không được để trống"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "1005", description = "Email không đúng định dạng"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "1006", description = "Mật khẩu chỉ trong khoảng 6 đến 20 kí tự"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "9999", description = "Lỗi không xác định")
    })
    @PostMapping("/register")
    public ApiResponse<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.success(authService.register(request));
    }

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success(authService.login(request));
    }
}
