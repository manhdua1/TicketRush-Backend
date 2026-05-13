package com.ticketrush.backend.util;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

public final class QueueCookieUtils {
    private static final String QUEUE_TOKEN_COOKIE_PREFIX = "queue_token_";

    private QueueCookieUtils() {
    }

    public static String cookieName(Integer eventId) {
        return QUEUE_TOKEN_COOKIE_PREFIX + eventId;
    }

    public static Optional<String> getQueueToken(HttpServletRequest request, Integer eventId) {
        if (request.getCookies() == null) {
            return Optional.empty();
        }

        String cookieName = cookieName(eventId);
        for (Cookie cookie : request.getCookies()) {
            if (cookieName.equals(cookie.getName()) && cookie.getValue() != null && !cookie.getValue().isBlank()) {
                return Optional.of(cookie.getValue());
            }
        }

        return Optional.empty();
    }

    public static Map<Integer, String> extractQueueTokens(HttpServletRequest request) {
        Map<Integer, String> queueTokens = new HashMap<>();
        if (request.getCookies() == null) {
            return queueTokens;
        }

        for (Cookie cookie : request.getCookies()) {
            String name = cookie.getName();
            String value = cookie.getValue();
            if (!name.startsWith(QUEUE_TOKEN_COOKIE_PREFIX) || value == null || value.isBlank()) {
                continue;
            }

            String eventId = name.substring(QUEUE_TOKEN_COOKIE_PREFIX.length());
            try {
                queueTokens.put(Integer.parseInt(eventId), value);
            } catch (NumberFormatException ignored) {
            }
        }

        return queueTokens;
    }
}
