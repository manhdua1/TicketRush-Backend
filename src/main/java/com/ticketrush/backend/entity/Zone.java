package com.ticketrush.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "zones")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Zone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    Event event;

    @Column(nullable = false)
    String name;

    @Column(nullable = false, precision = 12, scale = 0)
    BigDecimal price;

    @Column(name = "color_hex", length = 7)
    String colorHex;

    @OneToMany(mappedBy = "zone", cascade = CascadeType.ALL)
    List<Seat> seats = new ArrayList<>();
}
