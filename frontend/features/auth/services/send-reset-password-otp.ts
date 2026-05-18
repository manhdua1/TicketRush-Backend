import { API_ENDPOINTS } from "@/lib/api-config";
import { SendOtpRequest } from "./send-register-otp";

type ApiResponse = {
    code: number;
    message: string;
    result: unknown;
}

export type SendResetPasswordOtpResult = {
    ok: boolean;
    code: number | null;
    message: string;
}

export async function sendResetPasswordOtp(request: SendOtpRequest): Promise<SendResetPasswordOtpResult> {
    const url = API_ENDPOINTS.auth.sendResetPasswordOtp;

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
                message: data?.message || "Đã gửi OTP",
            };
        }

        return {
            ok: false,
            code: data?.code ?? res.status,
            message: data?.message || "Gửi OTP thất bại",
        };


    } catch {
        return {
            ok: false,
            code: null,
            message: "Đã xảy ra lỗi. Xin vui lòng thử lại sau.",
        };
    }
}

