"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { joinQueue } from "@/features/queue/services/join_queue";
import { sendHeartBeat } from "@/features/queue/services/heartbeat_queue";
import { leaveQueue } from "@/features/queue/services/leave_queue";
import {
  getQueueStatus,
  type QueueStatusResult,
} from "@/features/queue/services/queue_status";
import { websocketService } from "@/features/websocket/services/websocket-services";

export type QueueStatus = "WAITING" | "GRANTED" | "EXPIRED" | "IDLE";

export type QueueState = {
  status: QueueStatus;
  position: number;
  totalInQueue: number;
  estimatedWaitSeconds: number;
  isLoading: boolean;
  error: string | null;
};

const HEARTBEAT_INTERVAL_MS = 25_000;
const POLL_INTERVAL_MS = 5_000;

const initialState: QueueState = {
  status: "IDLE",
  position: 0,
  totalInQueue: 0,
  estimatedWaitSeconds: 0,
  isLoading: false,
  error: null,
};

export function useQueue(eventId: number, onGranted?: () => void) {
  const [state, setState] = useState<QueueState>(initialState);
  const grantedRef = useRef(false);
  const bootSeqRef = useRef(0);

  const applyStatus = useCallback((next: QueueStatusResult) => {
    setState((prev) => ({
      ...prev,
      status: next.status,
      position: next.position,
      totalInQueue: next.totalInQueue,
      estimatedWaitSeconds: next.estimatedWaitSeconds,
      isLoading: false,
      error: next.status === "EXPIRED" ? "Phien hang cho da het han. Vui long thu lai." : null,
    }));

    if (next.status === "GRANTED" && !grantedRef.current) {
      grantedRef.current = true;
      onGranted?.();
    }
  }, [onGranted]);

  const joinQueueFlow = useCallback(async () => {
    if (!Number.isFinite(eventId) || eventId <= 0) return;

    const seq = ++bootSeqRef.current;
    grantedRef.current = false;

    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    const joined = await joinQueue(eventId);
    if (seq !== bootSeqRef.current) return;

    if (!joined.ok || !joined.status) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: joined.message,
      }));
      return;
    }

    applyStatus({
      status: joined.status.position === 0 ? "GRANTED" : "WAITING",
      position: joined.status.position,
      totalInQueue: joined.status.totalInQueue,
      estimatedWaitSeconds: 0,
    });

    const current = await getQueueStatus(eventId);
    if (seq !== bootSeqRef.current) return;

    if (current.ok && current.status) {
      applyStatus(current.status);
    } else if (current.statusCode !== 400) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: current.message,
      }));
    }
  }, [applyStatus, eventId]);

  useEffect(() => {
    if (!Number.isFinite(eventId) || eventId <= 0) {
      return;
    }

    let mounted = true;

    const unsubscribe = websocketService.subscribe(
      `/user/queue/queue/${eventId}`,
      (body) => {
        if (!mounted) return;

        try {
          applyStatus(JSON.parse(body) as QueueStatusResult);
        } catch {
          // Ignore malformed realtime messages; polling remains as fallback.
        }
      },
    );

    websocketService.connect();
    const bootId = window.setTimeout(() => {
      void joinQueueFlow();
    }, 0);

    const heartbeatId = window.setInterval(() => {
      void sendHeartBeat(eventId);
    }, HEARTBEAT_INTERVAL_MS);

    const pollId = window.setInterval(async () => {
      const next = await getQueueStatus(eventId);
      if (!mounted || !next.ok || !next.status) return;
      applyStatus(next.status);
    }, POLL_INTERVAL_MS);

    return () => {
      mounted = false;
      bootSeqRef.current += 1;
      window.clearTimeout(bootId);
      window.clearInterval(heartbeatId);
      window.clearInterval(pollId);
      unsubscribe();
    };
  }, [applyStatus, eventId, joinQueueFlow]);

  const leaveQueueFlow = useCallback(async (): Promise<{ ok: boolean; message: string }> => {
    const result = await leaveQueue(eventId);

    setState({
      ...initialState,
      error: result.ok ? null : result.message,
    });

    return { ok: result.ok, message: result.message };
  }, [eventId]);

  const isGranted = state.status === "GRANTED";
  const isWaiting = state.status === "WAITING";
  const isExpired = state.status === "EXPIRED";

  return {
    state,
    isGranted,
    isWaiting,
    isExpired,
    joinQueueFlow,
    leaveQueueFlow,
  };
}
