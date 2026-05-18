import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { API_ENDPOINTS } from "@/lib/api-config";
import AdminShell from "@/features/admin/components/admin-shell";

type MeResponse = {
  code: number;
  message: string;
  result: {
    email: string;
    role: "CUSTOMER" | "ADMIN" | string;
    avatarUrl: string | null;
  };
};

async function getServerMe() {
  const url = API_ENDPOINTS.auth.me;
  if (!url) return null;

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  if (!cookieHeader) return null;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "*/*",
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data: MeResponse = await res.json();
    const me = data.result ?? null;
    if (!me) return null;

    const roleUpper =
      typeof me.role === "string" ? me.role.toUpperCase() : "CUSTOMER";
    const roleNormalized =
      roleUpper === "ADMIN" || roleUpper === "ROLE_ADMIN" ? "ADMIN" : "CUSTOMER";
    return {
      ...me,
      role: roleNormalized,
    };
  } catch {
    return null;
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await getServerMe();

  if (!me) {
    redirect("/login");
  }

  if (me.role !== "ADMIN") {
    redirect("/");
  }

  return <AdminShell>{children}</AdminShell>;
}
