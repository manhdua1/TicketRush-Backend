"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Globe2,
  LayoutGrid,
  Music,
  Theater,
  Trophy,
  ChevronRight,
} from "lucide-react";

import EventCard, { type EventCardData } from "@/features/events/components/event-card";
import type { Category, Event } from "@/features/events/types";

/* ──────────────────────────────────────────────────────────
   Design tokens per category
────────────────────────────────────────────────────────── */

type CategoryMeta = {
  label: string;
  icon: React.ReactNode;
  gradient: string;   // Tailwind gradient classes for the featured tile
  glow: string;       // rgba for icon glow
};

const CATEGORY_META: Record<Category, CategoryMeta> = {
  LIVE_MUSIC: {
    label: "Nhạc sống",
    icon: <Music className="h-8 w-8 text-white" />,
    gradient: "from-violet-600 via-purple-600 to-indigo-700",
    glow: "rgba(124,58,237,0.55)",
  },
  PERFORMING_ARTS: {
    label: "Nghệ thuật biểu diễn",
    icon: <Theater className="h-8 w-8 text-white" />,
    gradient: "from-rose-600 via-pink-600 to-fuchsia-700",
    glow: "rgba(236,72,153,0.55)",
  },
  SPORTS: {
    label: "Thể thao",
    icon: <Trophy className="h-8 w-8 text-white" />,
    gradient: "from-amber-500 via-orange-500 to-red-600",
    glow: "rgba(245,158,11,0.55)",
  },
  SEMINARS_AND_WORKSHOPS: {
    label: "Hội thảo & Workshop",
    icon: <GraduationCap className="h-8 w-8 text-white" />,
    gradient: "from-blue-500 via-cyan-500 to-teal-400",
    glow: "rgba(6,182,212,0.55)",
  },
  TOURS_AND_EXPERIENCES: {
    label: "Tour & Trải nghiệm",
    icon: <Globe2 className="h-8 w-8 text-white" />,
    gradient: "from-emerald-500 via-teal-500 to-cyan-600",
    glow: "rgba(16,185,129,0.55)",
  },
  OTHER: {
    label: "Khác",
    icon: <LayoutGrid className="h-8 w-8 text-white" />,
    gradient: "from-slate-500 via-slate-600 to-slate-700",
    glow: "rgba(100,116,139,0.55)",
  },
};

/* ──────────────────────────────────────────────────────────
   Shared helpers (mirrors trending-events-section)
────────────────────────────────────────────────────────── */

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
  const prices = zones.map((z) => z.price).filter(Number.isFinite);
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
   Featured category tile
────────────────────────────────────────────────────────── */

function FeaturedTile({
  category,
  href,
}: {
  category: Category;
  href: string;
}) {
  const meta = CATEGORY_META[category];
  return (
    <Link
      href={href}
      className={`group relative flex h-full min-h-[200px] flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl bg-linear-to-br ${meta.gradient} p-6 shadow-[0_12px_40px_rgba(0,0,0,0.35)] transition hover:scale-[1.02]`}
    >
      {/* ambient glow blob */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(60% 60% at 50% 50%, ${meta.glow} 0%, transparent 70%)`,
        }}
      />
      {/* icon circle */}
      <span
        className="relative grid h-14 w-14 place-items-center rounded-2xl border border-white/20 bg-white/15 backdrop-blur-sm transition duration-300 group-hover:scale-110"
        style={{ boxShadow: `0 0 28px ${meta.glow}` }}
      >
        {meta.icon}
      </span>
      <span className="relative text-center text-sm font-bold leading-snug text-white">
        {meta.label}
      </span>
      <ChevronRight className="relative h-4 w-4 text-white/60 transition group-hover:translate-x-0.5 group-hover:text-white/90" />
    </Link>
  );
}

/* ──────────────────────────────────────────────────────────
   Mini slider (for extra events beyond first 2)
────────────────────────────────────────────────────────── */

const SLIDER_PER_PAGE = 3;

function MiniSlider({ events, category }: { events: Event[]; category: Category }) {
  const totalPages = Math.max(1, Math.ceil(events.length / SLIDER_PER_PAGE));
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState(1);

  const visible = events.slice(
    page * SLIDER_PER_PAGE,
    page * SLIDER_PER_PAGE + SLIDER_PER_PAGE,
  );

  function goTo(next: number) {
    setDir(next > page ? 1 : -1);
    setPage(next);
  }

  const variants = {
    enter: (d: number) => ({ x: d * 50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d * -50, opacity: 0 }),
  };

  if (events.length === 0) return null;

  return (
    <div className="mt-5">
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={`${category}-${page}`}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {visible.map((event) => (
              <EventCard
                key={event.id}
                data={toCardData(event)}
                href={`/events/${event.id}`}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {totalPages > 1 && (
        <div className="mt-5 flex justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Trang ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === page
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-foreground/20 hover:bg-foreground/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Single category block
────────────────────────────────────────────────────────── */

function CategoryBlock({
  category,
  events,
}: {
  category: Category;
  events: Event[];
}) {
  const meta = CATEGORY_META[category];
  const firstTwo = events.slice(0, 2);
  const rest = events.slice(2);
  const href = `/events?type=${category}`;

  return (
    <div className="rounded-2xl border border-border bg-surface/30 p-5 backdrop-blur-sm">
      {/* Section header */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-base font-extrabold tracking-tight">
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-linear-to-br ${meta.gradient} [&>svg]:h-4 [&>svg]:w-4`}
          >
            {meta.icon}
          </span>
          <span
            className={`bg-linear-to-r ${meta.gradient} bg-clip-text text-transparent`}
          >
            {meta.label}
          </span>
        </h3>
        <Link
          href={href}
          className="text-xs font-semibold text-primary/80 transition hover:text-primary"
        >
          Xem tất cả →
        </Link>
      </div>

      {/* First row: featured tile + 2 event cards */}
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <FeaturedTile category={category} href={href} />
        {firstTwo.map((event) => (
          <EventCard
            key={event.id}
            data={toCardData(event)}
            href={`/events/${event.id}`}
          />
        ))}
        {/* fill empty slots so grid stays 3-col */}
        {firstTwo.length < 2 &&
          Array.from({ length: 2 - firstTwo.length }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="hidden md:block"
              aria-hidden
            />
          ))}
      </div>

      {/* Slider for events 3-5 */}
      <MiniSlider events={rest} category={category} />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Main export
────────────────────────────────────────────────────────── */

export type CategoryEventsMap = Partial<Record<Category, Event[]>>;

export default function CategorySection({
  categoryEvents,
}: {
  categoryEvents: CategoryEventsMap;
}) {
  const categories = Object.keys(CATEGORY_META) as Category[];
  const populated = categories.filter(
    (cat) => (categoryEvents[cat]?.length ?? 0) > 0,
  );

  if (populated.length === 0) return null;

  return (
    <section id="categories" className="pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              <span className="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
                Khám phá
              </span>{" "}
              <span className="text-foreground">theo thể loại</span>
            </h2>
            <p className="mt-1 text-sm text-muted">
              Tìm sự kiện phù hợp với sở thích của bạn.
            </p>
          </div>
        </div>

        {/* Category blocks */}
        <div className="mt-8 flex flex-col gap-8">
          {populated.map((cat) => (
            <CategoryBlock
              key={cat}
              category={cat}
              events={categoryEvents[cat] ?? []}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
