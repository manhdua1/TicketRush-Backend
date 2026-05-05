package com.ticketrush.backend.service;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EmailService {
    final JavaMailSender javaMailSender;

    @Value("${spring.mail.username}")
    String from;

    public void sendOtp(String to, String otp, String subject) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(
                "Mã OTP của bạn là: " + otp + "\n" +
                        "Mã có hiệu lực trong 5 phút.\n"
        );

        javaMailSender.send(message);
    }
}
