import { API_ENDPOINTS } from "@/lib/api-config";
import { Info } from "@/features/user/services/get-my-info";

type ApiResponse = {
	code: number;
	message: string;
	result: Info;
};

export type PostMyAvatarResult = {
	ok: boolean;
	message: string;
	result: Info | null;
};

export async function postMyAvatar(file: File): Promise<PostMyAvatarResult> {
	const url = API_ENDPOINTS.user.avatar;

	const formData = new FormData();
	formData.append("file", file);

	try {
		const res = await fetch(url, {
			method: "POST",
			credentials: "include",
			headers: {
				Accept: "*/*",
			},
			body: formData,
		});

		let data: ApiResponse | null = null;
		try {
			data = (await res.json()) as ApiResponse;
		} catch {
			data = null;
		}

		if (!res.ok) {
			return {
				ok: false,
				message: "Đã xảy ra lỗi khi cập nhật ảnh đại diện.",
				result: null,
			};
		}

		return {
			ok: true,
			message: "Cập nhật ảnh đại diện thành công.",
			result: data?.result ?? null,
		};
	} catch {
		return {
			ok: false,
			message: "Không thể kết nối tới server. Xin vui lòng thử lại sau.",
			result: null,
		};
	}
}
