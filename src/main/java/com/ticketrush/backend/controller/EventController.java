package com.ticketrush.backend.controller;

import com.ticketrush.backend.dto.request.EventRequest;
import com.ticketrush.backend.dto.request.EventStatusRequest;
import com.ticketrush.backend.dto.response.ApiResponse;
import com.ticketrush.backend.dto.response.EventResponse;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

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

    @Operation(summary = "Lấy sự kiện đang mở bán")
    @GetMapping("/events")
    public ApiResponse<List<EventResponse>> getOnSaleEvents() {
        return ApiResponse.success(eventService.getOnSaleEvents());
    }

    @Operation(summary = "Lấy sự kiện theo id")
    @GetMapping("/events/{id}")
    public ApiResponse<EventResponse> getEventById(@PathVariable Integer id) {
        return ApiResponse.success(eventService.getEventById(id));
    }

    @Operation(summary = "Thay đổi trạng thái sự kiện (Admin)")
    @PatchMapping("/admin/events/{id}/status")
    public ApiResponse<EventResponse> changeStatus(
            @PathVariable Integer id,
            @Valid @RequestBody EventStatusRequest request) {
        return ApiResponse.success(eventService.changeStatus(id, request.getStatus()));
    }
}
