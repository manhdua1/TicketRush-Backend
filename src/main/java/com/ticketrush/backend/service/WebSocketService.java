package com.ticketrush.backend.service;

import com.ticketrush.backend.dto.response.SeatStatusMessage;
import com.ticketrush.backend.entity.Seat;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class WebSocketService {
     SimpMessagingTemplate messagingTemplate;

     /**
     * Broadcast trạng thái ghế tới tất cả client đang xem sự kiện.
     * Client cần subscribe topic: /topic/events/{eventId}/seats
     */
     public void broadcastSeatStatus(Integer eventId, Integer seatId, String label, Seat.Status status) {
         SeatStatusMessage message = SeatStatusMessage.builder()
                 .eventId(eventId)
                 .seatId(seatId)
                 .label(label)
                 .status(status)
                 .build();

         messagingTemplate.convertAndSend(
                 "/topic/events/" + eventId + "/seats", message);
     }
}
