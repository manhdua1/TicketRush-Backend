import { API_ENDPOINTS } from "@/lib/api-config";

type ApiResponse = {
    code: boolean;
    message: string;
    data: null;
}

export type CancelBookingResult = {
    ok: boolean;
    message: string;
    data: ApiResponse | null;
};

export async function cancelBooking(bookingId: number): Promise<CancelBookingResult> {
    const url = `${API_ENDPOINTS.booking.base}/${bookingId}`;

    try {
        const res = await fetch(url, {
            method: "DELETE",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const result: ApiResponse = await res.json();

        if (!res.ok) {
            return {
                ok: false,
                message: result.message || "Hủy booking không thành công",
                data: result,
            };
        }

        return {
            ok: result.code,
            message: result.message,
            data: result,
        };
    } catch {
        return {
            ok: false,
            message: "Có lỗi xảy ra khi hủy booking",
            data: null,
        };
    }
}