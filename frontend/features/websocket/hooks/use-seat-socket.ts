"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getEventSeats } from "@/features/booking/services/get-event-seats";
import type { Seat, SeatStatus } from "@/features/events/types";
import { websocketService } from "@/features/websocket/services/websocket-services";

type SeatStatusMessage = {
  eventId: number;
  seatId: number;
  status: SeatStatus;
};

type UseSeatSocketResult = {
  seats: Seat[];
  seatMap: Map<number, Seat>;
  loading: boolean;
  error: string | null;
};

function sortSeatsByPrice(seats: Seat[]) {
  return [...seats].sort((a, b) => a.price - b.price);
}

export function useSeatSocket(eventId: number): UseSeatSocketResult {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    if (!Number.isFinite(eventId) || eventId <= 0) {
      setSeats([]);
      setError(null);
      setLoading(false);
      return;
    }

    aliveRef.current = true;

    const loadSnapshot = async () => {
      setLoading(true);
      try {
        const result = await getEventSeats(eventId);
        if (!aliveRef.current) return;
        if (result.ok) {
          setSeats(sortSeatsByPrice(result.data));
          setError(null);
        } else {
          setSeats([]);
          setError(result.message);
        }
      } catch {
        if (aliveRef.current) {
          setSeats([]);
          setError("Không tải được danh sách ghế.");
        }
      } finally {
        if (aliveRef.current) setLoading(false);
      }
    };

    // 1. Subscribe TRƯỚC khi connect để không bỏ sót event nào
    const unsubscribeMessage = websocketService.subscribe(
      `/topic/events/${eventId}/seats`,
      (body) => {
        if (!aliveRef.current) return;
        try {
          const message = JSON.parse(body) as SeatStatusMessage;
          if (message.eventId !== eventId) return;
          setSeats((current) => {
            const idx = current.findIndex((s) => s.id === message.seatId);
            if (idx === -1) return current;
            const next = [...current];
            next[idx] = { ...next[idx], status: message.status };
            return next;
          });
        } catch {
          // bỏ qua message lỗi
        }
      },
    );

    // 2. Reconnect → refetch snapshot
    const unsubscribeConnect = websocketService.onConnect((isReconnect) => {
      if (isReconnect && aliveRef.current) {
        void loadSnapshot();
      }
    });

    // 3. Connect SAU khi đã subscribe
    websocketService.connect();

    // 4. Fetch initial snapshot
    void loadSnapshot();

    return () => {
      aliveRef.current = false;
      unsubscribeMessage();
      unsubscribeConnect();
    };
  }, [eventId]);

  const seatMap = useMemo(() => {
    const map = new Map<number, Seat>();
    for (const seat of seats) {
      map.set(seat.id, seat);
    }
    return map;
  }, [seats]);

  return { seats, seatMap, loading, error };
}