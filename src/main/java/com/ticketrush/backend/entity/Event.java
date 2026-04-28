package com.ticketrush.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

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

    @Column(name = "start_time", nullable = false)
    LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    LocalDateTime endTime;

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
    Set<Zone> zones = new HashSet<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    Type type;

    public enum Status { DRAFT, ON_SALE, ENDED }

    public enum Type {
        LIVE_MUSIC,
        PERFORMING_ARTS,
        SPORTS,
        SEMINARS_AND_WORKSHOPS,
        TOURS_AND_EXPERIENCES,
        OTHER
    }
}
