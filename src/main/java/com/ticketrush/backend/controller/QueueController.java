package com.ticketrush.backend.controller;

import com.ticketrush.backend.dto.response.ApiResponse;
import com.ticketrush.backend.dto.response.QueueJoinResponse;
import com.ticketrush.backend.dto.response.QueueStatusResponse;
import com.ticketrush.backend.repository.UserRepository;
import com.ticketrush.backend.service.QueueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Queue", description = "Hàng chờ ảo")
@RestController
@RequestMapping("/api/queue")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class QueueController {
    QueueService queueService;
    UserRepository userRepository;

    @Operation(summary = "Xin vào hàng chờ")
    @PostMapping("/join/{eventId}")
    public ApiResponse<QueueJoinResponse> joinQueue(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer userId = extractUserId(userDetails);
        return ApiResponse.success(queueService.joinQueue(eventId, userId));
    }

    @Operation(summary = "Kiểm tra vị trí hàng chờ")
    @GetMapping("/status/{token}")
    public ApiResponse<QueueStatusResponse> getStatus(@PathVariable String token) {
        return ApiResponse.success(queueService.getQueueStatus(token));
    }

    private Integer extractUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow().getId();
    }
}
