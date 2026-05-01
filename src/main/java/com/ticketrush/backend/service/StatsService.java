package com.ticketrush.backend.service;

import com.ticketrush.backend.dto.response.*;
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
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StatsService {
    EventRepository eventRepository;
    ZoneRepository zoneRepository;
    SeatRepository seatRepository;
    BookingRepository bookingRepository;

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
