package com.ticketrush.backend.controller;

import com.ticketrush.backend.dto.request.EventRequest;
import com.ticketrush.backend.dto.response.ApiResponse;
import com.ticketrush.backend.dto.response.EventResponse;
import com.ticketrush.backend.entity.Event;
import com.ticketrush.backend.exception.AppException;
import com.ticketrush.backend.exception.ErrorCode;
import com.ticketrush.backend.repository.UserRepository;
import com.ticketrush.backend.service.EventService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/api")
@RequiredArgsConstructor
public class EventController {
    EventService eventService;
    UserRepository userRepository;

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

    @PutMapping("/admin/events/{id}")
    public ApiResponse<EventResponse> updateEvent(
            @PathVariable Integer id,
            @Valid @RequestBody EventRequest request
    ) {
       EventResponse eventResponse = eventService.updateEvent(request, id);
       return ApiResponse.success(eventResponse);
    }
}
