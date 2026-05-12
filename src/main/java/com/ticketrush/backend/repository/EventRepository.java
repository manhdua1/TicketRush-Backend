package com.ticketrush.backend.repository;

import com.ticketrush.backend.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.awt.print.Pageable;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, Integer>, JpaSpecificationExecutor<Event> {
    @Query("SELECT DISTINCT e FROM Event e LEFT JOIN FETCH e.zones WHERE e.status = :status ORDER BY e.startTime ASC")
    List<Event> findByStatusOrderByEventDateAsc(Event.Status status);

    @Query("SELECT e FROM Event e LEFT JOIN FETCH e.zones WHERE e.id = :id")
    Optional<Event> findByIdWithZones(Integer id);

    @Query("SELECT DISTINCT e FROM Event e LEFT JOIN FETCH e.zones WHERE e.type = :type ORDER BY e.startTime ASC")
    List<Event> findByTypeOrderByEventDateAsc(Event.Type type);

    Optional<Event> findFirstBySpotlightTrueOrderByStartTimeAsc();

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Event e SET e.spotlight = false WHERE e.spotlight = true")
    void clearSpotlightFlags();

    @Query(value = """
    SELECT e.* FROM events e
    WHERE e.status = 'ON_SALE'
    ORDER BY (
        SELECT COUNT(*) FROM seats s
        JOIN zones z ON s.zone_id = z.id
        WHERE z.event_id = e.id AND s.status = 'SOLD'
    ) / NULLIF(
        (SELECT COUNT(*) FROM seats s2
        JOIN zones z2 ON s2.zone_id = z2.id
        WHERE z2.event_id = e.id), 0
    ) DESC
    LIMIT :limit
    """, nativeQuery = true)
    List<Event> findTrendingEvents(int limit);
}
