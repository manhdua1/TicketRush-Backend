import { Category } from "@/features/events/types";
import { API_ENDPOINTS } from "@/lib/api-config";
import { Event } from "@/features/events/types";

export type EventDetailRequest = {
    title: string,
    description: string,
    venue: string,
    startTime: string,
    endTime: string,
    type: Category,
    posterUrl: string,
    endTimeAfterStartTime: boolean,
    longitude: number | null,
    latitude: number | null,
}

function readMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  if (!("message" in payload)) return null;
  const msg = (payload as { message?: unknown }).message;
  return typeof msg === "string" ? msg : null;
}

function unwrapEvent(payload: unknown): Event {
  if (!payload || typeof payload !== "object") {
    throw new Error("Dữ liệu sự kiện không hợp lệ");
  }

  const record = payload as Record<string, unknown>;
  const result = (record.result ?? record.results ?? record.data ?? null) as unknown;
  if (result && typeof result === "object") return result as Event;
  return record as unknown as Event;
}

export const modifyEventDetail = async (eventId: number, data: EventDetailRequest): Promise<Event> => {
    const url = `${API_ENDPOINTS.admin.events}/${eventId}`;

    if (!url) {
        throw new Error("Chưa cấu hình API để cập nhật sự kiện");
    }

    try {
        const res = await fetch(url, {
            method: 'PUT',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const payload: unknown = await res.json().catch(() => null);

        if (!res.ok) {
            throw new Error(readMessage(payload) || "Không thể cập nhật sự kiện");
        }

        return unwrapEvent(payload);
    } catch (error) {
        console.error('Error modifying event detail:', error);
        throw error;
    }
}
