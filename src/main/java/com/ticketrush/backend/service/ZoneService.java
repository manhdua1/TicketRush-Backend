package com.ticketrush.backend.service;

import com.ticketrush.backend.dto.request.ZoneRequest;
import com.ticketrush.backend.dto.response.ZoneResponse;
import com.ticketrush.backend.entity.Event;
import com.ticketrush.backend.entity.Seat;
import com.ticketrush.backend.entity.Zone;
import com.ticketrush.backend.exception.AppException;
import com.ticketrush.backend.exception.ErrorCode;
import com.ticketrush.backend.mapper.ZoneMapper;
import com.ticketrush.backend.repository.EventRepository;
import com.ticketrush.backend.repository.SeatRepository;
import com.ticketrush.backend.repository.ZoneRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class ZoneService {
    EventRepository eventRepository;
    ZoneRepository zoneRepository;
    SeatRepository seatRepository;
    ZoneMapper zoneMapper;

    public ZoneResponse createZone(ZoneRequest request, Integer eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new AppException(ErrorCode.EVENT_NOT_FOUND));

        Zone zone = Zone.builder()
                .event(event)
                .name(request.getName())
                .price(request.getPrice())
                .totalRows(request.getTotalRows())
                .totalCols(request.getTotalCols())
                .colorHex(request.getColorHex())
                .build();

        zoneRepository.save(zone);

        // Auto generate seat
        List<Seat> seats = new ArrayList<>();
        for (int row = 1; row <= request.getTotalRows(); row++) {
            for (int col = 1; col <= request.getTotalCols(); col++) {
                String label = zone.getName() + "-"
                        + (char) ('A' + row - 1) + col;
                seats.add(Seat.builder()
                        .zone(zone)
                        .rowNumber(row)
                        .colNumber(col)
                        .label(label)
                        .status(Seat.Status.AVAILABLE)
                        .build());
            }
        }
        seatRepository.saveAll(seats);

        return zoneMapper.toZoneResponse(zone);
    }
}
