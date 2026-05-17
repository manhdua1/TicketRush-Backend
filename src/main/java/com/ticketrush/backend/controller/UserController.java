package com.ticketrush.backend.controller;

import com.ticketrush.backend.dto.request.UserUpdateRequest;
import com.ticketrush.backend.dto.response.ApiResponse;
import com.ticketrush.backend.dto.response.UserResponse;
import com.ticketrush.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

@Tag(name = "Users", description = "Quản lý người dùng")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserController {
    UserService userService;

    @Operation(summary = "Lấy thông tin user")
    @GetMapping("/my-info")
    public ApiResponse<UserResponse> getMyInfo(@AuthenticationPrincipal UserDetails userDetails) {
        return ApiResponse.success(userService.getMyInfo(userDetails));
    }

    @Operation(summary = "Cập nhật thông tin user")
    @PostMapping("/my-info")
    public ApiResponse<UserResponse> updateMyInfo(@Valid @RequestBody UserUpdateRequest request,
                                                  @AuthenticationPrincipal UserDetails userDetails) {
        return ApiResponse.success(userService.updateMyInfo(request, userDetails));
    }

    @Operation(summary = "Tải ảnh avatar")
    @PostMapping(value = "/my-info/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<UserResponse> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ApiResponse.success(userService.uploadAvatar(file, userDetails));
    }

    @Operation(summary = "Tổng chi tiêu của user đang đăng nhập")
    @GetMapping("/my-spending")
    public ApiResponse<BigDecimal> getMyTotalSpending(@AuthenticationPrincipal UserDetails userDetails) {
        return ApiResponse.success(userService.getMyTotalSpending(userDetails));
    }

    @Operation(summary = "Tổng chi tiêu của một user (Admin)")
    @GetMapping("/admin/users/{userId}/total-spending")
    public ApiResponse<BigDecimal> getUserTotalSpending(@PathVariable Integer userId) {
        return ApiResponse.success(userService.getUserTotalSpending(userId));
    }
}
