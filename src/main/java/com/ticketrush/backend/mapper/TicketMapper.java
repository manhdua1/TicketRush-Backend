package com.ticketrush.backend.mapper;

import com.ticketrush.backend.dto.response.TicketResponse;
import com.ticketrush.backend.entity.Ticket;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TicketMapper {

    @Mapping(source = "seat.zone.event.title", target = "eventTitle")
    @Mapping(source = "seat.zone.event.venue", target = "venue")
    @Mapping(source = "seat.zone.event.eventDate", target = "eventDate")
    @Mapping(source = "seat.zone.name", target = "zoneName")
    @Mapping(source = "seat.label", target = "seatLabel")
    @Mapping(source = "seat.zone.price", target = "price")
    @Mapping(source = "status", target = "status")
    TicketResponse toTicketResponse(Ticket ticket);
}
