import { API_ENDPOINTS } from "@/lib/api-config";
import {ApiRespone, HoldSeatsResult as ConfirmBookingResult} from "./hold-seats";

export const confirmBooking = async (bookingId: number): Promise<ConfirmBookingResult> => {
    const url = `${API_ENDPOINTS.booking.base}/${bookingId}/confirm`;

    try {
        const res = await fetch(url, {
            method: "POST",
            credentials: "include",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        });
    
        const data: ApiRespone = await res.json();

        if (!res.ok) {
            return {
                ok: false,
                message: data?.message || "Xác nhận đặt vé thất bại.",
                data: null,
            };
        }

        return {
            ok: true,
            message: data.message,
            data: data,
        };
    } catch {
        return {
            ok: false,
            message: "Không thể kết nối tới server. Vui lòng thử lại sau.",
            data: null,
        };
    }
};