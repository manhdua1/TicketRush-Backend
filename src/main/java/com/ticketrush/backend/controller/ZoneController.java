package com.ticketrush.backend.controller;

import com.ticketrush.backend.dto.request.ZoneRequest;
import com.ticketrush.backend.dto.response.ApiResponse;
import com.ticketrush.backend.dto.response.ZoneResponse;
import com.ticketrush.backend.service.ZoneService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Zones", description = "Quản lý khu vực ghế")
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ZoneController {
    ZoneService zoneService;

    @Operation(summary = "Tạo khu vực ghế cho sự kiện")
    @PostMapping("/events/{eventId}/zones")
    public ApiResponse<ZoneResponse> createZone(
            @PathVariable Integer eventId,
            @Valid @RequestBody ZoneRequest request) {
        return ApiResponse.success(zoneService.createZone(request, eventId));
    }
}
