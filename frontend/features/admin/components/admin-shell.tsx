"use client";

import AdminSidebar from "@/features/admin/components/admin-sidebar";
import { useMe } from "@/features/auth/hooks/use-me";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  // Warm the cache + keep auth fresh on the dashboard shell.
  useMe();

  return (
    <div className="min-h-dvh bg-background text-foreground font-[var(--font-body)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1600px] gap-6 px-6 py-6">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
