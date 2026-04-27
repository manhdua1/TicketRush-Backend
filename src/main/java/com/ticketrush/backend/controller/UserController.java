package com.ticketrush.backend.controller;

import com.ticketrush.backend.dto.request.UserUpdateRequest;
import com.ticketrush.backend.dto.response.ApiResponse;
import com.ticketrush.backend.dto.response.UserResponse;
import com.ticketrush.backend.service.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Users", description = "Quản lý người dùng")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserController {
    UserService userService;


    @GetMapping("/my-info")
    public ApiResponse<UserResponse> getMyInfo(@AuthenticationPrincipal UserDetails userDetails) {
        return ApiResponse.success(userService.getMyInfo(userDetails));
    }

    @PostMapping("/my-info")
    public ApiResponse<UserResponse> updateMyInfo(@Valid @RequestBody UserUpdateRequest request,
                                                  @AuthenticationPrincipal UserDetails userDetails) {
        return ApiResponse.success(userService.updateMyInfo(request, userDetails));
    }
}
