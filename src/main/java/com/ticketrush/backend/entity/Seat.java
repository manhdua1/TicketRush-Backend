package com.ticketrush.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "seats")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Seat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "zone_id", nullable = false)
    Zone zone;

    @Column(name = "seat_row", nullable = false)
    Integer rowNumber;

    @Column(name = "seat_col", nullable = false)
    Integer colNumber;

    @Column(length = 10)
    String label;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    Status status = Status.AVAILABLE;

    public enum Status { AVAILABLE, LOCKED, SOLD }
}