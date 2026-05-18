import { API_ENDPOINTS } from "@/lib/api-config";
import { Event } from "@/features/events/types";

export type EventsResponse = {
  code: number;
  message: string;
  result: Event[] | null;
};

function readMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  if (!("message" in payload)) return null;
  const msg = (payload as { message?: unknown }).message;
  return typeof msg === "string" ? msg : null;
}

export const getEvents = async (): Promise<EventsResponse> => {
  const url = API_ENDPOINTS.admin.events;

  if (!url) {
    throw new Error("Chưa cấu hình API để lấy danh sách sự kiện");
  }

  try {
    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const payload: unknown = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(readMessage(payload) ?? "Không thể tải danh sách sự kiện");
    }

    if (!payload || typeof payload !== "object") {
      throw new Error("Dữ liệu sự kiện không hợp lệ");
    }

    const record = payload as Record<string, unknown>;
    const result =
      (record.result ?? record.results ?? record.data ?? null) as unknown;

    return {
      code: typeof record.code === "number" ? record.code : 0,
      message: typeof record.message === "string" ? record.message : "",
      result: Array.isArray(result) ? (result as Event[]) : null,
    };
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
};
