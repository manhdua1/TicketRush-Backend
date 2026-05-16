package com.ticketrush.backend.controller;

import com.ticketrush.backend.dto.request.RevenueTrendPeriod;
import com.ticketrush.backend.dto.response.ApiResponse;
import com.ticketrush.backend.dto.response.AudienceStatsResponse;
import com.ticketrush.backend.dto.response.EventStatsResponse;
import com.ticketrush.backend.dto.response.OnSaleLowTicketEventResponse;
import com.ticketrush.backend.dto.response.RevenueTrendResponse;
import com.ticketrush.backend.service.StatsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

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

    @GetMapping("/on-sale-revenue")
    public ApiResponse<BigDecimal> getAllOnSaleEventsRevenue() {
        return ApiResponse.success(statsService.getAllOnSaleEventsRevenue());
    }

    @Operation(summary = "Tong ve da ban cua cac su kien dang ON_SALE")
    @GetMapping("/on-sale-sold-tickets")
    public ApiResponse<Long> getAllOnSaleEventsSoldTickets() {
        return ApiResponse.success(statsService.getAllOnSaleEventsSoldTickets());
    }

    @Operation(summary = "Bien dong doanh thu theo 1 ngay, 7 ngay hoac 1 thang")
    @GetMapping("/revenue-trend")
    public ApiResponse<RevenueTrendResponse> getRevenueTrend(
            @RequestParam(defaultValue = "DAY") RevenueTrendPeriod period) {
        return ApiResponse.success(statsService.getRevenueTrend(period));
    }

    @Operation(summary = "Cac su kien ON_SALE con it ve duoi 10 phan tram")
    @GetMapping("/on-sale-low-tickets")
    public ApiResponse<List<OnSaleLowTicketEventResponse>> getLowTicketOnSaleEvents() {
        return ApiResponse.success(statsService.getLowTicketOnSaleEvents());
    }
}
