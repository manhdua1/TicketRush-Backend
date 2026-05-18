import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_ENDPOINTS } from "@/lib/api-config";

async function isAuthenticated() {
  const url = API_ENDPOINTS.auth.me;

  if (!url) {
    return false;
  }

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  if (!cookieHeader) {
    return false;
  }

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "*/*",
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });

    return res.ok;
  } catch {
    return false;
  }
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }

  return children;
}
