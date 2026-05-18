import { Event } from "@/features/events/types";
import { API_ENDPOINTS } from "@/lib/api-config";

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

export const changeEventStatus = async (
  eventId: number,
  status: "DRAFT" | "ON_SALE" | "ENDED",
): Promise<Event> => {
  const url = `${API_ENDPOINTS.admin.events}/${eventId}/status`;

  if (!url) {
    throw new Error("Chưa cấu hình API để đổi trạng thái sự kiện");
  }

  try {
    const res = await fetch(url, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    });

    const payload: unknown = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(readMessage(payload) || "Không thể đổi trạng thái sự kiện");
    }

    return unwrapEvent(payload);
  } catch (error) {
    console.error("Error changing event status:", error);
    throw error;
  }
};
