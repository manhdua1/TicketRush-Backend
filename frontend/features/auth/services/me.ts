import { API_ENDPOINTS } from "@/lib/api-config";

export type Me = {
    email: string;
    role: "CUSTOMER" | "ADMIN";
    avatarUrl: string | null;
};

type ApiResponse = {
  code: number;
  message: string;
    result: Me;
};

export type GetMeResult = {
    ok: boolean;
    message: string;
    result: Me | null;
};

export async function getMe(): Promise<GetMeResult> {
    const url = API_ENDPOINTS.auth.me;

  try {
    const res = await fetch(url, {
            method: "GET",
            credentials: "include",
            headers: {
                Accept: "*/*",
            },
    });

    if (!res.ok) {
            return {
                ok: false,
                message: "Không thể lấy thông tin người dùng",
                result: null,
            };
    }
    const data: ApiResponse = await res.json();

    const roleRaw = (data?.result as unknown as { role?: unknown })?.role;
    const roleUpper =
      typeof roleRaw === "string" ? roleRaw.toUpperCase() : "CUSTOMER";
    const roleNormalized =
      roleUpper === "ADMIN" || roleUpper === "ROLE_ADMIN" ? "ADMIN" : "CUSTOMER";

    return {
      ok: true,
      message: data.message,
      result: {
        ...data.result,
        role: roleNormalized,
      },
    };
  } catch {
    return {
            ok: false,
            message: "Không thể kết nối tới server. Xin vui lòng thử lại sau.",
            result: null,
    };
  }
}
