import { API_ENDPOINTS } from "@/lib/api-config";

export async function logoutAccount(): Promise<{ ok: true } | { ok: false }> {
  const url = API_ENDPOINTS.auth.logout;

  try {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "*/*",
      },
    });

    if (!res.ok) {
      return { ok: false };
    }

    return { ok: true };
  } catch {
    return { ok: false };
  }
}
