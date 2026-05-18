"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { motion } from "framer-motion";
import { Calendar, Clock, Filter, MapPin, Ticket } from "lucide-react";
import Image from "next/image";
import QRCode from "react-qr-code";

import ProfileSidebar from "@/features/user/components/profile-sidebar";
import {
  useMyTickets,
  type TicketCategoryFilter,
  type TicketSortKey,
} from "@/features/user/hooks/use-my-ticket";

function isEndedFromTimes(startTime: string, endTime: string, now: Date): boolean {
  const end = new Date(endTime);
  if (!Number.isNaN(end.getTime())) return end.getTime() < now.getTime();

  const start = new Date(startTime);
  if (!Number.isNaN(start.getTime())) return start.getTime() < now.getTime();

  return false;
}

function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)} đ`;
}

function formatDateTime(value: string): string {
  if (!value || value.trim() === "") return "Không xác định";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Không xác định";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function StatusPill({
  label,
  value,
  current,
  onChange,
}: {
  label: string;
  value: TicketCategoryFilter;
  current: TicketCategoryFilter;
  onChange: (next: TicketCategoryFilter) => void;
}) {
  const active = value === current;
  const className = active
    ? "inline-flex h-11 min-w-40 items-center justify-center rounded-full bg-linear-to-r from-primary to-secondary px-6 text-sm font-semibold text-foreground shadow-[0_10px_40px_rgba(0,0,0,0.35)]"
    : "inline-flex h-11 min-w-40 items-center justify-center rounded-full border border-border bg-surface/45 px-6 text-sm font-semibold text-foreground/80 transition hover:bg-surface/65 hover:text-foreground";

  return (
    <button type="button" onClick={() => onChange(value)} className={className}>
      {label}
    </button>
  );
}

function TicketCard({
  title,
  venue,
  startTime,
  endTime,
  zoneName,
  seatLabel,
  status,
  price,
  issuedAt,
  isEnded,
  qrCode,
}: {
  title: string;
  venue: string;
  startTime: string;
  endTime: string;
  zoneName: string;
  seatLabel: string;
  status: string;
  price: number;
  issuedAt: string;
  isEnded: boolean;
  qrCode?: string;
}) {
  const statusLabel = useMemo(() => {
    const normalized = status.trim().toUpperCase();
    if (["CANCELLED", "CANCELED", "FAILED"].includes(normalized)) return "Đã hủy";
    return isEnded ? "Đã kết thúc" : "Sắp diễn ra";
  }, [isEnded, status]);

  const statusClassName = useMemo(() => {
    const normalized = status.trim().toUpperCase();
    if (["CANCELLED", "CANCELED", "FAILED"].includes(normalized)) {
      return "text-red-400";
    }
    return isEnded ? "text-muted" : "text-green-400";
  }, [isEnded, status]);

  return (
    <article className="flex overflow-hidden rounded-4xl border border-border bg-surface/45 shadow-[0_18px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <div className="relative hidden w-60 shrink-0 border-r border-dashed border-border/40 bg-surface-2/65 p-5 md:flex md:items-center md:justify-center">
        {qrCode && (
          <div className="w-full max-w-[160px] rounded-2xl bg-white p-3 shadow-sm">
            <QRCode
              value={qrCode}
              size={256}
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              viewBox={`0 0 256 256`}
            />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="line-clamp-2 text-base font-extrabold tracking-tight sm:text-lg">
            {title}
          </h2>

          <div className="mt-3 space-y-2 text-sm text-foreground/75">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary/85" />
              <span className="line-clamp-2">{venue}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary/85" />
              <span>
                {formatDateTime(startTime)} – {formatDateTime(endTime)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-primary/85" />
              <span>
                {zoneName} • {seatLabel}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary/85" />
              <span>Ngày mua: {issuedAt ? formatDateTime(issuedAt) : "Không xác định"}</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end">
          <div className={`text-sm font-bold ${statusClassName}`}>{statusLabel}</div>
          <div className="text-sm font-extrabold tabular-nums text-primary">
            {formatVnd(price)}
          </div>
          <div className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-surface/40 px-4 text-xs font-semibold text-foreground/80">
            {zoneName}
          </div>
        </div>
      </div>
    </article>
  );
}

function TicketListSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="flex overflow-hidden rounded-4xl border border-border bg-surface/35 shadow-[0_18px_70px_rgba(0,0,0,0.30)] backdrop-blur-xl"
        >
          <div className="hidden w-52 shrink-0 bg-surface-2/65 md:block" />
          <div className="flex-1 p-6">
            <div className="skeleton h-5 w-72 rounded-full" />
            <div className="mt-4 space-y-3">
              <div className="skeleton h-4 w-[72%] rounded-full" />
              <div className="skeleton h-4 w-[58%] rounded-full" />
              <div className="skeleton h-4 w-[44%] rounded-full" />
            </div>
          </div>
          <div className="hidden w-44 shrink-0 p-6 sm:block">
            <div className="skeleton h-4 w-24 rounded-full" />
            <div className="mt-4 skeleton h-5 w-28 rounded-full" />
            <div className="mt-4 skeleton h-9 w-28 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MyTicketsDashboard() {
  const myTickets = useMyTickets();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (sortRef.current?.contains(target)) return;
      setSortOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setSortOpen(false);
    }

    if (!sortOpen) return;
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [sortOpen]);

  const sortLabel = useMemo((): string => {
    const map: Record<TicketSortKey, string> = {
      EVENT_DATE: "Ngày diễn ra",
      PURCHASE_DATE: "Ngày mua",
      PRICE: "Giá thành",
    };
    return map[myTickets.sortKey];
  }, [myTickets.sortKey]);

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        if (!myTickets.hasMore) return;
        myTickets.loadMore();
      },
      { rootMargin: "240px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [myTickets]);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <ProfileSidebar />

      <section className="min-w-0 flex-1">
        <div className="rounded-[36px] border border-border bg-surface/55 p-7 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-9">
          <header>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Vé của tôi
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Theo dõi vé đã mua, sắp xếp theo ngày diễn ra, ngày mua hoặc giá thành.
            </p>
          </header>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-3">
              <StatusPill
                label="Tất cả"
                value="ALL"
                current={myTickets.categoryFilter}
                onChange={myTickets.setCategoryFilter}
              />
              <StatusPill
                label="Sắp diễn ra"
                value="UPCOMING"
                current={myTickets.categoryFilter}
                onChange={myTickets.setCategoryFilter}
              />
              <StatusPill
                label="Đã kết thúc"
                value="ENDED"
                current={myTickets.categoryFilter}
                onChange={myTickets.setCategoryFilter}
              />
              <StatusPill
                label="Đã hủy"
                value="CANCELLED"
                current={myTickets.categoryFilter}
                onChange={myTickets.setCategoryFilter}
              />
            </div>
          </div>

          {/* Search and Filter Row */}
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm theo tên sự kiện, địa điểm..."
                value={myTickets.searchQuery}
                onChange={(e) => myTickets.setSearchQuery(e.currentTarget.value)}
                className="h-11 w-full rounded-full border border-border bg-surface/60 px-4 text-sm text-foreground/90 outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15"
              />
            </div>

            <div ref={sortRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setSortOpen((open) => !open)}
                className={
                  sortOpen
                    ? "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-surface/70 px-5 text-sm font-semibold text-foreground shadow-[0_10px_40px_rgba(0,0,0,0.25)]"
                    : "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-surface/45 px-5 text-sm font-semibold text-foreground/85 transition hover:bg-surface/65 hover:text-foreground"
                }
                aria-label="Bộ lọc"
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Sắp xếp: {sortLabel}</span>
              </button>

              {sortOpen ? (
                <div className="absolute right-0 z-20 mt-3 w-56 overflow-hidden rounded-3xl border border-border bg-surface/85 shadow-[0_18px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                  {(
                    [
                      { key: "EVENT_DATE", label: "Ngày diễn ra" },
                      { key: "PURCHASE_DATE", label: "Ngày mua" },
                      { key: "PRICE", label: "Giá thành" },
                    ] as const satisfies ReadonlyArray<{ key: TicketSortKey; label: string }>
                  ).map((item) => {
                    const active = item.key === myTickets.sortKey;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          myTickets.setSortKey(item.key);
                          setSortOpen(false);
                        }}
                        className={
                          active
                            ? "flex w-full items-center justify-between px-5 py-3 text-left text-sm font-semibold text-foreground"
                            : "flex w-full items-center justify-between px-5 py-3 text-left text-sm font-semibold text-foreground/85 transition hover:bg-surface/65 hover:text-foreground"
                        }
                      >
                        <span>{item.label}</span>
                        {active ? (
                          <span className="h-2 w-2 rounded-full bg-linear-to-r from-primary to-secondary" />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-transparent" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-7">
            {myTickets.isLoading ? (
              <TicketListSkeleton />
            ) : myTickets.isError ? (
              <div className="rounded-3xl border border-border bg-surface/35 p-6 text-sm text-foreground/80">
                Không tải được danh sách vé.
              </div>
            ) : myTickets.tickets.length === 0 ? (
              <div className="rounded-3xl border border-border bg-surface/35 p-10 text-center">
                <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3">
                  <Image
                    src="/ticket.svg"
                    alt="Vé"
                    width={84}
                    height={84}
                    priority
                  />
                  <div className="text-sm font-semibold text-foreground/90">
                    Không có vé phù hợp bộ lọc hiện tại.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {myTickets.tickets.map((ticket) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  >
                    <TicketCard
                      title={ticket.eventTitle}
                      venue={ticket.venue}
                      startTime={ticket.startTime}
                      endTime={ticket.endTime}
                      zoneName={ticket.zoneName}
                      seatLabel={ticket.seatLabel}
                      status={ticket.status}
                      price={ticket.price}
                      issuedAt={ticket.issuedAt}
                      isEnded={isEndedFromTimes(ticket.startTime, ticket.endTime, new Date())}
                      qrCode={ticket.qrCode}
                    />
                  </motion.div>
                ))}

                <div ref={sentinelRef} />

                {myTickets.hasMore ? (
                  <div className="pt-2">
                    <TicketListSkeleton />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
