package com.ticketrush.backend.controller;

import com.ticketrush.backend.dto.response.ApiResponse;
import com.ticketrush.backend.dto.response.SeatResponse;
import com.ticketrush.backend.service.SeatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Seats", description = "Sơ đồ ghế")
@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SeatController {
    SeatService seatService;

    @Operation(summary = "Lấy toàn bộ ghế của sự kiện")
    @GetMapping("/{eventId}/seats")
    public ApiResponse<List<SeatResponse>> getSeatsByEvent(
            @PathVariable Integer eventId) {
        return ApiResponse.success(seatService.getSeatsByEvent(eventId));
    }
}
