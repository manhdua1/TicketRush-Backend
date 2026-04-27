package com.ticketrush.backend.repository;

import com.ticketrush.backend.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, Integer> {
    List<Event> findByStatusOrderByEventDateAsc(Event.Status status);

    @Query("SELECT e FROM Event e LEFT JOIN FETCH e.zones WHERE e.id = :id")
    Optional<Event> findByIdWithZones(Integer id);

    List<Event> findByTypeOrderByEventDateAsc(Event.Type type);
}
