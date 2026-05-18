import { API_ENDPOINTS } from "@/lib/api-config";

type HeartBeatResponse = {
  code: number;
  message: string;
};

export type HeartBeatResult = {
  ok: boolean;
  code: number;
  message: string;
  statusCode?: number;
};

function isApiSuccess(code: number) {
  return code === 1000 || code === 200;
}

export async function sendHeartBeat(eventId: number): Promise<HeartBeatResult> {
  const url = `${API_ENDPOINTS.queue.heartbeat}/${eventId}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result: HeartBeatResponse = await res.json();

    return {
      ok: res.ok && isApiSuccess(result.code),
      code: result.code,
      message: result.message,
      statusCode: res.status,
    };
  } catch {
    return {
      ok: false,
      code: 500,
      message: "Khong the gui heartbeat hang cho.",
      statusCode: 500,
    };
  }
}
