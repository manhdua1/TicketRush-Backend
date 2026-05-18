import { API_ENDPOINTS } from "@/lib/api-config";

export type SendOtpRequest = {
  email: string;
};

type ApiResponse = {
  code: number;
  message: string;
  result: unknown;
};

export type SendRegisterOtpResult = {
  ok: boolean;
  code: number | null;
  message: string;
};

export async function sendRegisterOtp(
  request: SendOtpRequest,
): Promise<SendRegisterOtpResult> {
  const url = API_ENDPOINTS.auth.sendRegisterOtp;

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
      message: "Lỗi kết nối server",
    };
  }
}
