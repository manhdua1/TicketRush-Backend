package com.ticketrush.backend.mapper;

import com.ticketrush.backend.dto.request.EventRequest;
import com.ticketrush.backend.dto.response.EventResponse;
import com.ticketrush.backend.entity.Event;
import org.mapstruct.InheritInverseConfiguration;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface EventMapper {
    @Mapping(source = "status", target = "status")
    @Mapping(source = "zones", target = "zones")
    @Mapping(source = "type", target = "type")
    EventResponse toEventResponse(Event event);
}
