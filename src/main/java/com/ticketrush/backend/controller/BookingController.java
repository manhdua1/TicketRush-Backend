package com.ticketrush.backend.controller;

import com.ticketrush.backend.dto.request.BookingRequest;
import com.ticketrush.backend.dto.response.ApiResponse;
import com.ticketrush.backend.dto.response.BookingResponse;
import com.ticketrush.backend.repository.UserRepository;
import com.ticketrush.backend.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Bookings", description = "Đặt vé và thanh toán")
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BookingController {
    BookingService bookingService;
    UserRepository userRepository;

    @Operation(summary = "Giữ ghế")
    @PostMapping
    public ApiResponse<BookingResponse> lockSeats(
            @Valid @RequestBody BookingRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer userId = extractUserId(userDetails);
        return ApiResponse.success(bookingService.lockSeats(request, userId));
    }

    @Operation(summary = "Xác nhận thanh toán")
    @PostMapping("/{bookingId}/confirm")
    public ApiResponse<BookingResponse> confirmBooking(
            @PathVariable Integer bookingId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer userId = extractUserId(userDetails);
        return ApiResponse.success(bookingService.confirmBooking(bookingId, userId));
    }

    @Operation(summary = "Huỷ booking")
    @DeleteMapping("/{bookingId}")
    public ApiResponse<Void> cancelBooking(
            @PathVariable Integer bookingId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer userId = extractUserId(userDetails);
        bookingService.cancelBooking(bookingId, userId);
        return ApiResponse.success(null);
    }

    private Integer extractUserId(UserDetails userDetails) {
        // Lấy userId từ JWT thông qua UserDetails
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow()
                .getId();
    }
}
