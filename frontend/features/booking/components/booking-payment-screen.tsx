"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CreditCard, ShieldCheck, Wallet, AlertCircle } from "lucide-react";

import BookingSteps from "@/features/booking/components/booking-steps";
import { readBookingDraft, type BookingDraft } from "@/features/booking/utils/booking-storage";
import { useGetEventById } from "@/features/events/hooks/use-get-event-by-id";
import { formatIsoToDobDisplay } from "@/features/auth/utils/date-of-birth";
import { formatPriceVND } from "@/features/events/utils/format-price";
import { useBookingPayment } from "@/features/booking/hooks/use-booking-payment";
import { useTimerToast } from "@/features/queue/hooks/use-timer-toast";
import TimerToast from "@/features/queue/components/timer-toast";

const PAYMENT_TOAST_MS = 10 * 1000; // 10 giây


type BookingPaymentScreenProps = {
  eventId: number;
};

const PAYMENT_METHODS = [
  { id: "card", label: "Thẻ tín dụng", icon: CreditCard },
  { id: "wallet", label: "Ví điện tử", icon: Wallet },
  { id: "bank", label: "Chuyển khoản", icon: ShieldCheck },
] as const;

export default function BookingPaymentScreen({ eventId }: BookingPaymentScreenProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<BookingDraft | null>(null);
  const [method, setMethod] = useState<(typeof PAYMENT_METHODS)[number]["id"]>("card");

  const { event, loading: eventLoading } = useGetEventById(eventId);

  const { state, toggleCancelDialog, confirmBooking, cancelAndBack } = useBookingPayment();
  const { toastState, show: showToast, dismiss: dismissToast } = useTimerToast();

  // Auto-close progress-border toast on mount
  useEffect(() => {
    showToast({ message: "Bạn có 10 phút để hoàn tất thanh toán", durationMs: PAYMENT_TOAST_MS });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const stored = readBookingDraft();
    if (!stored || stored.eventId !== eventId) {
      setDraft(null);
      return;
    }
    setDraft(stored);
  }, [eventId]);

  const selectedSeats = useMemo(
    () => draft?.seats ?? [],
    [draft?.seats],
  );
  const total = useMemo(
    () => selectedSeats.reduce((sum, seat) => sum + seat.price, 0),
    [selectedSeats],
  );

  const eventDateLabel = event?.startTime
    ? formatIsoToDobDisplay(new Date(event.startTime).toISOString().slice(0, 10))
    : "--";
  const eventTimeLabel = event?.startTime
    ? new Date(event.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "--";

  const handleBack = () => toggleCancelDialog();

  const handleConfirmCancel = async () => {
    const result = await cancelAndBack();
    if (result?.success) {
      router.push(`/events/${eventId}`);
    }
  };

  const handlePay = async () => {
    if (!draft?.bookingId || selectedSeats.length === 0 || !event) return;

    await confirmBooking(draft.bookingId, {
      eventId,
      eventTitle: event.title || "Sự kiện",
      eventDate: eventDateLabel,
      totalAmount: total,
    });
  };

  return (
    <div className="min-h-dvh">
      <TimerToast toast={toastState} onDismiss={dismissToast} />
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
            <BookingSteps currentStep={2} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="rounded-3xl border border-border bg-surface/55 p-6 shadow-[0_22px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Thanh toán</h1>
              <p className="mt-2 text-sm text-muted">Chọn phương thức thanh toán của bạn.</p>

              {state.error && (
                <div className="mt-4 flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {state.error}
                </div>
              )}

              {!draft ? (
                <div className="mt-6 rounded-2xl border border-border bg-surface/40 px-4 py-6 text-sm text-muted">
                  Chưa có ghế đã chọn. Vui lòng quay lại bước chọn ghế.
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  {PAYMENT_METHODS.map((item) => {
                    const Icon = item.icon;
                    const isSelected = method === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setMethod(item.id)}
                        className={
                          "flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition " +
                          (isSelected
                            ? "border-primary/70 bg-primary/10 text-foreground"
                            : "border-border bg-surface/60 text-foreground/70 hover:text-foreground")
                        }
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={
                              "grid h-10 w-10 place-items-center rounded-full border " +
                              (isSelected
                                ? "border-primary/60 bg-primary/20 text-primary"
                                : "border-border bg-surface/60 text-foreground/70")
                            }
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="text-sm font-semibold">{item.label}</div>
                        </div>
                        <span
                          className={
                            "h-4 w-4 rounded-full border " +
                            (isSelected ? "border-primary bg-primary" : "border-border")
                          }
                        />
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={handlePay}
                disabled={!draft || selectedSeats.length === 0 || state.isConfirming}
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-linear-to-r from-primary to-secondary text-sm font-bold text-foreground shadow-[0_0_30px_rgba(124,58,237,0.35)] transition disabled:cursor-not-allowed disabled:opacity-50"
              >
                {state.isConfirming ? "Đang xử lý..." : "Thanh toán ngay"}
              </button>
            </section>

            <aside className="lg:sticky lg:top-24">
              <div className="rounded-3xl border border-border bg-surface/60 p-6 shadow-[0_22px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                <div className="text-sm text-foreground/70">
                  {eventDateLabel} • {eventTimeLabel}
                </div>
                <h2 className="mt-3 text-lg font-extrabold tracking-tight">
                  {event?.title ?? (eventLoading ? "Đang tải sự kiện..." : "Sự kiện")}
                </h2>
                <div className="mt-5 border-t border-border/70 pt-4">
                  <div className="flex items-center justify-between text-base font-bold text-foreground">
                    <span>Tổng cộng</span>
                    <span className="text-primary">{formatPriceVND(total)}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {state.showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-w-sm rounded-2xl border border-border bg-surface/95 p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-warning" />
              <h2 className="text-lg font-bold">Xác nhận hủy đơn đặt vé?</h2>
            </div>
            <p className="mt-3 text-sm text-foreground/75">
              Bạn sắp quay lại màn hình nội dung sự kiện, bạn sẽ phải xếp hàng lại từ đầu nếu muốn đặt vé. Bạn có chắc chắn muốn hủy đơn đặt vé này không?
            </p>
            {state.error && (
              <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {state.error}
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={toggleCancelDialog}
                disabled={state.isCancelling}
                className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-semibold transition hover:bg-surface/80 disabled:opacity-50"
              >
                Tiếp tục
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={state.isCancelling}
                className="flex-1 rounded-lg bg-destructive px-3 py-2 text-sm font-semibold text-destructive-foreground transition hover:bg-destructive/90 disabled:opacity-50"
              >
                {state.isCancelling ? "Đang hủy..." : "Hủy đơn"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
