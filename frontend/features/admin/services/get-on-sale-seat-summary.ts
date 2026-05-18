import { API_ENDPOINTS } from "@/lib/api-config";

export type OnSaleSeatSummaryResponse = {
    code: number;
    message: string;
    results: {
        soldSeats: number;
        totalSeats: number;
        soldRate: number;
    };
}

function readMessage(payload: unknown) {
    if (!payload || typeof payload !== "object") return null;
    if (!("message" in payload)) return null;
    const msg = (payload as { message?: unknown }).message;
    return typeof msg === "string" ? msg : null;
}

export async function getOnSaleSeatSummary(): Promise<OnSaleSeatSummaryResponse> {
    const url = API_ENDPOINTS.admin.onSaleSeatSummary;

    if (!url) {
        throw new Error("Chưa cấu hình API cho thống kê ghế đang bán");
    }

    try {
        const res = await fetch(url, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const payload: unknown = await res.json();

        if (!res.ok) {
            throw new Error(readMessage(payload) || "Không thể tải thống kê ghế đang bán");
        }

        // Some backends may respond with `result` instead of `results`.
        if (payload && typeof payload === "object") {
            const record = payload as Record<string, unknown>;
            if (!("results" in record) && "result" in record) {
                record.results = record.result;
            }
            return record as unknown as OnSaleSeatSummaryResponse;
        }

        throw new Error("Dữ liệu thống kê ghế đang bán không hợp lệ");
    } catch (error) {
        console.error('Error fetching on-sale seat summary:', error);
        throw error;
    }
}
