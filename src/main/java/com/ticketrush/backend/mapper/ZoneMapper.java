package com.ticketrush.backend.mapper;

import com.ticketrush.backend.dto.response.ZoneResponse;
import com.ticketrush.backend.entity.Zone;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ZoneMapper {
    @Mapping(target = "totalSeats",
            expression = "java(zone.getTotalRows() != null && zone.getTotalCols() != null ? (long) zone.getTotalRows() * zone.getTotalCols() : 0L)")
    @Mapping(target = "availableSeats", ignore = true)
    ZoneResponse toZoneResponse(Zone zone);
}
