package com.ticketrush.backend.service;

import com.ticketrush.backend.dto.request.EventRequest;
import com.ticketrush.backend.dto.response.EventResponse;
import com.ticketrush.backend.dto.response.PageResponse;
import com.ticketrush.backend.entity.Event;
import com.ticketrush.backend.entity.User;
import com.ticketrush.backend.exception.AppException;
import com.ticketrush.backend.exception.ErrorCode;
import com.ticketrush.backend.mapper.EventMapper;
import com.ticketrush.backend.repository.EventRepository;
import com.ticketrush.backend.repository.EventSpecification;
import com.ticketrush.backend.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@Slf4j
public class EventService {
    EventRepository eventRepository;
    UserRepository userRepository;
    EventMapper eventMapper;
    QueueService queueService;

    public EventResponse createEvent(EventRequest request, Integer adminId) {
        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Event event = Event.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .venue(request.getVenue())
                .longitude(request.getLongitude())
                .latitude(request.getLatitude())
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
        event.setLatitude(request.getLatitude());
        event.setLongitude(request.getLongitude());
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

    public EventResponse getSpotlightEvent() {
        Event event = eventRepository.findFirstBySpotlightTrueOrderByStartTimeAsc()
                .orElseThrow(() -> new AppException(ErrorCode.EVENT_NOT_FOUND));
        return eventMapper.toEventResponse(event);
    }

    @org.springframework.transaction.annotation.Transactional
    public EventResponse setSpotlight(Integer eventId, boolean spotlight) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new AppException(ErrorCode.EVENT_NOT_FOUND));

        if (spotlight) {
            eventRepository.clearSpotlightFlags();
            event.setSpotlight(true);
        } else {
            event.setSpotlight(false);
        }

        eventRepository.save(event);
        return eventMapper.toEventResponse(event);
    }

    /**
     * Lấy event + tracking active user + kiểm tra queue requirement.
     * Gọi khi user đã đăng nhập truy cập event detail.
     */
    public EventResponse getEventByIdForUser(Integer eventId, Integer userId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new AppException(ErrorCode.EVENT_NOT_FOUND));

        // Track user đang xem event
        queueService.trackActiveUser(eventId, userId);

        EventResponse response = eventMapper.toEventResponse(event);

        // Enrichment: thêm thông tin queue
        int activeUsers = queueService.getActiveUserCount(eventId);
        response.setQueueRequired(queueService.isQueueRequired(eventId));
        response.setActiveUsers(activeUsers);

        return response;
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

    public PageResponse<EventResponse> searchEvents(String name, Event.Type type, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(0, page - 1), size, Sort.by("startTime").ascending());
        Specification<Event> spec = EventSpecification.filter(name, type);

        Page<EventResponse> result = eventRepository.findAll(spec, pageable)
                .map(eventMapper::toEventResponse);

        return PageResponse.of(result);
    }

    public List<EventResponse> getTrendingEvents() {
        return eventRepository.findTrendingEvents(5)
                .stream()
                .map(eventMapper::toEventResponse)
                .toList();
    }
}
