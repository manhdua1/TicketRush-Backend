import { API_ENDPOINTS } from "@/lib/api-config";

type CheckQueueResponse = {
  code: number;
  message: string;
  result?: boolean;
};

export type CheckQueueResult = {
  ok: boolean;
  message: string;
  required: boolean;
  statusCode?: number;
};

function isApiSuccess(code: number) {
  return code === 1000 || code === 200;
}

export async function checkQueue(eventId: number): Promise<CheckQueueResult> {
  const url = `${API_ENDPOINTS.queue.check}/${eventId}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result: CheckQueueResponse = await res.json();

    return {
      ok: res.ok && isApiSuccess(result.code),
      message: result.message,
      required: result.result === true,
      statusCode: res.status,
    };
  } catch {
    return {
      ok: false,
      message: "Khong the kiem tra hang cho. Vui long thu lai sau.",
      required: false,
      statusCode: 500,
    };
  }
}
