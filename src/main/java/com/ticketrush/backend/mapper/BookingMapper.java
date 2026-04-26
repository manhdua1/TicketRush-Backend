package com.ticketrush.backend.mapper;

import com.ticketrush.backend.dto.response.BookingResponse;
import com.ticketrush.backend.entity.Booking;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", uses = {SeatMapper.class})
public interface BookingMapper {

    @Mapping(source = "status", target = "status")
    @Mapping(source = "bookingSeats", target = "seats")
    BookingResponse toBookingResponse(Booking booking);
}