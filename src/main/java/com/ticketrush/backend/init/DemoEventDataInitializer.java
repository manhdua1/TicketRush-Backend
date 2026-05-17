package com.ticketrush.backend.init;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ticketrush.backend.entity.Booking;
import com.ticketrush.backend.entity.BookingSeat;
import com.ticketrush.backend.entity.Event;
import com.ticketrush.backend.entity.Seat;
import com.ticketrush.backend.entity.Ticket;
import com.ticketrush.backend.entity.User;
import com.ticketrush.backend.entity.Zone;
import com.ticketrush.backend.repository.BookingRepository;
import com.ticketrush.backend.repository.BookingSeatRepository;
import com.ticketrush.backend.repository.EventRepository;
import com.ticketrush.backend.repository.TicketRepository;
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
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.Set;

@Component
@ConditionalOnProperty(name = "demo-data.ticketbox-events.enabled", havingValue = "true")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@Order(2)
public class DemoEventDataInitializer implements CommandLineRunner {
    static final ZoneId VIETNAM_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    static final int LOW_TICKET_EVENT_COUNT = 7;
    static final int LOW_TICKET_REMAINING_PERCENT = 20;
    static final ZoneTemplate[] ZONE_TEMPLATES = {
            new ZoneTemplate("Standard", "#2E7D32"),
            new ZoneTemplate("Premium", "#1976D2"),
            new ZoneTemplate("VIP", "#C2185B"),
            new ZoneTemplate("VVIP", "#7B1FA2"),
            new ZoneTemplate("Balcony", "#F57C00")
    };

    EventRepository eventRepository;
    UserRepository userRepository;
    BookingRepository bookingRepository;
    BookingSeatRepository bookingSeatRepository;
    TicketRepository ticketRepository;

    @Override
    @Transactional
    public void run(String @NonNull ... args) throws Exception {
        log.info("TicketBox demo event seeding uses JSON address as Event.venue and manual latitude/longitude");

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

            Event.Status status = endTime.isBefore(LocalDateTime.now(VIETNAM_ZONE))
                    ? Event.Status.ENDED
                    : Event.Status.ON_SALE;
            Event.Type type = mapType(seed.categories());
            var existingEvent = eventRepository.findFirstByTitle(seed.title());
            if (existingEvent.isPresent()) {
                Event event = existingEvent.get();
                event.setDescription(description);
                event.setVenue(resolveVenue(seed));
                event.setLatitude(seed.latitude());
                event.setLongitude(seed.longitude());
                event.setStartTime(startTime);
                event.setEndTime(endTime);
                event.setPosterUrl(seed.posterUrl());
                event.setStatus(status);
                event.setType(type);
                eventsToSave.add(event);
                updatedCount++;
                continue;
            }

            Event event = Event.builder()
                    .title(seed.title())
                    .description(description)
                    .venue(resolveVenue(seed))
                    .latitude(seed.latitude())
                    .longitude(seed.longitude())
                    .startTime(startTime)
                    .endTime(endTime)
                    .posterUrl(seed.posterUrl())
                    .spotlight(i == 0 && eventRepository.findFirstBySpotlightTrueOrderByStartTimeAsc().isEmpty())
                    .status(status)
                    .createdBy(admin)
                    .createdAt(LocalDateTime.now(VIETNAM_ZONE))
                    .zones(new HashSet<>())
                    .type(type)
                    .build();

            attachZones(event, seed, i);
            eventsToSave.add(event);
            createdCount++;
        }

        if (eventsToSave.isEmpty()) {
            log.info("TicketBox demo events already exist; skipped seeding");
            return;
        }

        List<Event> savedEvents = eventRepository.saveAllAndFlush(eventsToSave);
        int lowTicketAdjustedEvents = applyLowTicketDemoInventory(savedEvents);
        DemoBookingSyncResult bookingSyncResult = syncDemoBookings(savedEvents);
        log.info(
                "Created {} and updated {} TicketBox demo events. Adjusted {} ON_SALE events to low-ticket inventory. Converted {} locked seats to sold and created {} confirmed demo bookings for {} seats",
                createdCount,
                updatedCount,
                lowTicketAdjustedEvents,
                bookingSyncResult.convertedLockedSeats(),
                bookingSyncResult.createdBookings(),
                bookingSyncResult.backfilledSeats()
        );
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

    private String resolveVenue(TicketBoxEventSeed seed) {
        if (seed.address() == null || seed.address().isBlank()) {
            return seed.venue();
        }
        return seed.address();
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

    private int applyLowTicketDemoInventory(List<Event> events) {
        return events.stream()
                .filter(event -> event.getStatus() == Event.Status.ON_SALE)
                .sorted(Comparator.comparing(Event::getStartTime))
                .limit(LOW_TICKET_EVENT_COUNT)
                .mapToInt(this::applyLowTicketDemoInventory)
                .sum();
    }

    private int applyLowTicketDemoInventory(Event event) {
        List<Seat> availableSeats = event.getZones().stream()
                .flatMap(zone -> zone.getSeats().stream())
                .filter(seat -> seat.getStatus() == Seat.Status.AVAILABLE)
                .sorted(Comparator
                        .comparing((Seat seat) -> seat.getZone().getId())
                        .thenComparing(Seat::getRowNumber)
                        .thenComparing(Seat::getColNumber))
                .toList();

        int totalSeats = event.getZones().stream()
                .mapToInt(zone -> zone.getSeats().size())
                .sum();
        int desiredRemainingSeats = Math.max(1, totalSeats * LOW_TICKET_REMAINING_PERCENT / 100);
        int seatsToSell = Math.max(0, availableSeats.size() - desiredRemainingSeats);

        availableSeats.stream()
                .limit(seatsToSell)
                .forEach(seat -> seat.setStatus(Seat.Status.SOLD));

        return seatsToSell > 0 ? 1 : 0;
    }

    private DemoBookingSyncResult syncDemoBookings(List<Event> events) {
        List<User> buyers = demoBuyers();
        if (buyers.isEmpty()) {
            log.warn("Skipped demo booking backfill because no users exist");
            return new DemoBookingSyncResult(0, 0, 0);
        }

        int convertedLockedSeats = 0;
        int backfilledSeats = 0;
        int createdBookings = 0;
        Set<Integer> confirmedExistingBookingIds = new HashSet<>();
        List<Booking> bookingsToCreate = new ArrayList<>();

        for (Event event : events) {
            List<Seat> soldSeatsWithoutBooking = new ArrayList<>();
            Random random = new Random(20260515L + event.getTitle().hashCode());

            for (Zone zone : event.getZones()) {
                for (Seat seat : zone.getSeats()) {
                    if (seat.getStatus() == Seat.Status.LOCKED) {
                        seat.setStatus(Seat.Status.SOLD);
                        convertedLockedSeats++;
                    }

                    if (seat.getStatus() != Seat.Status.SOLD) {
                        continue;
                    }

                    var bookingSeat = bookingSeatRepository.findFirstBySeatId(seat.getId());
                    if (bookingSeat.isPresent()) {
                        Booking booking = bookingSeat.get().getBooking();
                        if (booking.getStatus() != Booking.Status.CONFIRMED
                                && confirmedExistingBookingIds.add(booking.getId())) {
                            confirmExistingBooking(booking);
                        }
                        continue;
                    }

                    soldSeatsWithoutBooking.add(seat);
                }
            }

            soldSeatsWithoutBooking.sort(Comparator
                    .comparing((Seat seat) -> seat.getZone().getId())
                    .thenComparing(Seat::getRowNumber)
                    .thenComparing(Seat::getColNumber));

            backfilledSeats += soldSeatsWithoutBooking.size();
            createdBookings += createDemoBookings(event, buyers, soldSeatsWithoutBooking, random, bookingsToCreate);
        }

        bookingRepository.saveAll(bookingsToCreate);
        return new DemoBookingSyncResult(convertedLockedSeats, createdBookings, backfilledSeats);
    }

    private List<User> demoBuyers() {
        List<User> allUsers = userRepository.findAll();
        List<User> customers = allUsers.stream()
                .filter(user -> user.getRole() == User.Role.CUSTOMER)
                .toList();

        return customers.isEmpty() ? allUsers : customers;
    }

    private void confirmExistingBooking(Booking booking) {
        BigDecimal totalAmount = BigDecimal.ZERO;
        LocalDateTime issuedAt = booking.getCreatedAt() != null
                ? booking.getCreatedAt()
                : LocalDateTime.now(VIETNAM_ZONE);

        booking.setStatus(Booking.Status.CONFIRMED);
        for (BookingSeat bookingSeat : booking.getBookingSeats()) {
            Seat seat = bookingSeat.getSeat();
            seat.setStatus(Seat.Status.SOLD);
            totalAmount = totalAmount.add(bookingSeat.getPriceAtBooking());
            createTicketIfMissing(booking, seat, issuedAt);
        }
        booking.setTotalAmount(totalAmount);
    }

    private void createTicketIfMissing(Booking booking, Seat seat, LocalDateTime issuedAt) {
        if (ticketRepository.existsBySeatId(seat.getId())) {
            return;
        }

        ticketRepository.save(Ticket.builder()
                .booking(booking)
                .seat(seat)
                .qrCode(demoQrCode(seat))
                .status(Ticket.Status.ACTIVE)
                .issuedAt(issuedAt)
                .build());
    }

    private int createDemoBookings(
            Event event,
            List<User> buyers,
            List<Seat> soldSeats,
            Random random,
            List<Booking> bookingsToCreate
    ) {
        int createdBookings = 0;
        int index = 0;

        while (index < soldSeats.size()) {
            int seatCount = 1 + random.nextInt(4);
            int endExclusive = Math.min(index + seatCount, soldSeats.size());
            LocalDateTime createdAt = randomBookingTime(event, random);
            Booking booking = Booking.builder()
                    .user(buyers.get(random.nextInt(buyers.size())))
                    .event(event)
                    .status(Booking.Status.CONFIRMED)
                    .expiresAt(createdAt.plusMinutes(10))
                    .createdAt(createdAt)
                    .bookingSeats(new ArrayList<>())
                    .tickets(new ArrayList<>())
                    .build();

            BigDecimal totalAmount = BigDecimal.ZERO;
            for (Seat seat : soldSeats.subList(index, endExclusive)) {
                BookingSeat bookingSeat = BookingSeat.builder()
                        .booking(booking)
                        .seat(seat)
                        .priceAtBooking(seat.getZone().getPrice())
                        .build();
                Ticket ticket = Ticket.builder()
                        .booking(booking)
                        .seat(seat)
                        .qrCode(demoQrCode(seat))
                        .status(Ticket.Status.ACTIVE)
                        .issuedAt(createdAt)
                        .build();

                booking.getBookingSeats().add(bookingSeat);
                booking.getTickets().add(ticket);
                totalAmount = totalAmount.add(bookingSeat.getPriceAtBooking());
            }

            booking.setTotalAmount(totalAmount);
            bookingsToCreate.add(booking);
            createdBookings++;
            index = endExclusive;
        }

        return createdBookings;
    }

    private LocalDateTime randomBookingTime(Event event, Random random) {
        LocalDateTime now = LocalDateTime.now(VIETNAM_ZONE);
        LocalDateTime latest = event.getStartTime().isBefore(now)
                ? event.getStartTime().minusHours(1)
                : now.minusHours(1);

        return latest.minusHours(1 + random.nextInt(24 * 30));
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
        return Seat.Status.SOLD;
    }

    private String demoQrCode(Seat seat) {
        return "DEMO-E" + seat.getZone().getEvent().getId() + "-S" + seat.getId();
    }

    record DemoBookingSyncResult(
            int convertedLockedSeats,
            int createdBookings,
            int backfilledSeats
    ) {
    }

    record TicketBoxEventSeed(
            int sourceId,
            String title,
            String description,
            String sourceUrl,
            String posterUrl,
            String venue,
            String address,
            Double latitude,
            Double longitude,
            String startTime,
            String endTime,
            long minPrice,
            List<String> categories
    ) {
    }

    record ZoneTemplate(String name, String colorHex) {
    }
}
