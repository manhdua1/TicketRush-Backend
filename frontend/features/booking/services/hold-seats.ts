import { API_ENDPOINTS } from "@/lib/api-config";
import { Seat } from "../../events/types";

type HoldSeatsRequest = {
    seatIds: number[];
}

export type BookingResult = {
    id: number;
    status: "PENDING" | "CONFIRMED" | "EXPIRED" | "CANCELLED";
    totalAmount: number;
    expiresAt: string;
    seats: Seat[];
}

export type ApiRespone = {
    code: number | string;
    message: string;
    result: BookingResult;
}

export type HoldSeatsResult = {
    ok: boolean;
    message: string;
    data: ApiRespone | null;
    statusCode?: number;
}

export const holdSeats = async (request: HoldSeatsRequest): Promise<HoldSeatsResult> => {
    const url = API_ENDPOINTS.booking.base;

    try {
        const res = await fetch(url, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(request),
        });

    const data: ApiRespone = await res.json();

    if (res.ok) {
        return {
            ok: true,
            message: data.message,
            data,
            statusCode: res.status,
        };
    }

    return {
        ok: false,
        message: data.message || "Đặt chỗ thất bại. Vui lòng thử lại.",
        data: null,
        statusCode: res.status,
    };
    } catch {
        return {
            ok: false,
            message: "Không thể kết nối tới server. Vui lòng thử lại sau.",
            data: null,
            statusCode: 500,
        };
    }
}
