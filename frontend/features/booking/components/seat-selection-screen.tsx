"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Ban,
  Calendar,
  LogOut,
  Minus,
  Plus,
  LocateFixed,
  X,
} from "lucide-react";

import BookingSteps from "@/features/booking/components/booking-steps";
import { SeatItem, buildSeatLabel } from "@/features/booking/components/seat-item";
import { formatIsoToDobDisplay } from "@/features/auth/utils/date-of-birth";
import { useGetEventById } from "@/features/events/hooks/use-get-event-by-id";
import { saveBookingDraft } from "@/features/booking/utils/booking-storage";
import { holdSeats } from "@/features/booking/services/hold-seats";
import { formatPriceVND } from "@/features/events/utils/format-price";
import type { Seat } from "@/features/events/types";
import { useSeatSocket } from "@/features/websocket/hooks/use-seat-socket";
import { leaveQueue } from "@/features/queue/services/leave_queue";
import { sendHeartBeat } from "@/features/queue/services/heartbeat_queue";
import { useTimerToast } from "@/features/queue/hooks/use-timer-toast";
import TimerToast from "@/features/queue/components/timer-toast";

const GRANTED_TOAST_MS = 10 * 1000; // 10 giây

type SeatSelectionScreenProps = {
  eventId: number;
};

const ZOOM_STEP = 0.1;
const ZOOM_MIN = 0.8;
const ZOOM_MAX = 1.4;

function rowToLabel(rowNumber: number): string {
  if (rowNumber >= 1 && rowNumber <= 26) {
    return String.fromCharCode(64 + rowNumber);
  }
  return `R${rowNumber}`;
}

function sortSeat(a: Seat, b: Seat): number {
  if (a.rowNumber !== b.rowNumber) return a.rowNumber - b.rowNumber;
  return a.colNumber - b.colNumber;
}

function formatSeatPosition(seat: Seat): string {
  return `Hàng ${rowToLabel(seat.rowNumber)}, Ghế ${seat.colNumber}`;
}

export default function SeatSelectionScreen({ eventId }: SeatSelectionScreenProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { event, loading: eventLoading } = useGetEventById(eventId);
  const { seats, seatMap, loading: seatsLoading, error: seatsError } = useSeatSocket(eventId);
  const [selectedSeatIds, setSelectedSeatIds] = useState<number[]>([]);
  const [zoom, setZoom] = useState(1);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const { toastState, show: showToast, dismiss: dismissToast } = useTimerToast();
  const toastShownRef = useRef(false);

  // O(1) lookup trong render
  const selectedSet = useMemo(() => new Set(selectedSeatIds), [selectedSeatIds]);

  // Memoize zones to prevent unnecessary re-renders
  const zones = useMemo(() => {
    const list = event?.zones ?? [];
    return [...list].sort((a, b) => {
      const ap = a.price ?? 0;
      const bp = b.price ?? 0;
      if (ap !== bp) return ap - bp;
      return a.id - b.id;
    });
  }, [event?.zones]);

  // Group seats by zone dùng Map
  const zoneBlocks = useMemo(() => {
    if (zones.length === 0 || seats.length === 0) return [];

    const zoneSeatsMap = new Map<number, Seat[]>();
    for (const seat of seats) {
      let arr = zoneSeatsMap.get(seat.zoneId);
      if (!arr) {
        arr = [];
        zoneSeatsMap.set(seat.zoneId, arr);
      }
      arr.push(seat);
    }

    const sortedZones = [...zones].sort((a, b) => a.price - b.price);

    return sortedZones.map((zone) => {
      const zoneSeats = zoneSeatsMap.get(zone.id) ?? [];
      zoneSeats.sort(sortSeat);
      return { zone, seats: zoneSeats };
    });
  }, [seats, zones]);
      
  // selectedSeats dùng seatMap O(1)
  const selectedSeats = useMemo(() => {
    const result: Seat[] = [];
    for (const id of selectedSeatIds) {
      const seat = seatMap.get(id);
      if (seat) result.push(seat);
    }
    return result;
  }, [seatMap, selectedSeatIds]);

  const total = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  const eventDateLabel = event?.startTime
    ? formatIsoToDobDisplay(new Date(event.startTime).toISOString().slice(0, 10))
    : "--";
  const eventTimeLabel = event?.startTime
    ? new Date(event.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "--";

  const isLoading = eventLoading || seatsLoading;

  // Auto-unselect ghế invalid khi có realtime patch — O(1) Map lookup
  useEffect(() => {
    if (seatMap.size === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedSeatIds((current) =>
      current.filter((id) => seatMap.get(id)?.status === "AVAILABLE"),
    );
  }, [seatMap]);

  const handleToggleSeat = (seat: Seat) => {
    const isSelected = selectedSet.has(seat.id); // O(1)
    if (seat.status !== "AVAILABLE" && !isSelected) return;
    setSelectedSeatIds((current) =>
      isSelected ? current.filter((id) => id !== seat.id) : [...current, seat.id],
    );
  };

  const handleRemoveSeat = (seatId: number) => {
    setSelectedSeatIds((current) => current.filter((id) => id !== seatId));
  };

  const handleZoomIn = () => setZoom((c) => Math.min(ZOOM_MAX, c + ZOOM_STEP));
  const handleZoomOut = () => setZoom((c) => Math.max(ZOOM_MIN, c - ZOOM_STEP));
  const handleRecenter = () => setZoom(1);

  // Back button: if queueRequired → confirm leave, else navigate directly
  const handleBack = () => {
    if (event?.queueRequired) {
      setShowLeaveDialog(true);
    } else {
      router.push(`/events/${eventId}`);
    }
  };

  const handleLeaveConfirm = async () => {
    setIsLeaving(true);
    await leaveQueue(eventId);
    setIsLeaving(false);
    setShowLeaveDialog(false);
    router.push(`/events/${eventId}`);
  };

  // Show auto-close progress-border toast when arriving from queue GRANTED
  useEffect(() => {
    if (searchParams.get("granted") === "1" && !toastShownRef.current) {
      toastShownRef.current = true;
      showToast({ message: "Bạn có 10 phút để chọn ghế", durationMs: GRANTED_TOAST_MS });
    }
  }, [searchParams, showToast]);

  useEffect(() => {
    if (!Number.isFinite(eventId) || eventId <= 0) return;

    void sendHeartBeat(eventId);
    const heartbeatId = window.setInterval(() => {
      void sendHeartBeat(eventId);
    }, 25_000);

    return () => window.clearInterval(heartbeatId);
  }, [eventId]);

  const handleContinue = () => {
    if (selectedSeats.length === 0) return;

    void (async () => {
      const result = await holdSeats({ seatIds: selectedSeats.map((s) => s.id) });

      if (!result.ok) {
        if (
          result.statusCode === 403 ||
          /NOT_IN_QUEUE|QUEUE|HANG|QUYEN|GRANTED/i.test(result.message)
        ) {
          router.replace(`/events/${eventId}/queue`);
          return;
        }

        alert(result.message || "Không thể giữ ghế. Vui lòng thử lại.");
        return;
      }

      saveBookingDraft({
        eventId,
        seats: selectedSeats.map((seat) => ({
          id: seat.id,
          zoneName: seat.zoneName,
          label: buildSeatLabel(seat),
          price: seat.price,
          rowNumber: seat.rowNumber,
          colNumber: seat.colNumber,
        })),
        bookingId: result.data?.result?.id,
      });

      router.push(`/events/${eventId}/booking/payment`);
    })();
  };

  return (
    <div className="min-h-dvh">
      <main className="pt-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-2 text-sm font-semibold text-foreground/80 transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </button>
            <BookingSteps currentStep={1} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="space-y-6">
              <div className="relative overflow-hidden rounded-3xl border border-border bg-surface/50 p-6 shadow-[0_22px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8">
                <div className="flex items-center justify-center gap-3 text-xs font-semibold tracking-[0.35em] text-muted">
                  <span className="h-1 w-12 rounded-full bg-linear-to-r from-primary/20 via-primary/60 to-secondary/50" />
                  STAGE
                  <span className="h-1 w-12 rounded-full bg-linear-to-r from-secondary/50 via-primary/60 to-primary/20" />
                </div>

                <div className="mt-8 space-y-10" style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
                  {isLoading && seats.length === 0 ? (
                    <div className="rounded-2xl border border-border bg-surface/40 px-6 py-10 text-center text-sm text-muted">
                      Đang tải sơ đồ chỗ ngồi...
                    </div>
                  ) : zoneBlocks.length === 0 && !isLoading ? (
                    <div className="rounded-2xl border border-border bg-surface/40 px-6 py-10 text-center text-sm text-muted">
                      Sơ đồ chỗ ngồi chưa sẵn sàng.
                    </div>
                  ) : (
                    zoneBlocks.map(({ zone, seats: zoneSeats }) => (
                      <div key={zone.id} className="space-y-4">
                        <div className="text-center text-xs font-semibold uppercase tracking-[0.35em] text-muted">
                          {zone.name} • {formatPriceVND(zone.price)}
                        </div>
                        <div className="flex justify-center">
                          <div
                            className="grid gap-2 [--seat-size:1.35rem] sm:[--seat-size:1.55rem] lg:[--seat-size:1.7rem]"
                            style={{ gridTemplateColumns: `repeat(${zone.totalCols}, minmax(0, var(--seat-size)))` }}
                          >
                            {zoneSeats.map((seat) => (
                              <SeatItem
                                key={seat.id}
                                seat={seat}
                                isSelected={selectedSet.has(seat.id)}
                                onToggle={handleToggleSeat}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full border border-foreground/30 bg-surface/30" />
                    Trống
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-primary shadow-[0_0_12px_rgba(124,58,237,0.7)]" />
                    Đã chọn
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="grid h-3 w-3 place-items-center rounded-full bg-surface-2/80">
                      <Ban className="h-2.5 w-2.5 text-muted" />
                    </span>
                    Đã bán
                  </div>
                </div>

                <div className="absolute bottom-6 right-6 flex flex-col gap-2 rounded-full border border-border bg-surface/70 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
                  <button type="button" onClick={handleZoomIn} className="grid h-9 w-9 place-items-center rounded-full text-foreground/70 transition hover:text-foreground" aria-label="Phóng to">
                    <Plus className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={handleZoomOut} className="grid h-9 w-9 place-items-center rounded-full text-foreground/70 transition hover:text-foreground" aria-label="Thu nhỏ">
                    <Minus className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={handleRecenter} className="grid h-9 w-9 place-items-center rounded-full text-foreground/70 transition hover:text-foreground" aria-label="Đưa về giữa">
                    <LocateFixed className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>

            <aside className="lg:sticky lg:top-28">
              <div className="rounded-3xl border border-border bg-surface/60 p-6 shadow-[0_22px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">Đang mở bán</div>

                <h2 className="mt-4 text-lg font-extrabold tracking-tight sm:text-xl">
                  {event?.title ?? (eventLoading ? "Đang tải sự kiện..." : "Sự kiện")}
                </h2>
                <div className="mt-2 flex items-center gap-2 text-sm text-foreground/70">
                  <Calendar className="h-4 w-4" />
                  <span>{eventDateLabel} • {eventTimeLabel}</span>
                </div>

                <div className="mt-6">
                  <div className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">
                    Ghế đã chọn ({selectedSeats.length})
                  </div>

                  {selectedSeats.length === 0 ? (
                    <div className="mt-3 rounded-2xl border border-border bg-surface/40 px-4 py-6 text-center text-sm text-muted">
                      Chọn ghế trong sơ đồ để bắt đầu.
                    </div>
                  ) : (
                    <ul className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-1">
                      <AnimatePresence initial={false}>
                        {selectedSeats.map((seat) => (
                          <motion.li
                            key={seat.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface/40 px-4 py-3"
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-foreground">{seat.zoneName}</div>
                              <div className="mt-1 text-xs text-muted">{formatSeatPosition(seat)}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">{formatPriceVND(seat.price)}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveSeat(seat.id)}
                                aria-label={`Bỏ ghế ${buildSeatLabel(seat)}`}
                                className="grid h-7 w-7 place-items-center rounded-full border border-border text-foreground/70 transition hover:text-foreground"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </motion.li>
                        ))}
                      </AnimatePresence>
                    </ul>
                  )}

                  {seatsError ? (
                    <div className="mt-4 rounded-2xl border border-border bg-surface/40 px-3 py-2 text-xs text-muted">
                      {seatsError}
                    </div>
                  ) : null}
                </div>

                <div className="mt-6 border-t border-border/70 pt-4">
                  <div className="flex items-center justify-between text-base font-bold text-foreground">
                    <span>Tổng cộng</span>
                    <span className="text-primary">{formatPriceVND(total)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={selectedSeats.length === 0}
                  onClick={handleContinue}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-linear-to-r from-primary to-secondary text-sm font-bold text-foreground shadow-[0_0_30px_rgba(124,58,237,0.35)] transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Tiếp tục thanh toán
                </button>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Timer toast */}
      <TimerToast toast={toastState} onDismiss={dismissToast} />

      {/* Leave queue confirmation dialog */}
      <AnimatePresence>
        {showLeaveDialog && (
          <motion.div
            key="leave-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          >
            <motion.div
              key="leave-dialog"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-full max-w-sm rounded-2xl border border-border bg-surface/95 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-500/30 bg-red-500/15">
                  <LogOut className="h-4 w-4 text-red-400" />
                </div>
                <h2 className="text-base font-bold">Rời hàng chờ?</h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground/65">
                Bạn đã được cấp quyền chọn ghế. Nếu rời đi, bạn sẽ phải xếp hàng lại từ đầu.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowLeaveDialog(false)}
                  disabled={isLeaving}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold transition hover:bg-surface/80 disabled:opacity-50"
                >
                  Ở lại
                </button>
                <button
                  type="button"
                  onClick={handleLeaveConfirm}
                  disabled={isLeaving}
                  className="flex-1 rounded-xl bg-red-500/90 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                >
                  {isLeaving ? "Đang rời..." : "Rời hàng chờ"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
