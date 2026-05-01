package com.ticketrush.backend.service;

import com.ticketrush.backend.dto.request.BookingRequest;
import com.ticketrush.backend.dto.response.BookingResponse;
import com.ticketrush.backend.entity.*;
import com.ticketrush.backend.exception.AppException;
import com.ticketrush.backend.exception.ErrorCode;
import com.ticketrush.backend.mapper.BookingMapper;
import com.ticketrush.backend.repository.*;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BookingService {
    BookingRepository bookingRepository;
    BookingSeatRepository bookingSeatRepository;
    SeatRepository seatRepository;
    TicketRepository ticketRepository;
    UserRepository userRepository;
    BookingMapper bookingMapper;
    WebSocketService webSocketService;

    @Transactional
    public BookingResponse lockSeats(BookingRequest request, Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        List<Seat> lockedSeats = new ArrayList<>();
        BigDecimal totalPrice = BigDecimal.ZERO;

        for (Integer seatId : request.getSeatIds()) {
            Seat seat = seatRepository.findByIdWithLock(seatId)
                    .orElseThrow(() -> new AppException(ErrorCode.SEAT_NOT_FOUND));

            if (seat.getStatus() != Seat.Status.AVAILABLE)
                throw new AppException(ErrorCode.SEAT_UNAVAILABLE);

            seat.setStatus(Seat.Status.LOCKED);
            seatRepository.save(seat);
            lockedSeats.add(seat);
            totalPrice = totalPrice.add(seat.getZone().getPrice());

            webSocketService.broadcastSeatStatus(
                    seat.getZone().getEvent().getId(),
                    seat.getId(),
                    seat.getLabel(),
                    Seat.Status.LOCKED
            );
        }

        // Tạo booking với thời hạn 10 phút
        Booking booking = Booking.builder()
                .user(user)
                .event(lockedSeats.get(0).getZone().getEvent())
                .status(Booking.Status.PENDING)
                .totalAmount(totalPrice)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .build();
        bookingRepository.save(booking);

        // Lưu từng ghế vào booking
        List<BookingSeat> bookingSeats = lockedSeats.stream()
                .map(seat -> BookingSeat.builder()
                        .booking(booking)
                        .seat(seat)
                        .priceAtBooking(seat.getZone().getPrice())
                        .build())
                .toList();
        bookingSeatRepository.saveAll(bookingSeats);
        booking.setBookingSeats(bookingSeats);
        return bookingMapper.toBookingResponse(booking);
    }

    @Transactional
    public BookingResponse confirmBooking(Integer bookingId, Integer userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        if (!booking.getUser().getId().equals(userId))
            throw new AppException(ErrorCode.UNAUTHORIZED);

        if (booking.getStatus() != Booking.Status.PENDING)
            throw new AppException(ErrorCode.BOOKING_EXPIRED);

        if (booking.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.BOOKING_EXPIRED);
        }

        booking.setStatus(Booking.Status.CONFIRMED);
        bookingRepository.save(booking);

        // Chuyển ghế sang SOLD và sinh Ticket cho từng ghế
        List<Seat> seats = new ArrayList<>();
        booking.getBookingSeats().forEach(bs -> {
            Seat seat = bs.getSeat();
            seat.setStatus(Seat.Status.SOLD);
            seatRepository.save(seat);
            seats.add(seat);

            webSocketService.broadcastSeatStatus(
                    seat.getZone().getEvent().getId(),
                    seat.getId(),
                    seat.getLabel(),
                    Seat.Status.SOLD
            );

            Ticket ticket = Ticket.builder()
                    .booking(booking)
                    .seat(seat)
                    .qrCode(UUID.randomUUID().toString())
                    .status(Ticket.Status.ACTIVE)
                    .build();
            ticketRepository.save(ticket);
        });

        return bookingMapper.toBookingResponse(booking);
    }

    @Transactional
    public void cancelBooking(Integer bookingId, Integer userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new AppException(ErrorCode.BOOKING_NOT_FOUND));

        if (!booking.getUser().getId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (booking.getStatus() != Booking.Status.PENDING) {
            throw new AppException(ErrorCode.BOOKING_EXPIRED);
        }

        booking.setStatus(Booking.Status.CANCELLED);
        bookingRepository.save(booking);

        booking.getBookingSeats().forEach(bs -> {
            Seat seat = bs.getSeat();
            seat.setStatus(Seat.Status.AVAILABLE);
            seatRepository.save(seat);

            webSocketService.broadcastSeatStatus(
                    seat.getZone().getEvent().getId(),
                    seat.getId(),
                    seat.getLabel(),
                    Seat.Status.AVAILABLE
            );
        });
    }
}
