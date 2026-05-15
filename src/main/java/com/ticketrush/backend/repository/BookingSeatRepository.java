package com.ticketrush.backend.repository;

import com.ticketrush.backend.entity.BookingSeat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingSeatRepository extends JpaRepository<BookingSeat, Integer> {
    List<BookingSeat> findByBookingId(Integer bookingId);

    Optional<BookingSeat> findFirstBySeatId(Integer seatId);
}
