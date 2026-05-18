import { API_ENDPOINTS } from "@/lib/api-config";
import { Info } from "@/features/user/services/get-my-info";

export type NewUserInfo = {
    fullName: string;
    dateOfBirth: string;
    gender: "MALE" | "FEMALE" | "OTHER";
};

type ApiResponse = {
    code: number;
    message: string;
    result: Info;
};

type PostMyInfoResult = {
    ok: boolean;
    message: string;
    result: Info | null;
};

export async function postMyInfo(newInfo: NewUserInfo): Promise<PostMyInfoResult> {
    const url = API_ENDPOINTS.user.profile;

    try {
        const res = await fetch(url, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                Accept: "*/*",
            },
            body: JSON.stringify(newInfo),
        });

        const data: ApiResponse = await res.json();

        if (!res.ok) {
            return {
                ok: false,
                message: data.message,
                result: null,
            };
        }

        return {
            ok: true,
            message: data.message,
            result: data.result ?? null,
        };
    } catch {
        return {
            ok: false,
            message: "Không thể kết nối tới server. Xin vui lòng thử lại sau.",
            result: null,
        };
    }
}
