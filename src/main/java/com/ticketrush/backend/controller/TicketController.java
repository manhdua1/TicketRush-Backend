package com.ticketrush.backend.controller;

import com.ticketrush.backend.dto.response.ApiResponse;
import com.ticketrush.backend.dto.response.TicketResponse;
import com.ticketrush.backend.repository.UserRepository;
import com.ticketrush.backend.service.TicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "Tickets", description = "Quản lý vé điện tử")
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TicketController {
    TicketService ticketService;
    UserRepository userRepository;

    @Operation(summary = "Danh sách vé của tôi")
    @GetMapping("/myTickets")
    public ApiResponse<List<TicketResponse>> getMyTickets(
            @AuthenticationPrincipal UserDetails userDetails) {
        Integer userId = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow().getId();
        return ApiResponse.success(
                ticketService.getMyTickets(userId));
    }

    @Operation(summary = "Xem chi tiết vé theo QR Code")
    @GetMapping("/tickets/{qrCode}")
    public ApiResponse<TicketResponse> getTicketByQrCode(
            @PathVariable String qrCode) {
        return ApiResponse.success(ticketService.getTicketByQrCode(qrCode));
    }
}
