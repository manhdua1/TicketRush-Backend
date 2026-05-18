"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Home,
  LayoutGrid,
  LogOut,
  PlusCircle,
  Sparkles,
} from "lucide-react";

import Logo from "@/components/shared/logo";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { useMe } from "@/features/auth/hooks/use-me";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/create-event", label: "Tạo sự kiện", icon: <PlusCircle className="h-5 w-5" /> },
  { href: "/admin/overview", label: "Tổng quan", icon: <LayoutGrid className="h-5 w-5" /> },
  { href: "/admin/events", label: "Sự kiện", icon: <CalendarDays className="h-5 w-5" /> },
  { href: "/admin/spotlight", label: "Spotlight", icon: <Sparkles className="h-5 w-5" /> },
  { href: "/", label: "Góc nhìn User", icon: <Home className="h-5 w-5" /> },
];

function isActivePath(current: string, href: string) {
  if (href === "/") return current === "/";
  if (current === href) return true;
  if (href === "/admin/overview") return current === "/admin" || current.startsWith("/admin/overview");
  return current.startsWith(href);
}

export default function AdminSidebar() {
  const pathname = usePathname() ?? "/";
  const { logout } = useLogout();
  const { data: me } = useMe();

  const email = me?.email || "admin@ticketrush.com";
  const avatarUrl = "/default-avatar.svg";
  const name = email.split("@")[0] || "Admin";

  return (
    <aside className="w-[280px] shrink-0">
      <div className="sticky top-6 h-[calc(100dvh-48px)]">
        <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/5 px-4 py-5 backdrop-blur-xl">
          <div className="flex items-center gap-3 px-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/20 shadow-[0_0_18px_rgba(124,58,237,0.45)]">
              <div className="h-4 w-4 rotate-12 rounded-sm bg-primary" />
            </div>
            <div className="min-w-0">
              <Logo href="/admin/overview" className="truncate text-lg" />
              <div className="truncate text-xs text-white/55">
                Quản lý sự kiện
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[#0E0E15] bg-primary shadow-[0_0_14px_rgba(124,58,237,0.7)]" />
              </div>
              <div className="min-w-0">
                <div className="truncate font-[var(--font-display)] text-sm font-semibold">
                  {name}
                </div>
                <div className="truncate text-xs text-white/55">
                  {email}
                </div>
              </div>
            </div>
          </div>

          <nav className="mt-6 flex flex-col gap-2 px-1">
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "group relative flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition",
                    "hover:bg-white/5 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
                    active
                      ? "bg-linear-to-r from-primary/25 to-primary/5 text-foreground shadow-[0_0_28px_rgba(124,58,237,0.22)]"
                      : "text-white/70",
                  ].join(" ")}
                >
                  {active ? (
                    <span
                      className="absolute left-0 top-1/2 h-8 w-[3px] -translate-y-1/2 rounded-full bg-primary shadow-[0_0_18px_rgba(124,58,237,0.65)]"
                    />
                  ) : null}
                  <span
                    className={[
                      "grid h-9 w-9 place-items-center rounded-xl transition",
                      active ? "bg-primary/20 text-primary" : "bg-white/5 text-white/65 group-hover:text-white/80",
                    ].join(" ")}
                  >
                    {item.icon}
                  </span>
                  <span
                    className={[
                      "font-[var(--font-display)]",
                      active ? "font-semibold" : "",
                    ].join(" ")}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto px-1 pt-5">
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-3 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/15 hover:text-red-100"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
