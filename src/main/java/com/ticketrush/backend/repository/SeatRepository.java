package com.ticketrush.backend.repository;

import com.ticketrush.backend.entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SeatRepository extends JpaRepository<Seat, Integer> {
    List<Seat> findByZoneId(Integer zoneId);

    List<Seat> findByZone_EventId(Integer eventId);


}