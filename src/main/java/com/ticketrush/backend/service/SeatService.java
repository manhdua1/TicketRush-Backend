package com.ticketrush.backend.service;

import com.ticketrush.backend.dto.response.SeatResponse;
import com.ticketrush.backend.entity.Seat;
import com.ticketrush.backend.entity.Zone;
import com.ticketrush.backend.repository.SeatRepository;
import com.ticketrush.backend.repository.ZoneRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SeatService {
    SeatRepository seatRepository;
    ZoneRepository zoneRepository;

    public List<SeatResponse> getSeatsByEvent(Integer eventId) {
        List<Zone> zones = zoneRepository.findByEventId(eventId);
        List<Seat> seats = seatRepository.findByZone_EventId(eventId);

        Map<Integer, Zone> zoneMap = zones.stream()
                .collect(Collectors.toMap(Zone::getId, z -> z));

        return seats.stream().map(seat -> {
            Zone zone = zoneMap.get(seat.getZone().getId());
            return SeatResponse.builder()
                    .id(seat.getId())
                    .zoneId(zone.getId())
                    .zoneName(zone.getName())
                    .colorHex(zone.getColorHex())
                    .price(zone.getPrice())
                    .rowNumber(seat.getRowNumber())
                    .colNumber(seat.getColNumber())
                    .label(seat.getLabel())
                    .status(seat.getStatus())
                    .build();
        }).toList();
    }
}
