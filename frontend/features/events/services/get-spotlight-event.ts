import { API_ENDPOINTS } from "@/lib/api-config";
import { Event } from "../types";

export type GetSpotlightEventResponse = {
    code: number;
    message: string;
    result: Event;
};

export async function getSpotlightEvent(): Promise<GetSpotlightEventResponse> {
    const url = API_ENDPOINTS.events.spotlight;

    try {
        const res = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const data: GetSpotlightEventResponse = await res.json();

        if (!res.ok) {
            return {
                code: data.code || res.status,
                message: data.message || "Đã xảy ra lỗi khi lấy sự kiện spotlight.",
                result: data.result || {} as Event,
            };
        }

        return {
            code: data.code,
            message: data.message,
            result: data.result,
        };

    } catch {
        return {
            code: 500,
            message: "Không thể kết nối tới server. Xin vui lòng thử lại sau.",
            result: {} as Event,
        };
    }
}
