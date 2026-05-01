package com.ticketrush.backend.controller;

import com.ticketrush.backend.dto.response.ApiResponse;
import com.ticketrush.backend.dto.response.AudienceStatsResponse;
import com.ticketrush.backend.dto.response.EventStatsResponse;
import com.ticketrush.backend.service.StatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Admin Stats", description = "Thống kê dành cho Admin")
@RestController
@RequestMapping("/api/admin/events")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StatsController {
    StatsService statsService;

    @Operation(summary = "Thống kê doanh thu và tỉ lệ lấp đầy ghế")
    @GetMapping("/{id}/stats")
    public ApiResponse<EventStatsResponse> getEventStats(
            @PathVariable Integer id) {
        return ApiResponse.success(
                statsService.getEventStats(id));
    }

    @Operation(summary = "Thống kê khán giả theo độ tuổi và giới tính")
    @GetMapping("/{id}/audience")
    public ApiResponse<AudienceStatsResponse> getAudienceStats(
            @PathVariable Integer id) {
        return ApiResponse.success(statsService.getAudienceStats(id));
    }
}
