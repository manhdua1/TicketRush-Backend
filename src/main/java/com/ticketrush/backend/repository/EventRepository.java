package com.ticketrush.backend.repository;

import com.ticketrush.backend.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EventRepository extends JpaRepository<Event, Integer>, JpaSpecificationExecutor<Event> {
    Optional<Event> findFirstByTitle(String title);

    @Query("SELECT DISTINCT e FROM Event e LEFT JOIN FETCH e.zones WHERE e.status = :status ORDER BY e.startTime ASC")
    List<Event> findByStatusOrderByEventDateAsc(@Param("status") Event.Status status);

    @Query("SELECT e FROM Event e LEFT JOIN FETCH e.zones WHERE e.id = :id")
    Optional<Event> findByIdWithZones(@Param("id") Integer id);

    @Query("SELECT DISTINCT e FROM Event e LEFT JOIN FETCH e.zones WHERE e.type = :type ORDER BY e.startTime ASC")
    List<Event> findByTypeOrderByEventDateAsc(@Param("type") Event.Type type);

    Optional<Event> findFirstBySpotlightTrueOrderByStartTimeAsc();

    @Modifying
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
    List<Event> findTrendingEvents(@Param("limit") int limit);

    @Query("SELECT e FROM Event e WHERE e.status = :status AND e.endTime < :time")
    List<Event> findByStatusAndEndTimeBefore(
            @Param("status") Event.Status status,
            @Param("time") LocalDateTime time);

    @Modifying(clearAutomatically = true)
    @Query("UPDATE Event e SET e.status = :endedStatus WHERE e.status <> :endedStatus AND e.endTime < :time")
    int markEndedEvents(@Param("endedStatus") Event.Status endedStatus, @Param("time") LocalDateTime time);

    List<Event> findByStatus(Event.Status status);

    Long countByStatus(Event.Status status);
}
