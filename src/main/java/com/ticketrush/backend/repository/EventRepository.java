package com.ticketrush.backend.repository;

import com.ticketrush.backend.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, Integer> {
    @Query("SELECT DISTINCT e FROM Event e LEFT JOIN FETCH e.zones WHERE e.status = :status ORDER BY e.startTime ASC")
    List<Event> findByStatusOrderByEventDateAsc(Event.Status status);

    @Query("SELECT e FROM Event e LEFT JOIN FETCH e.zones WHERE e.id = :id")
    Optional<Event> findByIdWithZones(Integer id);

    @Query("SELECT DISTINCT e FROM Event e LEFT JOIN FETCH e.zones WHERE e.type = :type ORDER BY e.startTime ASC")
    List<Event> findByTypeOrderByEventDateAsc(Event.Type type);
}
