package com.ticketrush.backend.service;

import com.ticketrush.backend.dto.request.RevenueTrendPeriod;
import com.ticketrush.backend.dto.response.*;
import com.ticketrush.backend.entity.Booking;
import com.ticketrush.backend.entity.Event;
import com.ticketrush.backend.entity.Seat;
import com.ticketrush.backend.entity.User;
import com.ticketrush.backend.entity.Zone;
import com.ticketrush.backend.exception.AppException;
import com.ticketrush.backend.exception.ErrorCode;
import com.ticketrush.backend.repository.BookingRepository;
import com.ticketrush.backend.repository.EventRepository;
import com.ticketrush.backend.repository.SeatRepository;
import com.ticketrush.backend.repository.ZoneRepository;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StatsService {
    static final DateTimeFormatter HOUR_LABEL_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");
    static final DateTimeFormatter DAY_LABEL_FORMATTER = DateTimeFormatter.ofPattern("dd/MM");

    EventRepository eventRepository;
    ZoneRepository zoneRepository;
    SeatRepository seatRepository;
    BookingRepository bookingRepository;
    ZoneId zoneId;

    public StatsService(
            EventRepository eventRepository,
            ZoneRepository zoneRepository,
            SeatRepository seatRepository,
            BookingRepository bookingRepository,
            @Value("${spring.jackson.time-zone:Asia/Ho_Chi_Minh}") String timeZone
    ) {
        this.eventRepository = eventRepository;
        this.zoneRepository = zoneRepository;
        this.seatRepository = seatRepository;
        this.bookingRepository = bookingRepository;
        this.zoneId = ZoneId.of(timeZone);
    }

    public EventStatsResponse getEventStats(Integer eventId) {
        Event event = eventRepository.findByIdWithZones(eventId)
                .orElseThrow(() -> new AppException(ErrorCode.EVENT_NOT_FOUND));

        Integer totalSeats = seatRepository.countTotalByEventId(eventId);
        Integer soldSeats = seatRepository.countByEventIdAndStatus(eventId, Seat.Status.SOLD);
        Integer lockedSeats = seatRepository.countByEventIdAndStatus(eventId, Seat.Status.LOCKED);
        Integer availableSeats = seatRepository.countByEventIdAndStatus(eventId, Seat.Status.AVAILABLE);
        BigDecimal totalRevenue = bookingRepository.sumRevenueByEventId(eventId);

        double occupancyRate = totalSeats > 0
                ? Math.round((double) soldSeats / totalSeats * 100 * 10.0) / 10.0
                : 0;

        List<ZoneStatsResponse> zoneStats = event.getZones().stream()
                .map(this::buildZoneStats)
                .toList();

        return EventStatsResponse.builder()
                .eventId(eventId)
                .eventTitle(event.getTitle())
                .totalRevenue(totalRevenue)
                .totalSeats(totalSeats)
                .soldSeats(soldSeats)
                .lockedSeats(lockedSeats)
                .availableSeats(availableSeats)
                .occupancyRate(occupancyRate)
                .zoneStats(zoneStats)
                .build();
    }

    public BigDecimal getAllOnSaleEventsRevenue() {
        List<Event> events = eventRepository.findByStatus(Event.Status.ON_SALE);

        return events.stream()
                .map(event -> bookingRepository.sumRevenueByEventId(event.getId()))
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public Long getAllOnSaleEventsSoldTickets() {
        return seatRepository.countByEventStatusAndStatus(Event.Status.ON_SALE, Seat.Status.SOLD);
    }

    public OnSaleSeatSummaryResponse getOnSaleSeatSummary() {
        Long soldSeats = seatRepository.countByEventStatusAndStatus(Event.Status.ON_SALE, Seat.Status.SOLD);
        Long totalSeats = seatRepository.countByEventStatus(Event.Status.ON_SALE);
        double soldRate = totalSeats > 0
                ? Math.round((double) soldSeats / totalSeats * 100 * 10.0) / 10.0
                : 0;

        return OnSaleSeatSummaryResponse.builder()
                .soldSeats(soldSeats)
                .totalSeats(totalSeats)
                .soldRate(soldRate)
                .build();
    }

    public Long getOnSaleEventCount() {
        return eventRepository.countByStatus(Event.Status.ON_SALE);
    }

    public RevenueTrendResponse getRevenueTrend(RevenueTrendPeriod period) {
        RevenueTrendPeriod resolvedPeriod = period == null ? RevenueTrendPeriod.DAY : period;
        LocalDateTime now = LocalDateTime.now(zoneId);
        List<RevenueBucket> buckets = buildRevenueBuckets(resolvedPeriod, now);
        LocalDateTime from = buckets.getFirst().startTime();
        LocalDateTime to = buckets.getLast().endTime();

        List<Booking> bookings = bookingRepository.findConfirmedBookingsBetween(from, to);
        for (Booking booking : bookings) {
            addBookingRevenueToBucket(buckets, booking);
        }

        List<RevenueTrendPointResponse> points = buckets.stream()
                .map(bucket -> RevenueTrendPointResponse.builder()
                        .label(bucket.label())
                        .startTime(bucket.startTime())
                        .endTime(bucket.endTime())
                        .revenue(bucket.revenue())
                        .build())
                .toList();

        BigDecimal totalRevenue = points.stream()
                .map(RevenueTrendPointResponse::getRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return RevenueTrendResponse.builder()
                .period(resolvedPeriod.name())
                .totalRevenue(totalRevenue)
                .points(points)
                .build();
    }

    public List<OnSaleLowTicketEventResponse> getLowTicketOnSaleEvents() {
        return eventRepository.findByStatus(Event.Status.ON_SALE).stream()
                .map(this::buildLowTicketOnSaleEventResponse)
                .filter(this::isLowTicketEvent)
                .sorted(Comparator
                        .comparingDouble(OnSaleLowTicketEventResponse::getRemainingRate)
                        .thenComparing(OnSaleLowTicketEventResponse::getStartTime))
                .toList();
    }

    private boolean isLowTicketEvent(OnSaleLowTicketEventResponse response) {
        return response.getTotalTickets() > 0
                && (long) response.getRemainingTickets() * 10 < response.getTotalTickets();
    }

    private OnSaleLowTicketEventResponse buildLowTicketOnSaleEventResponse(Event event) {
        Integer eventId = event.getId();
        Integer totalTickets = seatRepository.countTotalByEventId(eventId);
        Integer soldTickets = seatRepository.countByEventIdAndStatus(eventId, Seat.Status.SOLD);
        Integer lockedTickets = seatRepository.countByEventIdAndStatus(eventId, Seat.Status.LOCKED);
        Integer remainingTickets = seatRepository.countByEventIdAndStatus(eventId, Seat.Status.AVAILABLE);
        double remainingRate = totalTickets > 0
                ? Math.round((double) remainingTickets / totalTickets * 100 * 10.0) / 10.0
                : 0;

        return OnSaleLowTicketEventResponse.builder()
                .eventId(eventId)
                .eventTitle(event.getTitle())
                .venue(event.getVenue())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .posterUrl(event.getPosterUrl())
                .totalTickets(totalTickets)
                .soldTickets(soldTickets)
                .lockedTickets(lockedTickets)
                .remainingTickets(remainingTickets)
                .remainingRate(remainingRate)
                .build();
    }

    private ZoneStatsResponse buildZoneStats(Zone zone) {
        Integer zoneId = zone.getId();
        Integer total = seatRepository.countTotalByZoneId(zoneId);
        Integer sold = seatRepository.countByZoneIdAndStatus(zoneId, Seat.Status.SOLD);
        Integer locked = seatRepository.countByZoneIdAndStatus(zoneId, Seat.Status.LOCKED);
        Integer available = seatRepository.countByZoneIdAndStatus(zoneId, Seat.Status.AVAILABLE);
        BigDecimal revenue = bookingRepository.sumRevenueByZoneId(zoneId);

        double occupancyRate = total > 0
                ? Math.round((double) sold / total * 100 * 10.0) / 10.0
                : 0;

        return ZoneStatsResponse.builder()
                .zoneId(zoneId)
                .zoneName(zone.getName())
                .colorHex(zone.getColorHex())
                .price(zone.getPrice())
                .totalSeats(total)
                .soldSeats(sold)
                .lockedSeats(locked)
                .availableSeats(available)
                .occupancyRate(occupancyRate)
                .revenue(revenue)
                .build();
    }

    private List<RevenueBucket> buildRevenueBuckets(RevenueTrendPeriod period, LocalDateTime now) {
        return switch (period) {
            case DAY -> buildHourlyBuckets(now);
            case WEEK -> buildDailyBuckets(now.toLocalDate().minusDays(6), 7);
            case MONTH -> buildDailyBuckets(now.toLocalDate().minusDays(29), 30);
        };
    }

    private List<RevenueBucket> buildHourlyBuckets(LocalDateTime now) {
        LocalDateTime firstHour = now.withMinute(0).withSecond(0).withNano(0).minusHours(23);
        List<RevenueBucket> buckets = new ArrayList<>();
        for (int i = 0; i < 24; i++) {
            LocalDateTime start = firstHour.plusHours(i);
            LocalDateTime end = start.plusHours(1);
            buckets.add(new RevenueBucket(start.format(HOUR_LABEL_FORMATTER), start, end));
        }
        return buckets;
    }

    private List<RevenueBucket> buildDailyBuckets(LocalDate firstDate, int days) {
        List<RevenueBucket> buckets = new ArrayList<>();
        for (int i = 0; i < days; i++) {
            LocalDate date = firstDate.plusDays(i);
            LocalDateTime start = date.atStartOfDay();
            LocalDateTime end = start.plusDays(1);
            buckets.add(new RevenueBucket(date.format(DAY_LABEL_FORMATTER), start, end));
        }
        return buckets;
    }

    private void addBookingRevenueToBucket(List<RevenueBucket> buckets, Booking booking) {
        if (booking.getCreatedAt() == null || booking.getTotalAmount() == null) {
            return;
        }

        for (RevenueBucket bucket : buckets) {
            if (!booking.getCreatedAt().isBefore(bucket.startTime())
                    && booking.getCreatedAt().isBefore(bucket.endTime())) {
                bucket.addRevenue(booking.getTotalAmount());
                return;
            }
        }
    }

    private static class RevenueBucket {
        private final String label;
        private final LocalDateTime startTime;
        private final LocalDateTime endTime;
        private BigDecimal revenue = BigDecimal.ZERO;

        RevenueBucket(String label, LocalDateTime startTime, LocalDateTime endTime) {
            this.label = label;
            this.startTime = startTime;
            this.endTime = endTime;
        }

        String label() {
            return label;
        }

        LocalDateTime startTime() {
            return startTime;
        }

        LocalDateTime endTime() {
            return endTime;
        }

        BigDecimal revenue() {
            return revenue;
        }

        void addRevenue(BigDecimal amount) {
            revenue = revenue.add(amount);
        }
    }

    public AudienceStatsResponse getAudienceStats(Integer eventId) {
        eventRepository.findById(eventId)
                .orElseThrow(() -> new AppException(ErrorCode.EVENT_NOT_FOUND));

        List<User> buyers = bookingRepository.findBuyersByEventId(eventId);
        int total = buyers.size();

        // Thống kê giới tính
        Map<User.Gender, Long> genderMap = buyers.stream()
                .filter(u -> u.getGender() != null)
                .collect(Collectors.groupingBy(User::getGender, Collectors.counting()));

        List<GenderStatsResponse> genderStats = Arrays.stream(User.Gender.values())
                .map(gender -> GenderStatsResponse.builder()
                        .gender(gender.name())
                        .count(genderMap.getOrDefault(gender, 0L).intValue())
                        .percentage(total > 0
                                ? Math.round(genderMap.getOrDefault(gender, 0L) * 100.0 / total * 10) / 10.0
                                : 0)
                        .build())
                .toList();

        // Thống kê độ tuổi
        List<AgeGroupStatsResponse> ageGroupStats = buildAgeGroupStatsResponse(buyers, total);

        return AudienceStatsResponse.builder()
                .eventId(eventId)
                .totalBuyers(total)
                .genderStats(genderStats)
                .ageGroupStats(ageGroupStats)
                .build();
    }

    private List<AgeGroupStatsResponse> buildAgeGroupStatsResponse(List<User> buyers, int total) {
        // Định nghĩa các nhóm tuổi
        Map<String, Long> ageGroups = new LinkedHashMap<>();
        ageGroups.put("Dưới 18", 0L);
        ageGroups.put("18-24", 0L);
        ageGroups.put("25-34", 0L);
        ageGroups.put("35-44", 0L);
        ageGroups.put("45+", 0L);
        ageGroups.put("Không rõ", 0L);

        int currentYear = LocalDate.now().getYear();

        buyers.forEach(user -> {
            if (user.getDateOfBirth() == null) {
                ageGroups.merge("Không rõ", 1L, Long::sum);
                return;
            }
            int age = currentYear - user.getDateOfBirth().getYear();
            if (age < 18) ageGroups.merge("Dưới 18", 1L, Long::sum);
            else if (age <= 24) ageGroups.merge("18-24", 1L, Long::sum);
            else if (age <= 34) ageGroups.merge("25-34", 1L, Long::sum);
            else if (age <= 44) ageGroups.merge("35-44", 1L, Long::sum);
            else ageGroups.merge("45+", 1L, Long::sum);
        });

        return ageGroups.entrySet().stream()
                .map(entry -> AgeGroupStatsResponse.builder()
                        .ageGroup(entry.getKey())
                        .count(entry.getValue().intValue())
                        .percentage(total > 0
                                ? Math.round(entry.getValue() * 100.0 / total * 10) / 10.0
                                : 0)
                        .build())
                .toList();
    }
}
