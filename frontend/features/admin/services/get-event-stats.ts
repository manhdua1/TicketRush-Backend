import { API_ENDPOINTS } from "@/lib/api-config";

export type EventStats = {
    eventId: number;
    eventTitle: string;
    totalRevenue: number;
    totalSeats: number;
    soldSeats: number;
    lockedSeats: number;
    availableSeats: number;
    occupancyRate: number;
    zoneStats: ZoneStats[];
};

type ZoneStats = {
  zoneId: string;
  zoneName: string;
  colorHex: string;
  price: number;
  totalSeats: number;
  soldSeats: number;
  lockedSeats: number;
  availableSeats: number;
  occupancyRate: number;
  revenue: number;
};

function readMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  if (!("message" in payload)) return null;
  const msg = (payload as { message?: unknown }).message;
  return typeof msg === "string" ? msg : null;
}

function unwrapStats(payload: unknown): EventStats {
  if (!payload || typeof payload !== "object") {
    throw new Error("Dữ liệu thống kê sự kiện không hợp lệ");
  }

  const record = payload as Record<string, unknown>;
  const result = (record.result ?? record.results ?? record.data ?? null) as unknown;

  if (Array.isArray(result)) {
    const first = result[0] as unknown;
    if (first && typeof first === "object") return first as EventStats;
  }

  if (result && typeof result === "object") {
    return result as EventStats;
  }

  return record as unknown as EventStats;
}

export async function getEventStats(eventId: number): Promise<EventStats> {
  const base = API_ENDPOINTS.admin.events;

  if (!base) {
    throw new Error("Chưa cấu hình API để lấy thống kê sự kiện");
  }

  const urls = [
    `${base}/${eventId}/stats`,
    // Back-compat / alternative routing
    `${base}/events/${eventId}/stats`,
  ];

  try {
    for (const url of urls) {
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const payload: unknown = await response.json().catch(() => null);

      if (response.ok) {
        return unwrapStats(payload);
      }

      if (response.status === 404) {
        continue;
      }

      throw new Error(readMessage(payload) || "Không thể tải thống kê sự kiện");
    }

    throw new Error("Không tìm thấy API thống kê sự kiện (404)");
  } catch (error) {
    console.error("Error fetching event stats:", error);
    throw error;
  }
}

