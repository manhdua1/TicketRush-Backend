package com.ticketrush.backend.service;

import com.ticketrush.backend.dto.response.TicketResponse;
import com.ticketrush.backend.entity.Ticket;
import com.ticketrush.backend.exception.AppException;
import com.ticketrush.backend.exception.ErrorCode;
import com.ticketrush.backend.mapper.TicketMapper;
import com.ticketrush.backend.repository.TicketRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TicketService {
    TicketRepository ticketRepository;
    TicketMapper ticketMapper;

    public List<TicketResponse> getMyTickets(Integer userId) {
        return ticketRepository.findByBookingUserId(userId)
                .stream()
                .map(ticketMapper::toTicketResponse)
                .toList();
    }

    public TicketResponse getTicketByQrCode(String qrCode) {
        Ticket ticket = ticketRepository.findByQrCode(qrCode)
                .orElseThrow(() -> new AppException(ErrorCode.TICKET_NOT_FOUND));
        return ticketMapper.toTicketResponse(ticket);
    }
}
