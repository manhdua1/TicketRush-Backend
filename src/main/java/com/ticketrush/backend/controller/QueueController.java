package com.ticketrush.backend.controller;

import com.ticketrush.backend.dto.response.ApiResponse;
import com.ticketrush.backend.dto.response.QueueJoinResponse;
import com.ticketrush.backend.dto.response.QueueStatusResponse;
import com.ticketrush.backend.exception.AppException;
import com.ticketrush.backend.exception.ErrorCode;
import com.ticketrush.backend.repository.UserRepository;
import com.ticketrush.backend.service.QueueService;
import com.ticketrush.backend.util.QueueCookieUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Queue", description = "Hàng chờ ảo")
@RestController
@RequestMapping("/api/queue")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class QueueController {
    QueueService queueService;
    UserRepository userRepository;

    @Operation(summary = "Xin vào hàng chờ")
    @PostMapping("/join/{eventId}")
    public ApiResponse<QueueJoinResponse> joinQueue(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletResponse response) {
        Integer userId = extractUserId(userDetails);
        QueueJoinResponse queueResponse = queueService.joinQueue(eventId, userId);

        ResponseCookie queueCookie = ResponseCookie.from(QueueCookieUtils.cookieName(eventId), queueResponse.getToken())
                .httpOnly(true)
                .path("/")
                .maxAge(queueService.getTokenCookieTtl())
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, queueCookie.toString());

        return ApiResponse.success(hideQueueToken(queueResponse));
    }

    @Operation(summary = "Thoát khỏi hàng chờ")
    @DeleteMapping("/leave/{eventId}")
    public ApiResponse<Void> leaveQueue(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request,
            HttpServletResponse response) {
        Integer userId = extractUserId(userDetails);
        QueueCookieUtils.getQueueToken(request, eventId)
                .ifPresent(token -> queueService.leaveQueue(token, userId, eventId));
        clearQueueCookie(response, eventId);
        return ApiResponse.success(null);
    }

    @Operation(summary = "Kiểm tra vị trí hàng chờ")
    @GetMapping("/status/{eventId}")
    public ApiResponse<QueueStatusResponse> getStatus(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request) {
        Integer userId = extractUserId(userDetails);
        String token = QueueCookieUtils.getQueueToken(request, eventId)
                .orElseThrow(() -> new AppException(ErrorCode.QUEUE_TOKEN_REQUIRED));
        return ApiResponse.success(queueService.getQueueStatus(token, userId, eventId));
    }

    @Operation(summary = "Heartbeat — giữ session active trong hàng chờ")
    @PostMapping("/heartbeat/{eventId}")
    public ApiResponse<Void> heartbeat(
            @PathVariable Integer eventId,
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer userId = extractUserId(userDetails);
        queueService.trackActiveUser(eventId, userId);
        return ApiResponse.success(null);
    }

    @Operation(summary = "Kiểm tra event có yêu cầu hàng chờ không")
    @GetMapping("/check/{eventId}")
    public ApiResponse<Boolean> isQueueRequired(@PathVariable Integer eventId) {
        return ApiResponse.success(queueService.isQueueRequired(eventId));
    }

    private Integer extractUserId(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow().getId();
    }

    private QueueJoinResponse hideQueueToken(QueueJoinResponse response) {
        return QueueJoinResponse.builder()
                .position(response.getPosition())
                .totalInQueue(response.getTotalInQueue())
                .message(response.getMessage())
                .build();
    }

    private void clearQueueCookie(HttpServletResponse response, Integer eventId) {
        ResponseCookie deleteCookie = ResponseCookie.from(QueueCookieUtils.cookieName(eventId), "")
                .httpOnly(true)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, deleteCookie.toString());
    }
}
