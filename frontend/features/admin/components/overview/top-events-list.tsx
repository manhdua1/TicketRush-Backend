"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getOnSaleLowTickets } from "@/features/admin/services/get-on-sale-low-tickets";

function formatDateTimeShort(value: string) {
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export default function TopEventsList() {
  const lowTicketsQuery = useQuery({
    queryKey: ["admin", "overview", "on-sale-low-tickets"] as const,
    queryFn: getOnSaleLowTickets,
    refetchInterval: 5_000,
  });

  const topEvents = useMemo(() => {
    const results = lowTicketsQuery.data?.results ?? [];
    return results.slice(0, 6);
  }, [lowTicketsQuery.data?.results]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="font-[var(--font-display)] text-lg font-semibold tracking-tight">
          Sự kiện bán chạy nhất
        </div>
        <Link
          href="/admin/events"
          className="text-sm font-semibold text-primary/90 transition hover:text-primary"
        >
          Xem tất cả
        </Link>
      </div>

      <div className="grid gap-4">
        {!lowTicketsQuery.isLoading && topEvents.length ? (
          topEvents.map((event) => {
            const total = Math.max(0, event.totalTickets || 0);
            const sold = Math.max(0, event.soldTickets || 0);
            const pct = total > 0 ? Math.min(100, Math.max(0, (sold / total) * 100)) : 0;
            return (
              <div key={event.eventId} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/10">
                      {event.posterUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt=""
                          src={event.posterUrl}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {event.eventTitle}
                      </div>
                      <div className="truncate text-xs text-white/55">
                        {sold} / {total} vé · Còn lại: {event.remainingTickets}
                      </div>
                      <div className="mt-1 truncate text-[11px] text-white/45">
                        {event.venue} · {formatDateTimeShort(event.startTime)}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-lg font-extrabold tracking-tight text-white/90">
                      {`${Math.round(pct)}%`}
                    </div>
                  </div>
                </div>

                <div className="mt-4 h-2.5 w-full rounded-full bg-white/10">
                  <div
                    className="h-2.5 rounded-full bg-primary shadow-[0_0_18px_rgba(124,58,237,0.35)] transition-[width]"
                    style={{ width: `${pct.toFixed(1)}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/60">
            {lowTicketsQuery.isLoading ? "Đang tải dữ liệu..." : "Chưa có dữ liệu sự kiện đang mở bán."}
          </div>
        )}
      </div>
    </div>
  );
}
