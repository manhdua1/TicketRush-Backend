"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Globe2,
  LayoutGrid,
  LogOut,
  Music,
  Search,
  Shield,
  Theater,
  Ticket,
  Trophy,
  User,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";

import Logo from "@/components/shared/logo";
import Avatar from "@/components/user/avatar";
import { CATEGORY_LABELS, type Category } from "@/features/events/types";
import { useMe } from "@/features/auth/hooks/use-me";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { getEvents } from "@/features/events/services/get-events";
import type { Event } from "@/features/events/types";

type NavBarProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchAriaLabel?: string;
};

const EVENT_SUGGESTION_LIMIT = 5;

/** Map each category to a small Lucide icon */
const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
  LIVE_MUSIC: <Music className="h-4 w-4 text-primary" />,
  PERFORMING_ARTS: <Theater className="h-4 w-4 text-violet-400" />,
  SPORTS: <Trophy className="h-4 w-4 text-amber-400" />,
  SEMINARS_AND_WORKSHOPS: <GraduationCap className="h-4 w-4 text-cyan-400" />,
  TOURS_AND_EXPERIENCES: <Globe2 className="h-4 w-4 text-emerald-400" />,
  OTHER: <LayoutGrid className="h-4 w-4 text-slate-400" />,
};

function buildEventsHref(searchText: string, category?: Category): string {
  const params = new URLSearchParams();
  const normalizedSearch = searchText.trim();

  if (normalizedSearch) params.set("name", normalizedSearch);
  if (category) params.set("type", category);

  const query = params.toString();
  return query ? `/events?${query}` : "/events";
}

/** Return the best-guess icon for an event based on its type field */
function getEventIcon(event: Event): React.ReactNode {
  const type = event.type as Category;
  return CATEGORY_ICONS[type] ?? <Ticket className="h-4 w-4 text-primary" />;
}

export default function NavBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Tìm kiếm sự kiện",
  searchAriaLabel = "Tìm kiếm",
}: NavBarProps) {
  const { data: me, isLoading } = useMe();
  const { logout } = useLogout();
  const router = useRouter();
  const categories = useMemo(
    () => Object.entries(CATEGORY_LABELS) as Array<[Category, string]>,
    [],
  );

  const [localSearch, setLocalSearch] = useState(searchValue ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchText = searchValue ?? localSearch;
  const normalizedSearch = searchText.trim();

  const avatarSrc = me?.avatarUrl || "/default-avatar.svg";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(normalizedSearch);
    }, 400);

    return () => window.clearTimeout(timer);
  }, [normalizedSearch]);

  const suggestionsQuery = useQuery({
    queryKey: ["navbar-event-suggestions", debouncedSearch],
    enabled: debouncedSearch.length > 0,
    queryFn: async () => {
      const result = await getEvents({
        name: debouncedSearch,
        page: 1,
        size: EVENT_SUGGESTION_LIMIT,
      });

      if (!result.ok || !result.data) {
        throw new Error(result.message);
      }

      return result.data.result.content.slice(0, EVENT_SUGGESTION_LIMIT);
    },
  });

  const suggestions = suggestionsQuery.data ?? [];
  const showSuggestions =
    isSearchFocused && normalizedSearch.length > 0 && suggestions.length > 0;

  const handleSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
      return;
    }
    setLocalSearch(value);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;

    event.preventDefault();
    setIsSearchFocused(false);
    router.push(buildEventsHref(searchText));
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-surface/55 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo className="shrink-0 text-xl font-extrabold tracking-tight sm:text-2xl" />

        {/* Category dropdown */}
        <details className="group relative shrink-0">
          <summary className="group flex h-11 cursor-pointer list-none items-center gap-2 rounded-full px-3 text-sm font-medium text-foreground/80 transition hover:bg-surface-2/70 hover:text-foreground">
            Thể loại
            <ChevronDown className="h-4 w-4 text-foreground/70 transition group-open:rotate-180" />
          </summary>
          <div className="absolute left-0 mt-2 w-[min(92vw,44rem)] overflow-hidden rounded-2xl border border-border bg-surface/90 p-2 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:w-[min(92vw,36rem)] lg:w-2xl">
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map(([key, label]) => (
                <Link
                  key={key}
                  href={buildEventsHref(searchText, key)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-foreground/80 transition hover:bg-surface-2/70 hover:text-foreground"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-border bg-surface/60">
                    {CATEGORY_ICONS[key]}
                  </span>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </details>

        {/* Search */}
        <div className="flex min-w-0 flex-1 justify-center">
          <div className="group relative w-full max-w-2xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
            <input
              aria-label={searchAriaLabel}
              placeholder={searchPlaceholder}
              value={searchText}
              onChange={(event) => handleSearchChange(event.currentTarget.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => {
                window.setTimeout(() => setIsSearchFocused(false), 120);
              }}
              className="h-11 w-full rounded-full border border-border bg-surface/60 pl-11 pr-4 text-sm text-foreground/90 outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15"
            />

            {showSuggestions ? (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-3xl border border-border bg-surface/90 shadow-[0_16px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                <div className="px-4 pt-4 text-xs font-bold uppercase tracking-[0.2em] text-muted">
                  Gợi ý sự kiện
                </div>
                <div className="py-2">
                  {suggestions.map((event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="flex items-start gap-3 px-4 py-3 text-left transition hover:bg-surface-2/70"
                    >
                      {/* Category icon instead of initials */}
                      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-border bg-surface/60">
                        {getEventIcon(event)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">
                          {event.title}
                        </span>
                        <span className="mt-1 block truncate text-xs text-muted">
                          {event.venue}
                        </span>
                      </span>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-foreground/45" />
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Auth area */}
        <div className="flex shrink-0 items-center gap-2">
          {isLoading ? (
            <div
              className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-foreground/80"
              aria-label="Đang tải thông tin tài khoản"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full border border-border bg-surface/60">
                <UserRound className="h-4 w-4 text-foreground/70" />
              </span>
              <span aria-hidden className="skeleton h-4 w-28 rounded-full" />
            </div>
          ) : me ? (
            <details className="relative">
              <summary className="group flex h-11 cursor-pointer list-none items-center gap-2 rounded-full px-3 text-sm font-semibold text-foreground/85 transition hover:bg-surface-2/70 hover:text-foreground">
                <span className="grid h-8 w-8 place-items-center overflow-hidden rounded-full border border-border bg-surface/60">
                  <Avatar
                    src={avatarSrc}
                    alt="Ảnh đại diện"
                    className="h-full w-full object-cover"
                  />
                </span>
                <span className="max-w-40 truncate sm:max-w-56">{me.email}</span>
                <ChevronDown className="h-4 w-4 text-foreground/70 transition group-open:rotate-180" />
              </summary>

              <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-border bg-surface/85 p-1 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                {me.role === "ADMIN" ? (
                  <Link
                    href="/admin/overview"
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground/80 transition hover:bg-surface-2/70 hover:text-foreground"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/60">
                      <Shield className="h-4 w-4 text-foreground/75" />
                    </span>
                    Admin Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground/80 transition hover:bg-surface-2/70 hover:text-foreground"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/60">
                        <User className="h-4 w-4 text-foreground/75" />
                      </span>
                      Thông tin cá nhân
                    </Link>

                    <a
                      href="/profile/tickets"
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground/80 transition hover:bg-surface-2/70 hover:text-foreground"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/60">
                        <Ticket className="h-4 w-4 text-foreground/75" />
                      </span>
                      Vé của tôi
                    </a>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-400 transition hover:bg-surface-2/70 hover:text-red-300"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/60">
                    <LogOut className="h-4 w-4" />
                  </span>
                  Đăng xuất
                </button>
              </div>
            </details>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-foreground/80 transition hover:bg-surface-2/70 hover:text-foreground"
            >
              <span className="grid h-8 w-8 place-items-center rounded-full border border-border bg-surface/60">
                <UserRound className="h-4 w-4 text-foreground/70" />
              </span>
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
