package com.ticketrush.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "events")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Integer id;

    @Column(nullable = false)
    String title;

    @Column(columnDefinition = "TEXT")
    String description;

    @Column(nullable = false)
    String venue;

    @Column(name = "event_date", nullable = false)
    LocalDateTime eventDate;

    @Column(name = "poster_url")
    String posterUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    Status status = Status.DRAFT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    User createdBy;

    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL)
    List<Zone> zones = new ArrayList<>();

    public enum Status { DRAFT, ON_SALE, ENDED }
}
