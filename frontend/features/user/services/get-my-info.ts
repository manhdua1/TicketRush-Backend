import { API_ENDPOINTS } from "@/lib/api-config";

export type Info = {
  id: number;
  email: string;
  fullName: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  role: "CUSTOMER" | "ADMIN";
  avatarUrl: string | null;
  createdAt: string;
};

type ApiResponse = {
  code: number;
  message: string;
  result: Info;
};

export type GetMyInfoResult = {
  ok: boolean;
  message: string;
  data: ApiResponse | null;
};

export async function getMyInfo(): Promise<GetMyInfoResult> {
  const url = API_ENDPOINTS.user.profile;

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
        message: "Không thể lấy thông tin người dùng",
        data: null,
      };
    }

    const data: ApiResponse = await res.json();

    return {
      ok: true,
      message: data.message,
      data: data,
    };
  } catch {
    return {
      ok: false,
      message: "Không thể kết nối tới server. Vui lòng thử lại sau.",
      data: null,
    };
  }
}
