package com.ticketrush.backend.scheduler;

import com.ticketrush.backend.entity.Event;
import com.ticketrush.backend.repository.EventRepository;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;

@Component
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class EventEndingJob {
    EventRepository eventRepository;
    ZoneId zoneId;

    public EventEndingJob(
            EventRepository eventRepository,
            @Value("${spring.jackson.time-zone:Asia/Ho_Chi_Minh}") String timeZone) {
        this.eventRepository = eventRepository;
        this.zoneId = ZoneId.of(timeZone);
    }

    @Scheduled(fixedDelayString = "${scheduler.event-ending.delay-ms:60000}")
    @Transactional
    public void autoEndEvents() {
        LocalDateTime now = LocalDateTime.now(zoneId);
        int updated = eventRepository.markEndedEvents(Event.Status.ENDED, now);

        if (updated > 0) {
            log.info("Auto ended {} events at {}", updated, now);
        } else {
            log.debug("No events to end at {}", now);
        }
    }
}
