package com.ticketrush.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seat_id", nullable = false)
    Seat seat;

    @Column(name = "qr_code", nullable = false, unique = true)
    String qrCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    Status status = Status.ACTIVE;

    @Column(name = "issued_at", updatable = false)
    LocalDateTime issuedAt = LocalDateTime.now();

    public enum Status { ACTIVE, USED, CANCELLED }
}
