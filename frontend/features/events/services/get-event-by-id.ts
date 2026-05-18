import { API_ENDPOINTS } from "@/lib/api-config";
import type { Event } from "../types";

export type GetEventByIdResponse = {
	code: number;
	message: string;
	result: Event;
};

export type GetEventByIdResult = {
	ok: boolean;
	message: string;
	data: GetEventByIdResponse | null;
};

export const getEventById = async (id: number): Promise<GetEventByIdResult> => {
	const url = API_ENDPOINTS.events.detail(id);

	try {
		const res = await fetch(url, {
			method: "GET",
			credentials: "include",
			cache: "no-store",
			headers: {
				Accept: "application/json",
			},
		});

		const data: GetEventByIdResponse = await res.json();

		if (!res.ok) {
			return {
				ok: false,
				message: data?.message || "Không thể tải thông tin sự kiện.",
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
