package com.ticketrush.backend.scheduler;

import com.ticketrush.backend.entity.Booking;
import com.ticketrush.backend.entity.Seat;
import com.ticketrush.backend.repository.BookingRepository;
import com.ticketrush.backend.repository.SeatRepository;
import com.ticketrush.backend.service.SeatService;
import com.ticketrush.backend.service.WebSocketService;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class BookingExpiryJob {
    BookingRepository bookingRepository;
    SeatRepository seatRepository;
    SeatService seatService;
    WebSocketService webSocketService;

    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void releaseExpiredBookings() {
        List<Booking> expiredBookings = bookingRepository.findExpiredBookings(LocalDateTime.now());

        expiredBookings.forEach(booking -> {
            booking.setStatus(Booking.Status.EXPIRED);
            bookingRepository.save(booking);

            booking.getBookingSeats().forEach(bs -> {
                Seat seat = bs.getSeat();
                seat.setStatus(Seat.Status.AVAILABLE);
                seatRepository.save(seat);

                webSocketService.broadcastSeatStatus(
                        booking.getEvent().getId(),
                        seat.getId(),
                        seat.getLabel(),
                        Seat.Status.AVAILABLE
                );
            });

            log.info("Released expired booking id={}", booking.getId());
        });
    }
}
