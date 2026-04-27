package com.ticketrush.backend.mapper;

import com.ticketrush.backend.dto.response.ZoneResponse;
import com.ticketrush.backend.entity.Zone;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ZoneMapper {
    @Mapping(target = "totalSeats",
            expression = "java(zone.getTotalRows() != null && zone.getTotalCols() != null ? (long) zone.getTotalRows() * zone.getTotalCols() : 0L)")
    @Mapping(target = "availableSeats",
            expression = "java(zone.getSeats() != null ? zone.getSeats().stream().filter(s -> s.getStatus() == com.ticketrush.backend.entity.Seat.Status.AVAILABLE).count() : 0L)")
    ZoneResponse toZoneResponse(Zone zone);
}
