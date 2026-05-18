import { EventDetailRequest } from "./modify-event-detail";
import { API_ENDPOINTS } from "@/lib/api-config";
import { Event } from "@/features/events/types";

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

  // Wrapped response: { code, message, result }
  if (result && typeof result === "object") {
    return result as Event;
  }

  // Raw Event response
  return record as unknown as Event;
}

export const createEvent = async (data: EventDetailRequest): Promise<Event> => {
  const url = API_ENDPOINTS.admin.events;

  if (!url) {
    throw new Error("Chưa cấu hình API để tạo sự kiện");
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const payload: unknown = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(readMessage(payload) || "Không thể tạo sự kiện");
    }

    return unwrapEvent(payload);
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
};
