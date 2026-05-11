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

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Component
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {
    UserRepository userRepository;
    PasswordEncoder passwordEncoder;

    @Override
    public void run(String @NonNull ... args) throws Exception {
        createAdminAccount();
        create200users();
    }

    public void createAdminAccount() {
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

    public void create200users() {
        String hash = passwordEncoder.encode("123456");
        List<User> users = new ArrayList<>();
        Random random = new Random();
        User.Gender[] genders = User.Gender.values();

        for (int i = 1; i <= 200; i++) {
            String email = "user" + i + "@gmail.com";

            // Double check — bỏ qua nếu email đã tồn tại
            if (userRepository.existsByEmail(email)) continue;

            users.add(User.builder()
                    .email(email)
                    .passwordHash(hash)
                    .fullName("User " + i)
                    .dateOfBirth(LocalDate.now().minusYears(18 + random.nextInt(42)))
                    .gender(genders[random.nextInt(genders.length)])
                    .role(User.Role.CUSTOMER)
                    .build());
        }

        userRepository.saveAll(users);
        log.info("Created {} test users", users.size());
    }
}
