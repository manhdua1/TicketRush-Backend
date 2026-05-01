package com.ticketrush.backend.repository;

import com.ticketrush.backend.entity.Booking;
import com.ticketrush.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Integer> {
    List<Booking> findByUserId(Integer userId);

    @Query("SELECT b FROM Booking b WHERE b.status = 'PENDING' AND b.expiresAt < :now")
    List<Booking> findExpiredBookings(LocalDateTime now);

    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Booking b WHERE b.event.id = :eventId AND b.status = 'CONFIRMED'")
    BigDecimal sumRevenueByEventId(Integer eventId);

    @Query("""
    SELECT COALESCE(SUM(bs.priceAtBooking), 0)
    FROM BookingSeat bs
    WHERE bs.seat.zone.id = :zoneId
    AND bs.booking.status = 'CONFIRMED'
    """)
    BigDecimal sumRevenueByZoneId(Integer zoneId);

    // Lấy danh sách user đã mua vé của event
    @Query("""
    SELECT DISTINCT b.user FROM Booking b
    WHERE b.event.id = :eventId
    AND b.status = 'CONFIRMED'
    """)
    List<User> findBuyersByEventId(Integer eventId);
}
