"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { KeyRound, Ticket, User } from "lucide-react";

const navItems = [
  {
    label: "Thông tin cá nhân",
    href: "/profile",
    icon: User,
    match: (pathname: string) => pathname === "/profile",
  },
  {
    label: "Vé của tôi",
    href: "/profile/tickets",
    icon: Ticket,
    match: (pathname: string) => pathname.startsWith("/profile/tickets"),
  },
  {
    label: "Đổi mật khẩu",
    href: "/profile/change-password",
    icon: KeyRound,
    match: (pathname: string) => pathname.startsWith("/profile/change-password"),
  },
] as const;

export default function ProfileSidebar() {
  const pathname = usePathname();

  return (
    <aside className="lg:sticky lg:top-24 lg:h-[calc(100dvh-6rem)] lg:w-72">
      <div className="h-full rounded-[36px] border border-border bg-surface/55 p-3 backdrop-blur-xl">
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.match(pathname);
            const className = active
              ? "relative flex items-center gap-3 rounded-2xl border border-primary/25 bg-linear-to-r from-primary/20 to-secondary/10 px-4 py-3 text-sm font-semibold text-foreground"
              : "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-foreground/75 transition hover:bg-surface-2/70 hover:text-foreground";

            return (
              <motion.div
                key={item.label}
                whileHover={active ? undefined : { scale: 1.01 }}
                whileTap={active ? undefined : { scale: 0.99 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
              >
                <Link href={item.href} className={className}>
                  {active ? (
                    <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-linear-to-b from-primary to-secondary" />
                  ) : null}
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/60">
                    <Icon className="h-4 w-4 text-foreground/75" />
                  </span>
                  <span className="min-w-0 truncate">{item.label}</span>
                </Link>
              </motion.div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
