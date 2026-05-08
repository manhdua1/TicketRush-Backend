package com.ticketrush.backend.repository;

import com.ticketrush.backend.entity.Event;
import org.springframework.data.jpa.domain.Specification;

public class EventSpecification {

    /**
     * Tìm kiếm event ON_SALE theo title (LIKE, không phân biệt hoa thường)
     * và/hoặc type.
     */
    public static Specification<Event> filter(String name, Event.Type type) {
        Specification<Event> spec = Specification.where(onSale());

        Specification<Event> nameSpec = titleContains(name);
        if (nameSpec != null) {
            spec = spec.and(nameSpec);
        }

        Specification<Event> typeSpec = hasType(type);
        if (typeSpec != null) {
            spec = spec.and(typeSpec);
        }

        return spec;
    }

    private static Specification<Event> onSale() {
        return (root, query, cb) ->
                cb.equal(root.get("status"), Event.Status.ON_SALE);
    }

    private static Specification<Event> titleContains(String name) {
        if (name == null || name.isBlank()) return null;
        return (root, query, cb) ->
                cb.like(cb.lower(root.get("title")), "%" + name.toLowerCase() + "%");
    }

    private static Specification<Event> hasType(Event.Type type) {
        if (type == null) return null;
        return (root, query, cb) ->
                cb.equal(root.get("type"), type);
    }
}
