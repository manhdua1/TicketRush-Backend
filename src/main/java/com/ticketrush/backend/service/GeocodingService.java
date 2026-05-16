package com.ticketrush.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

@Service
@FieldDefaults(level = AccessLevel.PRIVATE)
@Slf4j
public class GeocodingService {
    final ObjectMapper objectMapper = new ObjectMapper();
    final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${geocoding.nominatim-url:https://nominatim.openstreetmap.org/search}")
    String nominatimUrl;

    @Value("${geocoding.user-agent:ticketrush-backend/1.0}")
    String userAgent;

    @Value("${geocoding.default-country:Vietnam}")
    String defaultCountry;

    @Value("${geocoding.timeout-ms:5000}")
    long timeoutMs;

    public Coordinates geocode(String venue) {
        String query = buildQuery(venue);
        URI uri = UriComponentsBuilder.fromUriString(nominatimUrl)
                .queryParam("q", query)
                .queryParam("format", "json")
                .queryParam("limit", 1)
                .queryParam("addressdetails", 0)
                .build()
                .encode()
                .toUri();

        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(Duration.ofMillis(timeoutMs))
                .header("User-Agent", userAgent)
                .header("Accept", "application/json")
                .header("Accept-Language", "vi,en")
                .GET()
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("Geocoding request failed with status {} for venue {}", response.statusCode(), venue);
                return null;
            }

            JsonNode results = objectMapper.readTree(response.body());
            if (!results.isArray() || results.isEmpty()) {
                log.warn("No geocoding result found for venue {}", venue);
                return null;
            }

            JsonNode firstResult = results.get(0);
            return new Coordinates(
                    firstResult.path("lat").asDouble(),
                    firstResult.path("lon").asDouble());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            log.warn("Geocoding request was interrupted for venue {}", venue, exception);
            return null;
        } catch (IOException | IllegalArgumentException exception) {
            log.warn("Geocoding request failed for venue {}", venue, exception);
            return null;
        }
    }

    private String buildQuery(String venue) {
        if (defaultCountry == null || defaultCountry.isBlank()) {
            return venue;
        }
        return venue + ", " + defaultCountry;
    }

    public record Coordinates(double latitude, double longitude) {
    }
}
