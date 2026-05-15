package com.ticketrush.backend.init;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ticketrush.backend.entity.Event;
import com.ticketrush.backend.entity.Seat;
import com.ticketrush.backend.entity.User;
import com.ticketrush.backend.entity.Zone;
import com.ticketrush.backend.repository.EventRepository;
import com.ticketrush.backend.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Random;

@Component
@ConditionalOnProperty(name = "demo-data.ticketbox-events.enabled", havingValue = "true")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@Order(2)
public class DemoEventDataInitializer implements CommandLineRunner {
    static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    static final ZoneTemplate[] ZONE_TEMPLATES = {
            new ZoneTemplate("Standard", "#2E7D32"),
            new ZoneTemplate("Premium", "#1976D2"),
            new ZoneTemplate("VIP", "#C2185B"),
            new ZoneTemplate("VVIP", "#7B1FA2"),
            new ZoneTemplate("Balcony", "#F57C00")
    };

    EventRepository eventRepository;
    UserRepository userRepository;

    @Override
    @Transactional
    public void run(String @NonNull ... args) throws Exception {
        ClassPathResource resource = new ClassPathResource("ticketbox-demo-events.json");
        List<TicketBoxEventSeed> seeds;

        try (InputStream inputStream = resource.getInputStream()) {
            seeds = new ObjectMapper().readValue(inputStream, new TypeReference<List<TicketBoxEventSeed>>() {});
        }

        User admin = userRepository.findByEmail("admin@ticketrush.com").orElse(null);
        List<Event> eventsToSave = new ArrayList<>();
        int createdCount = 0;
        int updatedCount = 0;

        for (int i = 0; i < seeds.size(); i++) {
            TicketBoxEventSeed seed = seeds.get(i);
            LocalDateTime startTime = parseTicketBoxTime(seed.startTime());
            LocalDateTime endTime = parseTicketBoxTime(seed.endTime());
            String description = resolveDescription(seed);

            if (!endTime.isAfter(startTime)) {
                endTime = startTime.plusHours(3);
            }

            var existingEvent = eventRepository.findByTitleAndStartTime(seed.title(), startTime);
            if (existingEvent.isPresent()) {
                Event event = existingEvent.get();
                if (!description.equals(event.getDescription())) {
                    event.setDescription(description);
                    eventsToSave.add(event);
                    updatedCount++;
                }
                continue;
            }

            Event event = Event.builder()
                    .title(seed.title())
                    .description(description)
                    .venue(seed.venue())
                    .startTime(startTime)
                    .endTime(endTime)
                    .posterUrl(seed.posterUrl())
                    .spotlight(i == 0 && eventRepository.findFirstBySpotlightTrueOrderByStartTimeAsc().isEmpty())
                    .status(endTime.isBefore(LocalDateTime.now(VIETNAM_ZONE)) ? Event.Status.ENDED : Event.Status.ON_SALE)
                    .createdBy(admin)
                    .createdAt(LocalDateTime.now(VIETNAM_ZONE))
                    .zones(new HashSet<>())
                    .type(mapType(seed.categories()))
                    .build();

            attachZones(event, seed, i);
            eventsToSave.add(event);
            createdCount++;
        }

        if (eventsToSave.isEmpty()) {
            log.info("TicketBox demo events already exist; skipped seeding");
            return;
        }

        eventRepository.saveAll(eventsToSave);
        log.info("Created {} and updated {} TicketBox demo events", createdCount, updatedCount);
    }

    private LocalDateTime parseTicketBoxTime(String value) {
        return OffsetDateTime.parse(value)
                .atZoneSameInstant(VIETNAM_ZONE)
                .toLocalDateTime();
    }

    private String resolveDescription(TicketBoxEventSeed seed) {
        if (seed.description() == null || seed.description().isBlank()) {
            return seed.title();
        }
        return seed.description().trim();
    }

    private Event.Type mapType(List<String> categories) {
        String category = categories == null || categories.isEmpty() ? "" : categories.get(0);

        return switch (category) {
            case "music" -> Event.Type.LIVE_MUSIC;
            case "theatersandart" -> Event.Type.PERFORMING_ARTS;
            case "sport" -> Event.Type.SPORTS;
            case "seminarsworkshops" -> Event.Type.SEMINARS_AND_WORKSHOPS;
            case "attractionsexperiences" -> Event.Type.TOURS_AND_EXPERIENCES;
            default -> Event.Type.OTHER;
        };
    }

    private void attachZones(Event event, TicketBoxEventSeed seed, int eventIndex) {
        Random random = new Random(20260515L + seed.sourceId());
        int zoneCount = 3 + random.nextInt(3);
        long basePrice = Math.max(50_000L, seed.minPrice());

        for (int zoneIndex = 0; zoneIndex < zoneCount; zoneIndex++) {
            ZoneTemplate template = ZONE_TEMPLATES[(eventIndex + zoneIndex) % ZONE_TEMPLATES.length];
            int rows = 4 + random.nextInt(5);
            int cols = 8 + random.nextInt(7);

            Zone zone = Zone.builder()
                    .event(event)
                    .name(template.name())
                    .price(BigDecimal.valueOf(roundPrice(basePrice + (zoneIndex * Math.max(50_000L, basePrice / 3)))))
                    .colorHex(template.colorHex())
                    .totalRows(rows)
                    .totalCols(cols)
                    .seats(new HashSet<>())
                    .build();

            attachSeats(zone, rows, cols, random);
            event.getZones().add(zone);
        }
    }

    private void attachSeats(Zone zone, int rows, int cols, Random random) {
        for (int row = 1; row <= rows; row++) {
            for (int col = 1; col <= cols; col++) {
                Seat seat = Seat.builder()
                        .zone(zone)
                        .rowNumber(row)
                        .colNumber(col)
                        .label(rowLabel(row) + col)
                        .status(randomSeatStatus(random))
                        .build();
                zone.getSeats().add(seat);
            }
        }
    }

    private long roundPrice(long value) {
        return Math.round(value / 10_000.0) * 10_000L;
    }

    private String rowLabel(int row) {
        StringBuilder label = new StringBuilder();
        int value = row;

        while (value > 0) {
            value--;
            label.insert(0, (char) ('A' + value % 26));
            value /= 26;
        }

        return label.toString();
    }

    private Seat.Status randomSeatStatus(Random random) {
        int roll = random.nextInt(100);

        if (roll < 72) {
            return Seat.Status.AVAILABLE;
        }
        if (roll < 88) {
            return Seat.Status.SOLD;
        }
        return Seat.Status.LOCKED;
    }

    record TicketBoxEventSeed(
            int sourceId,
            String title,
            String description,
            String sourceUrl,
            String posterUrl,
            String venue,
            String address,
            String startTime,
            String endTime,
            long minPrice,
            List<String> categories
    ) {
    }

    record ZoneTemplate(String name, String colorHex) {
    }
}
