import { API_ENDPOINTS } from "@/lib/api-config";

export type TicketInfo = {
    id: number;
    qrCode: string;
    status: "ACTIVE" | "USED" | "CANCELLED";
    eventTitle: string;
    venue: string;
    startTime: string;
    endTime: string;
    zoneName: string;
    seatLabel: string;
    price: number;
    issuedAt: string;
};

type ApiResponse = {
    code: number;
    message: string;
    result: TicketInfo[] | null;
};

export type GetMyTicketResult = {
    ok: boolean;
    message: string;
    data: ApiResponse | null;
};

export async function getMyTicket(): Promise<GetMyTicketResult> {
    const url = API_ENDPOINTS.user.tickets;

    try {
        const res = await fetch(url, {
            method: "GET",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                Accept: "*/*",
            },
        });

        if (!res.ok) {
            return {
                ok: false,
                message: "Đã xảy ra lỗi khi lấy thông tin vé.",
                data: null,
            };
        }

        const data: ApiResponse = await res.json();
        return {
            ok: true,
            message: "Lấy thông tin vé thành công.",
            data,
        };
    } catch {
        return {
            ok: false,
            message: "Đã xảy ra lỗi khi lấy thông tin vé.",
            data: null,
        };
    }
}

