import { API_ENDPOINTS } from "@/lib/api-config";

type ChangePasswordRequest = {
    currentPassword: string;
    newPassword: string;
}

type ApiResponse = {
    code: number;
    message: string;
    result: unknown;
}

type ChangePasswordResult = {
    ok: boolean;
    code: number | null;
    message: string;
}

export async function changePassword(request: ChangePasswordRequest): Promise<ChangePasswordResult> {
    const url = API_ENDPOINTS.auth.changePassword;

    try {
        const res = await fetch(url, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
                Accept: "*/*",
            },
            body: JSON.stringify(request),
        });
        
        const data: ApiResponse = await res.json();

        if (!res.ok) {
            return {
                ok: false,
                code: null,
                message: data.message || "Không thể đổi mật khẩu",
            };
        }

        return {
            ok: true,
            code: data.code,
            message: data.message,
        };
    } catch {
        return {
            ok: false,
            code: null,
            message: "Không thể kết nối tới server. Vui lòng thử lại sau.",
        };
    }
}