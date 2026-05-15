package com.ticketrush.backend.controller;

import com.ticketrush.backend.dto.request.EventRequest;
import com.ticketrush.backend.dto.request.EventStatusRequest;
import com.ticketrush.backend.dto.request.SpotlightRequest;
import com.ticketrush.backend.dto.response.ApiResponse;
import com.ticketrush.backend.dto.response.EventResponse;
import com.ticketrush.backend.dto.response.PageResponse;
import com.ticketrush.backend.entity.Event;
import com.ticketrush.backend.exception.AppException;
import com.ticketrush.backend.exception.ErrorCode;
import com.ticketrush.backend.repository.UserRepository;
import com.ticketrush.backend.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Tag(name = "Events", description = "Quản lý sự kiện")
@RestController
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/api")
@RequiredArgsConstructor
public class EventController {
    EventService eventService;
    UserRepository userRepository;

    @Operation(summary = "Tạo sự kiện")
    @PostMapping("/admin/events")
    public ApiResponse<EventResponse> createEvent(
            @Valid @RequestBody EventRequest request,
            @AuthenticationPrincipal UserDetails userDetails
            ) {
        Integer adminId = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND)).getId();

        EventResponse eventResponse = eventService.createEvent(request, adminId);

        return ApiResponse.success(eventResponse);
    }

    @Operation(summary = "Cập nhật sự kiện")
    @PutMapping("/admin/events/{id}")
    public ApiResponse<EventResponse> updateEvent(
            @PathVariable Integer id,
            @Valid @RequestBody EventRequest request
    ) {
       EventResponse eventResponse = eventService.updateEvent(request, id);
       return ApiResponse.success(eventResponse);
    }

    @Operation(summary = "Lấy tất cả sự kiện (mọi trạng thái)")
    @GetMapping("/admin/events")
    public ApiResponse<List<EventResponse>> getAllEvents() {
        return ApiResponse.success(eventService.getAllEvents());
    }

    @Operation(summary = "Lấy sự kiện đang mở bán")
    @GetMapping("/events/on-sale")
    public ApiResponse<List<EventResponse>> getOnSaleEvents() {
        return ApiResponse.success(eventService.getOnSaleEvents());
    }

    @Operation(summary = "Lấy sự kiện theo id")
    @GetMapping("/events/{id}")
    public ApiResponse<EventResponse> getEventById(@PathVariable Integer id) {
        return ApiResponse.success(eventService.getEventById(id));
    }

    @Operation(summary = "Lấy sự kiện spotlight")
    @GetMapping("/events/spotlight")
    public ApiResponse<EventResponse> getSpotlightEvent() {
        return ApiResponse.success(eventService.getSpotlightEvent());
    }

    @Operation(summary = "Lấy sự kiện + thông tin hàng chờ (cho user đã đăng nhập)")
    @GetMapping("/events/{id}/detail")
    public ApiResponse<EventResponse> getEventDetail(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer userId = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND)).getId();
        return ApiResponse.success(eventService.getEventByIdForUser(id, userId));
    }

    @Operation(summary = "Thay đổi trạng thái sự kiện (Admin)")
    @PatchMapping("/admin/events/{id}/status")
    public ApiResponse<EventResponse> changeStatus(
            @PathVariable Integer id,
            @Valid @RequestBody EventStatusRequest request) {
        return ApiResponse.success(eventService.changeStatus(id, request.getStatus()));
    }

    @Operation(summary = "Set hoặc bỏ spotlight (Admin)")
    @PatchMapping("/admin/events/{id}/spotlight")
    public ApiResponse<EventResponse> setSpotlight(
            @PathVariable Integer id,
            @Valid @RequestBody SpotlightRequest request) {
        return ApiResponse.success(eventService.setSpotlight(id, request.getSpotlight()));
    }

    @Operation(summary = "Lấy sự kiện theo thể loại")
    @GetMapping("/events/by-type")
    public ApiResponse<List<EventResponse>> getEventsByType(@RequestParam(required = false) Event.Type type) {
        return ApiResponse.success(eventService.getEventByType(type));
    }

    @Operation(summary = "Tìm kiếm sự kiện ON_SALE theo tên và/hoặc thể loại, có phân trang")
    @GetMapping("/events")
    public ApiResponse<PageResponse<EventResponse>> searchEvents(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Event.Type type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dstfrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dstto,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.success(eventService.searchEvents(name, type, dstfrom, dstto, page, size));
    }

    @Operation(summary = "Lấy 6 sự kiện có tỉ lệ đặt ghế cao nhất")
    @GetMapping("/events/trending")
    public ApiResponse<List<EventResponse>> getTrendingEvents() {
        return ApiResponse.success(eventService.getTrendingEvents());
    }
}
