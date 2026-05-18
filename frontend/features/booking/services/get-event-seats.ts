import { API_ENDPOINTS } from "@/lib/api-config";
import type { Seat } from "../../events/types";

export type GetEventSeatsResponse = {
    code: number;
    message: string;
    result: Seat[];
};

export type GetEventSeatsResult = {
    ok: boolean;
    message: string;
    data: Seat[];
};

export const getEventSeats = async (eventId: number): Promise<GetEventSeatsResult> => {
    const url = `${API_ENDPOINTS.events.list}/${eventId}/seats`;

    try {
        const res = await fetch(url, {
            method: "GET",
            cache: "no-store",
            headers: {
                Accept: "application/json",
            },
        });

        const payload: GetEventSeatsResponse = await res.json();

        if (!res.ok) {
            return {
                ok: false,
                message: payload?.message || "Không thể tải danh sách ghế.",
                data: [],
            };
        }

        return {
            ok: true,
            message: payload.message,
            data: payload.result,
        };
    } catch {
        return {
            ok: false,
            message: "Không thể kết nối tới server. Vui lòng thử lại sau.",
            data: [],
        };
    }
};


