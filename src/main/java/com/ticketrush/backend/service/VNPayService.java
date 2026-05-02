package com.ticketrush.backend.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VNPayService {
    @Value("${vnpay.tmn-code}")
    String tmnCode;

    @Value("${vnpay.hash-secret}")
    String hashSecret;

    @Value("${vnpay.pay-url}")
    String payUrl;

    @Value("${vnpay.return-url}")
    String returnUrl;

    public String createPaymentUrl(Integer bookingId, BigDecimal amount, String ipAddr) throws Exception {
        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", tmnCode);
        params.put("vnp_Amount", String.valueOf(amount.multiply(BigDecimal.valueOf(100)).longValue()));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", bookingId.toString());
        params.put("vnp_OrderInfo", "Thanh toan booking " + bookingId);
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", returnUrl);
        params.put("vnp_IpAddr", ipAddr);

        SimpleDateFormat fmt = new SimpleDateFormat("yyyyMMddHHmmss");
        fmt.setTimeZone(TimeZone.getTimeZone("GMT+7"));
        String now = fmt.format(new Date());
        params.put("vnp_CreateDate", now);

        Calendar cal = Calendar.getInstance(TimeZone.getTimeZone("GMT+7"));
        cal.add(Calendar.MINUTE, 15);
        params.put("vnp_ExpireDate", fmt.format(cal.getTime()));

        // Build hash data
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();
        params.forEach((k, v) -> {
            try {
                hashData.append(k).append('=').append(URLEncoder.encode(v, StandardCharsets.US_ASCII));
                query.append(URLEncoder.encode(k, StandardCharsets.US_ASCII))
                        .append('=').append(URLEncoder.encode(v, StandardCharsets.US_ASCII));
                hashData.append('&');
                query.append('&');
            } catch (Exception ignored) {}
        });
        // Xoá dấu & cuối
        String hashStr = hashData.substring(0, hashData.length() - 1);
        String queryStr = query.substring(0, query.length() - 1);

        String secureHash = hmacSHA512(hashSecret, hashStr);
        return payUrl + "?" + queryStr + "&vnp_SecureHash=" + secureHash;
    }

    public boolean verifyIpn(Map<String, String> params) {
        String receivedHash = params.remove("vnp_SecureHash");
        params.remove("vnp_SecureHashType");

        Map<String, String> sorted = new TreeMap<>(params);
        StringBuilder hashData = new StringBuilder();
        sorted.forEach((k, v) -> {
            try {
                hashData.append(k).append('=')
                        .append(URLEncoder.encode(v, StandardCharsets.US_ASCII)).append('&');
            } catch (Exception ignored) {}
        });
        String hashStr = hashData.substring(0, hashData.length() - 1);
        String calculated = hmacSHA512(hashSecret, hashStr);
        return calculated.equals(receivedHash);
    }

    private String hmacSHA512(String key, String data) throws RuntimeException {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
