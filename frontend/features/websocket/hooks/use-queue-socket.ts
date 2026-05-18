"use client";

import { useEffect } from "react";
import { websocketService } from "@/features/websocket/services/websocket-services";


export function useQueueSocket(
  eventId: number,
  onMessage: (raw: string) => void,
) {
  useEffect(() => {
    websocketService.connect();
    const unsubscribe = websocketService.subscribe(
      `/user/queue/queue/${eventId}`,
      onMessage,
    );

    return () => {
      unsubscribe();
    };
  }, [eventId, onMessage]);
}