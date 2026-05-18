import { API_ENDPOINTS } from "@/lib/api-config";

export type SendOtpRequest = {
    email: string;
    otp: string;
    newPassword: string;
};

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

export async function changePassword(request: SendOtpRequest): Promise<ChangePasswordResult> {
    const url = API_ENDPOINTS.auth.resetPassword;

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "*/*",
            },
            body: JSON.stringify(request),
        });
        let data: ApiResponse | null = null;
        try {
            data = (await res.json()) as ApiResponse;
        } catch {
            data = null;
        }

        if (res.ok) {
            return {
                ok: true,
                code: data?.code ?? res.status,
                message: data?.message || "Đổi mật khẩu thành công",
            };
        }

        return {
            ok: false,
            code: data?.code ?? res.status,
            message: data?.message || "Đổi mật khẩu thất bại",
        };

    } catch {
        return {
            ok: false,
            code: null,
            message: "Không thể kết nối tới server. Xin vui lòng thử lại sau.",
        };
    }
}