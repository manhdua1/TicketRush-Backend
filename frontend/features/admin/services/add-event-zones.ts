import { API_ENDPOINTS } from "@/lib/api-config";
import { Zone } from "@/features/events/types";

export type AddEventZoneRequest = {
  name: string;
  price: number;
  totalRows: number;
  totalCols: number;
  colorHex: string;
};

function readMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  if (!("message" in payload)) return null;
  const msg = (payload as { message?: unknown }).message;
  return typeof msg === "string" ? msg : null;
}

function unwrapZone(payload: unknown): Zone {
  if (!payload || typeof payload !== "object") {
    throw new Error("Dữ liệu khu ghế không hợp lệ");
  }

  const record = payload as Record<string, unknown>;
  const result = (record.result ?? record.results ?? record.data ?? null) as unknown;
  if (result && typeof result === "object") return result as Zone;
  return record as unknown as Zone;
}

export async function addEventZone(
  eventId: string,
  zone: AddEventZoneRequest,
): Promise<Zone> {
  const url = `${API_ENDPOINTS.admin.events}/${eventId}/zones`;

  if (!url) {
    throw new Error("Chưa cấu hình API để thêm khu ghế");
  }

  const response = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(zone),
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(readMessage(payload) || "Không thể thêm khu ghế");
  }

  return unwrapZone(payload);
}

// Back-compat name used elsewhere.
export async function addEventZones(
  eventId: string,
  zone: AddEventZoneRequest,
): Promise<Zone> {
  return addEventZone(eventId, zone);
}

