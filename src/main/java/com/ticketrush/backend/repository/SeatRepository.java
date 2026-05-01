package com.ticketrush.backend.repository;

import com.ticketrush.backend.entity.Seat;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Integer> {
    List<Seat> findByZoneId(Integer zoneId);

    List<Seat> findByZone_EventId(Integer eventId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Seat s WHERE s.id = :id")
    Optional<Seat> findByIdWithLock(Integer id);

    @Query("SELECT COUNT(s) FROM Seat s WHERE s.zone.event.id = :eventId")
    Integer countTotalByEventId(Integer eventId);

    @Query("SELECT COUNT(s) FROM Seat s WHERE s.zone.event.id = :eventId AND s.status = :status")
    Integer countByEventIdAndStatus(Integer eventId, Seat.Status status);

    @Query("SELECT COUNT(s) FROM Seat s WHERE s.zone.id = :zoneId AND s.status = :status")
    Integer countByZoneIdAndStatus(Integer zoneId, Seat.Status status);

    @Query("SELECT COUNT(s) FROM Seat s WHERE s.zone.id = :zoneId")
    Integer countTotalByZoneId(Integer zoneId);
}