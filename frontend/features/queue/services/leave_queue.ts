import { API_ENDPOINTS } from "@/lib/api-config";

type LeaveQueueApiResponse = {
  code: number;
  message: string;
};

type LeaveQueueResponse = {
  ok: boolean;
  code: number;
  message: string;
  statusCode?: number;
};

function isApiSuccess(code: number) {
  return code === 1000 || code === 200;
}

export async function leaveQueue(eventId: number): Promise<LeaveQueueResponse> {
  const url = `${API_ENDPOINTS.queue.leave}/${eventId}`;

  try {
    const res = await fetch(url, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result: LeaveQueueApiResponse = await res.json();

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
      message: "Khong the roi hang cho. Vui long thu lai sau.",
      statusCode: 500,
    };
  }
}
