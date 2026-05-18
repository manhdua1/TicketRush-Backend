export type BookingContact = {
  fullName: string;
  email: string;
  phone: string;
  note: string;
};

export type BookingSeatDraft = {
  id: number;
  zoneName: string;
  label: string;
  price: number;
  rowNumber: number;
  colNumber: number;
};

export type BookingDraft = {
  eventId: number;
  seats: BookingSeatDraft[];
  contact?: BookingContact;
  bookingId?: number;
};

const BOOKING_STORAGE_KEY = "ticketrush.booking.draft";

function isValidDraft(value: unknown): value is BookingDraft {
  if (!value || typeof value !== "object") return false;

  const draft = value as BookingDraft;
  if (!Number.isFinite(draft.eventId)) return false;
  if (!Array.isArray(draft.seats)) return false;

  if (draft.bookingId !== undefined && !Number.isFinite(draft.bookingId)) return false;

  return true;
}

export function readBookingDraft(): BookingDraft | null {
  if (typeof window === "undefined") return null;

  const raw = window.sessionStorage.getItem(BOOKING_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as BookingDraft;
    return isValidDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveBookingDraft(draft: BookingDraft) {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(
    BOOKING_STORAGE_KEY,
    JSON.stringify(draft),
  );
}

export function clearBookingDraft() {
  if (typeof window === "undefined") return;

  window.sessionStorage.removeItem(BOOKING_STORAGE_KEY);
}
