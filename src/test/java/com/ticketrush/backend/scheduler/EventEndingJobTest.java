package com.ticketrush.backend.scheduler;

import com.ticketrush.backend.entity.Event;
import com.ticketrush.backend.repository.EventRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class EventEndingJobTest {

    @Test
    void autoEndEventsUsesConfiguredTimeZoneAndMarksAllNonEndedEvents() {
        EventRepository eventRepository = mock(EventRepository.class);
        ZoneId zoneId = ZoneId.of("Asia/Ho_Chi_Minh");
        EventEndingJob job = new EventEndingJob(eventRepository, zoneId.getId());

        LocalDateTime beforeRun = LocalDateTime.now(zoneId).minusSeconds(1);
        job.autoEndEvents();
        LocalDateTime afterRun = LocalDateTime.now(zoneId).plusSeconds(1);

        ArgumentCaptor<LocalDateTime> timeCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(eventRepository).markEndedEvents(eq(Event.Status.ENDED), timeCaptor.capture());
        assertThat(timeCaptor.getValue()).isBetween(beforeRun, afterRun);
    }
}
