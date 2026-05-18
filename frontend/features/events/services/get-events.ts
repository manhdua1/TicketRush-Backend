import { API_ENDPOINTS } from "@/lib/api-config";
import type { Category, Event } from "../types";

export type GetEventsRequest = {
    name?: string;
    type?: Category;
    dstfrom?: string;
    dstto?: string;
    page?: number;
    size?: number;
};

type Result = {
    content: Event[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
};

export type GetEventsResponse = {
    code: number;
    message: string;
    result: Result;
};

export type GetEventsResult = {
    ok: boolean;
    message: string;
    data: GetEventsResponse | null;
};

export const getEvents = async (request: GetEventsRequest): Promise<GetEventsResult> => {
    const url = API_ENDPOINTS.events.list;

    const queryParams = new URLSearchParams();

    const normalizedName = request.name?.trim();
    if (normalizedName) queryParams.set("name", normalizedName);

    if (request.type) queryParams.set("type", request.type);

    const dstfrom = request.dstfrom?.trim();
    if (dstfrom) queryParams.set("dstfrom", dstfrom);

    const dstto = request.dstto?.trim();
    if (dstto) queryParams.set("dstto", dstto);

    const page = request.page ?? 1;
    const size = request.size ?? 10;

    queryParams.set("page", Math.max(1, page).toString());
    queryParams.set("size", Math.max(1, size).toString());

    const endpoint = `${url}?${queryParams.toString()}`;

    try {
        const res = await fetch(endpoint, {
            method: "GET",
            cache: "no-store",
            headers: {
                Accept: "application/json",
            },
        });

        const data: GetEventsResponse = await res.json();

        if (!res.ok) {
            return {
                ok: false,
                message: data?.message || "Không thể tải danh sách sự kiện.",
                data: null,
            };
        }

        return {
            ok: true,
            message: data.message,
            data,
        };
    } catch {
        return {
            ok: false,
            message: "Không thể kết nối tới server. Vui lòng thử lại sau.",
            data: null,
        };
    }
};
