"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, ChevronLeft, ChevronRight } from "lucide-react";

import EventCard, { type EventCardData } from "@/features/events/components/event-card";
import type { Event } from "@/features/events/types";

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const weekday = date
    .toLocaleDateString("vi-VN", { weekday: "short" })
    .replace("Th ", "T");

  const dayMonth = date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const time = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${weekday}, ${dayMonth} • ${time}`;
}

function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)} đ`;
}

function getMinZonePrice(zones: Event["zones"]): number | null {
  if (!zones || zones.length === 0) return null;
  const prices = zones
    .map((z) => z.price)
    .filter((price) => Number.isFinite(price));
  if (prices.length === 0) return null;
  return Math.min(...prices);
}

function toCardData(event: Event): EventCardData {
  const minPrice = getMinZonePrice(event.zones);

  return {
    title: event.title,
    datetime: formatDateTime(event.startTime),
    location: event.venue,
    priceFrom: minPrice === null ? "Liên hệ" : `Từ ${formatVnd(minPrice)}`,
    imageSrc: event.posterUrl || "/events/event-1.svg",
  };
}

/* ──────────────────────────────────────────────────────────
   Slider (3 cards / page, 2 pages max shown via dots)
────────────────────────────────────────────────────────── */

const CARDS_PER_PAGE = 3;

export { formatDateTime, formatVnd, getMinZonePrice };

export default function TrendingEventsSection({ events }: { events: Event[] }) {
  const totalPages = Math.max(1, Math.ceil(events.length / CARDS_PER_PAGE));
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(1);

  const visibleEvents = events.slice(
    page * CARDS_PER_PAGE,
    page * CARDS_PER_PAGE + CARDS_PER_PAGE,
  );

  function goTo(next: number) {
    setDirection(next > page ? 1 : -1);
    setPage(next);
  }

  const variants = {
    enter: (dir: number) => ({ x: dir * 60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir * -60, opacity: 0 }),
  };

  return (
    <section id="trending" className="pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight sm:text-2xl">
              <span className="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
                Sự kiện nổi bật
              </span>
              <Flame className="h-5 w-5 text-orange-400" />
            </h2>
            <p className="mt-1 text-sm text-muted">
              Những sự kiện hot nhất không thể bỏ qua tuần này.
            </p>
          </div>
          <Link
            href="/events"
            className="text-sm font-semibold text-primary/90 transition hover:text-primary"
          >
            Xem tất cả →
          </Link>
        </div>

        {/* Slider */}
        <div className="relative mt-6 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={page}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.32, ease: "easeInOut" }}
              className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            >
              {visibleEvents.map((event, idx) => (
                <EventCard
                  key={event.id}
                  data={toCardData(event)}
                  href={`/events/${event.id}`}
                  priority={page === 0 && idx === 0}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        {totalPages > 1 && (
          <div className="mt-7 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => goTo(Math.max(0, page - 1))}
              disabled={page === 0}
              aria-label="Trang trước"
              className="rounded-lg p-2 text-foreground/60 transition hover:bg-foreground/5 hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-foreground/60"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Trang ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${i === page
                    ? "w-7 bg-primary"
                    : "w-2 bg-foreground/25 hover:bg-foreground/45"
                    }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => goTo(Math.min(totalPages - 1, page + 1))}
              disabled={page === totalPages - 1}
              aria-label="Trang sau"
              className="rounded-lg p-2 text-foreground/60 transition hover:bg-foreground/5 hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-foreground/60"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
