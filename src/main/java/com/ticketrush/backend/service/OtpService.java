package com.ticketrush.backend.service;

import com.ticketrush.backend.exception.AppException;
import com.ticketrush.backend.exception.ErrorCode;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Random;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class OtpService {
    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${otp.expiration:120}")
    private long otpExpiration;

    private static final String OTP_PREFIX = "otp:";

    public String generateOtp(String email) {
        if (hasOtp(email)) {
            long ttl = getOtpTtl(email);
            throw new AppException(ErrorCode.OTP_EXISTED,
                    "OTP đã tồn tại, vui lòng thử lại sau " + ttl + " giây");
        }

        String otp = String.format("%06d", new Random().nextInt(999999));
        redisTemplate.opsForValue().set(
                OTP_PREFIX + email, otp, Duration.ofSeconds(otpExpiration)
        );
        return otp;
    }

    public boolean verifyOtp(String email, String otp) {
        Object stored = redisTemplate.opsForValue().get(OTP_PREFIX + email);
        if (stored == null) return false;
        boolean valid = stored.toString().equals(otp);
        if (valid) redisTemplate.delete(OTP_PREFIX + email);
        return valid;
    }

    public boolean hasOtp(String email) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(OTP_PREFIX + email));
    }

    public long getOtpTtl(String email) {
        Long ttl = redisTemplate.getExpire(OTP_PREFIX + email, TimeUnit.SECONDS);
        return (ttl != null && ttl > 0) ? ttl : 0;
    }
}
