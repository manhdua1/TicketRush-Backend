import { API_ENDPOINTS } from "@/lib/api-config";

export type QueueStatusResult = {
  status: "WAITING" | "GRANTED" | "EXPIRED";
  position: number;
  totalInQueue: number;
  estimatedWaitSeconds: number;
};

type QueueStatusResponse = {
  code: number;
  message: string;
  result?: QueueStatusResult;
};

export type GetQueueStatusResult = {
  ok: boolean;
  message: string;
  status: QueueStatusResult | null;
  statusCode?: number;
};

function isApiSuccess(code: number) {
  return code === 1000 || code === 200;
}

export async function getQueueStatus(eventId: number): Promise<GetQueueStatusResult> {
  const url = `${API_ENDPOINTS.queue.status}/${eventId}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result: QueueStatusResponse = await res.json();

    return {
      ok: res.ok && isApiSuccess(result.code),
      message: result.message,
      status: result.result ?? null,
      statusCode: res.status,
    };
  } catch {
    return {
      ok: false,
      message: "Khong the lay trang thai hang cho. Vui long thu lai sau.",
      status: null,
      statusCode: 500,
    };
  }
}
