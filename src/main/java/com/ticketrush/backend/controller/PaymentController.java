package com.ticketrush.backend.controller;

import com.ticketrush.backend.dto.response.ApiResponse;
import com.ticketrush.backend.exception.AppException;
import com.ticketrush.backend.exception.ErrorCode;
import com.ticketrush.backend.repository.UserRepository;
import com.ticketrush.backend.service.BookingService;
import com.ticketrush.backend.service.VNPayService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PaymentController {
    BookingService bookingService;
    VNPayService vnPayService;
    UserRepository userRepository;

    @PostMapping("/create/{bookingId}")
    public ApiResponse<String> createPayment(
            @PathVariable Integer bookingId,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest request) throws Exception {
        Integer userId = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND)).getId();
        String ipAddr = request.getRemoteAddr();
        String url = bookingService.createPayment(bookingId, userId, ipAddr);
        return ApiResponse.success(url);
    }

    // VNPAY gọi về sau khi thanh toán
    @GetMapping("/ipn")
    public ResponseEntity<Map<String, String>> ipn(@RequestParam Map<String, String> params) {
        try {
            if (!vnPayService.verifyIpn(new HashMap<>(params))) {
                return ResponseEntity.ok(Map.of("RspCode", "97", "Message", "Invalid Checksum"));
            }

            String txnRef = params.get("vnp_TxnRef");
            String responseCode = params.get("vnp_ResponseCode");
            Integer bookingId = Integer.parseInt(txnRef);

            if ("00".equals(responseCode)) {
                bookingService.confirmBookingBySystem(bookingId);
            }

            return ResponseEntity.ok(Map.of("RspCode", "00", "Message", "Confirm Success"));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("RspCode", "99", "Message", "Unknown error"));
        }
    }

    // Return URL — chỉ hiển thị kết quả cho user
    @GetMapping("/return")
    public ApiResponse<String> returnUrl(@RequestParam Map<String, String> params) {
        String responseCode = params.get("vnp_ResponseCode");
        if ("00".equals(responseCode)) {
            return ApiResponse.success("Thanh toán thành công");
        }
        return ApiResponse.error(ErrorCode.PAYMENT_FAILED);
    }
}
