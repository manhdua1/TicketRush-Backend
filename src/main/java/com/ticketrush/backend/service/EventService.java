package com.ticketrush.backend.service;

import com.ticketrush.backend.dto.request.EventRequest;
import com.ticketrush.backend.dto.response.EventResponse;
import com.ticketrush.backend.entity.Event;
import com.ticketrush.backend.entity.User;
import com.ticketrush.backend.exception.AppException;
import com.ticketrush.backend.exception.ErrorCode;
import com.ticketrush.backend.mapper.EventMapper;
import com.ticketrush.backend.repository.EventRepository;
import com.ticketrush.backend.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class EventService {
    EventRepository eventRepository;
    UserRepository userRepository;
    EventMapper eventMapper;

    public EventResponse createEvent(EventRequest request, Integer adminId) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Event event = Event.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .venue(request.getVenue())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .posterUrl(request.getPosterUrl())
                .status(Event.Status.DRAFT)
                .type(request.getType())
                .createdBy(admin)
                .build();

        eventRepository.save(event);
        return eventMapper.toEventResponse(event);
    }

    public EventResponse updateEvent(EventRequest request, Integer eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new AppException(ErrorCode.EVENT_NOT_FOUND));

        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setVenue(request.getVenue());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());
        event.setPosterUrl(request.getPosterUrl());
        event.setType(request.getType());

        eventRepository.save(event);
        return eventMapper.toEventResponse(event);
    }

    public List<EventResponse> getOnSaleEvents() {
        return eventRepository.findByStatusOrderByEventDateAsc(Event.Status.ON_SALE)
                .stream()
                .map(eventMapper::toEventResponse)
                .toList();
    }

    public EventResponse getEventById(Integer eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new AppException(ErrorCode.EVENT_NOT_FOUND));

        return eventMapper.toEventResponse(event);
    }

    public EventResponse changeStatus(Integer id, Event.Status status) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.EVENT_NOT_FOUND));

        event.setStatus(status);
        eventRepository.save(event);
        return eventMapper.toEventResponse(event);
    }

    public List<EventResponse> getEventByType(Event.Type type) {
        List<Event> events = eventRepository.findByTypeOrderByEventDateAsc(type);
        return events.stream()
                .map(eventMapper::toEventResponse)
                .toList();
    }
}
