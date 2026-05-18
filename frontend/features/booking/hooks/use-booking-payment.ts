"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { readBookingDraft, clearBookingDraft } from "@/features/booking/utils/booking-storage";
import { confirmBooking as confirmBookingApi } from "@/features/booking/services/confirm-booking";
import { cancelBooking } from "@/features/booking/services/cancel-booking";

export type BookingPaymentState = {
  isConfirming: boolean;
  isCancelling: boolean;
  error: string | null;
  showCancelDialog: boolean;
};

export function useBookingPayment(onSuccess?: () => void) {
  const [state, setState] = useState<BookingPaymentState>({
    isConfirming: false,
    isCancelling: false,
    error: null,
    showCancelDialog: false,
  });


  const router = useRouter();

  const toggleCancelDialog = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showCancelDialog: !prev.showCancelDialog,
      error: null,
    }));
  }, []);

  const confirmBooking = useCallback(
    async (
      bookingId: number,
      successData?: { eventId: number; eventTitle: string; eventDate: string; totalAmount: number },
    ) => {
      setState((prev) => ({
        ...prev,
        isConfirming: true,
        error: null,
      }));

      const result = await confirmBookingApi(bookingId);

      if (result.ok) {
        setState((prev) => ({
          ...prev,
          isConfirming: false,
        }));

        clearBookingDraft();
        onSuccess?.();

        if (successData) {
          const searchParams = new URLSearchParams({
            event: successData.eventTitle,
            date: successData.eventDate,
            total: successData.totalAmount.toString(),
          });
          router.push(
            `/events/${successData.eventId}/booking/success?${searchParams.toString()}`,
          );
        }

        return { success: true, bookingId: result.data?.result.id };
      }

      setState((prev) => ({
        ...prev,
        isConfirming: false,
        error: result.message,
      }));

      return { success: false };
    },
    [onSuccess, router],
  );

  const cancelAndBack = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      isCancelling: true,
      error: null,
    }));

    try {
      const draft = readBookingDraft();

      if (!draft) {
        setState((prev) => ({
          ...prev,
          isCancelling: false,
          showCancelDialog: false,
        }));
        return { success: true };
      }

      if (draft.bookingId) {
        const result = await cancelBooking(draft.bookingId);

        if (!result.ok) {
          setState((prev) => ({
            ...prev,
            isCancelling: false,
            error: result.message || "Hủy booking không thành công",
          }));
          return { success: false };
        }
      }

      clearBookingDraft();

      setState((prev) => ({
        ...prev,
        isCancelling: false,
        showCancelDialog: false,
      }));

      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Lỗi không xác định";

      setState((prev) => ({
        ...prev,
        isCancelling: false,
        error: errorMsg,
      }));

      return { success: false };
    }
  }, []);

  return {
    state,
    toggleCancelDialog,
    confirmBooking,
    cancelAndBack,
  };
}
