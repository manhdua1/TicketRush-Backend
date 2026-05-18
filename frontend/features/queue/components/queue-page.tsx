"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import QueueScreen from "@/features/queue/components/queue-screen";
import { useQueue } from "@/features/queue/hooks/use-queue";

export default function QueuePage({ eventId }: { eventId: number }) {
  const router = useRouter();

  const handleGranted = useCallback(() => {
    router.replace(`/events/${eventId}/booking?granted=1`);
  }, [eventId, router]);

  const { state, joinQueueFlow, leaveQueueFlow } = useQueue(eventId, handleGranted);

  const handleLeave = async () => {
    await leaveQueueFlow();
    router.replace(`/events/${eventId}`);
  };

  if (!Number.isFinite(eventId) || eventId <= 0) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background px-4 text-center text-sm text-muted">
        Event khong hop le.
      </main>
    );
  }

  if (state.status === "IDLE" || state.isLoading) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background px-4 text-center text-sm text-muted">
        Dang vao hang cho...
      </main>
    );
  }

  if (state.error) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background px-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-surface/70 p-6 text-center shadow-[0_22px_80px_rgba(0,0,0,0.45)]">
          <h1 className="text-base font-bold text-foreground">Khong the tiep tuc hang cho</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">{state.error}</p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => router.replace(`/events/${eventId}`)}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold transition hover:bg-surface/80"
            >
              Quay lai
            </button>
            <button
              type="button"
              onClick={() => void joinQueueFlow()}
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              Thu lai
            </button>
          </div>
        </div>
      </main>
    );
  }

  return <QueueScreen state={state} onLeave={handleLeave} />;
}
