import { API_ENDPOINTS } from "@/lib/api-config";

export type QueueDescription = {
  position: number;
  totalInQueue: number;
  message: string;
};

type ApiResponse = {
  code: number;
  message: string;
  result: QueueDescription | null;
};

type JoinQueueResult = {
  ok: boolean;
  message: string;
  status: QueueDescription | null;
  statusCode?: number;
};

function isApiSuccess(code: number) {
  return code === 1000 || code === 200;
}

export async function joinQueue(eventId: number): Promise<JoinQueueResult> {
  const url = `${API_ENDPOINTS.queue.join}/${eventId}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result: ApiResponse = await res.json();

    return {
      ok: res.ok && isApiSuccess(result.code),
      message: result.message || "Khong the vao hang cho.",
      status: result.result,
      statusCode: res.status,
    };
  } catch {
    return {
      ok: false,
      message: "Khong the vao hang cho. Vui long thu lai sau.",
      status: null,
      statusCode: 500,
    };
  }
}
