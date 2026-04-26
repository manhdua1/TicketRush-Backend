package com.ticketrush.backend.mapper;

import com.ticketrush.backend.dto.response.SeatResponse;
import com.ticketrush.backend.entity.BookingSeat;
import com.ticketrush.backend.entity.Seat;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SeatMapper {

    @Mapping(source = "zone.id", target = "zoneId")
    @Mapping(source = "zone.name", target = "zoneName")
    @Mapping(source = "zone.colorHex", target = "colorHex")
    @Mapping(source = "zone.price", target = "price")
    SeatResponse toSeatResponse(Seat seat);

    @Mapping(source = "seat.zone.id", target = "zoneId")
    @Mapping(source = "seat.zone.name", target = "zoneName")
    @Mapping(source = "seat.zone.colorHex", target = "colorHex")
    @Mapping(source = "seat.zone.price", target = "price")
    @Mapping(source = "seat.rowNumber", target = "rowNumber")
    @Mapping(source = "seat.colNumber", target = "colNumber")
    @Mapping(source = "seat.label", target = "label")
    @Mapping(source = "seat.status", target = "status")
    @Mapping(source = "seat.id", target = "id")
    SeatResponse toSeatResponseFromBookingSeat(BookingSeat bookingSeat);
}
