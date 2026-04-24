package com.ticketrush.backend.init;

import com.ticketrush.backend.entity.User;
import com.ticketrush.backend.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;

    @Override
    public void run(String @NonNull ... args) throws Exception {
        String adminEmail = "admin@ticketrush.com";

        if (userRepository.existsByEmail(adminEmail))
            return;

        User admin = User.builder()
                .fullName("Admin")
                .email("admin@ticketrush.com")
                .passwordHash(passwordEncoder.encode("admin123"))
                .role(User.Role.ADMIN)
                .gender(User.Gender.OTHER)
                .build();

        userRepository.save(admin);
        log.info("Default admin created: admin@ticketrush.com / admin123");
    }
}
