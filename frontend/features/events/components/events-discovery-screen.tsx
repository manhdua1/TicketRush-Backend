"use client";

import { useMemo } from "react";

import { motion } from "framer-motion";
import { Calendar, Filter, LayoutGrid, List, ChevronLeft, ChevronRight } from "lucide-react";

import Footer from "@/components/shared/footer";
import NavBar from "@/components/shared/navbar";
import EventCard, {
  type EventCardData,
} from "@/features/events/components/event-card";
import {
  CATEGORY_LABELS,
  type Category,
  type Event,
} from "@/features/events/types";
import { useEventsSearch } from "@/features/events/hooks/use-events-search";

function formatVnd(amount: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(amount)} đ`;
}

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
    priceFrom:
      minPrice === null ? "Liên hệ" : `Từ ${formatVnd(minPrice)}`,
    imageSrc: event.posterUrl || "/events/event-1.svg",
  };
}

function CategoryOption({
  name,
  label,
  active,
  onSelect,
}: {
  name: string;
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={
        active
          ? "flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-surface/60 px-4 py-3 text-left text-sm font-semibold text-foreground shadow-[0_16px_55px_rgba(0,0,0,0.28)]"
          : "flex w-full cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-foreground/80 transition hover:bg-surface/55 hover:text-foreground"
      }
    >
      <input
        type="radio"
        name={name}
        checked={active}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        aria-hidden
        className={
          active
            ? "grid h-5 w-5 place-items-center rounded-full border border-primary/55 bg-primary/20"
            : "grid h-5 w-5 place-items-center rounded-full border border-border bg-transparent"
        }
      >
        {active ? (
          <span className="h-2.5 w-2.5 rounded-full bg-linear-to-r from-primary to-secondary" />
        ) : null}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </label>
  );
}

export default function EventsDiscoveryScreen() {
  const events = useEventsSearch();

  const categories = useMemo(
    () => Object.entries(CATEGORY_LABELS) as Array<[Category, string]>,
    [],
  );

  const totalPages = events.data?.totalPages ?? 1;

  const isFirst = events.state.page <= 1;
  const isLast = events.state.page >= totalPages;

  return (
    <>
      <NavBar
        searchValue={events.state.name}
        onSearchChange={events.setName}
        searchPlaceholder="Tìm kiếm sự kiện..."
        searchAriaLabel="Tìm kiếm sự kiện"
      />

      <main className="pt-24">
        <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
            <motion.aside
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="h-fit rounded-3xl border border-border bg-surface/45 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl border border-border bg-surface/60">
                  <Filter className="h-4 w-4 text-foreground/75" />
                </span>
                <div>
                  <h2 className="text-base font-extrabold tracking-tight">
                    Bộ Lọc
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">
                    Tinh chỉnh theo sở thích của bạn.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <div className="text-xs font-bold uppercase tracking-wide text-muted">
                  Danh mục
                </div>
                <div className="mt-3 space-y-1">
                  <CategoryOption
                    name="events-category"
                    label="Tất cả"
                    active={!events.state.type}
                    onSelect={() => events.setType(undefined)}
                  />

                  {categories.map(([key, label]) => (
                    <CategoryOption
                      key={key}
                      name="events-category"
                      label={label}
                      active={events.state.type === key}
                      onSelect={() => events.setType(key)}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-7">
                <div className="text-xs font-bold uppercase tracking-wide text-muted">
                  Thời gian
                </div>

                <div className="mt-3 space-y-4">
                  <label className="block">
                    <div className="text-xs font-semibold text-foreground/80">
                      Từ
                    </div>
                    <div className="relative mt-2">
                      <Calendar className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/55 text-white" />
                      <input
                        type="date"
                        value={events.state.dstfrom}
                        onChange={(e) =>
                          events.setDstFrom(e.currentTarget.value)
                        }
                        className="h-11 w-full rounded-2xl border border-border bg-surface/60 pl-11 pr-4 text-sm text-foreground/90 outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <div className="text-xs font-semibold text-foreground/80">
                      Đến
                    </div>
                    <div className="relative mt-2">
                      <Calendar className="text-white pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/55" />
                      <input
                        type="date"
                        value={events.state.dstto}
                        onChange={(e) => events.setDstTo(e.currentTarget.value)}
                        className="h-11 w-full rounded-2xl border border-border bg-surface/60 pl-11 pr-4 text-sm text-foreground/90 outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15"
                      />
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="button"
                onClick={events.clearFilters}
                className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-full border border-border bg-transparent px-5 text-sm font-semibold text-foreground/80 transition hover:bg-surface/60 hover:text-foreground"
              >
                Xóa bộ lọc
              </button>
            </motion.aside>

            <section className="min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                    Khám Phá
                  </h1>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => events.setView("grid")}
                    aria-label="Xem dạng lưới"
                    className={
                      events.state.view === "grid"
                        ? "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/45 bg-surface/60 text-foreground shadow-[0_0_24px_rgba(124,58,237,0.15)]"
                        : "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface/45 text-foreground/70 transition hover:bg-surface/65 hover:text-foreground"
                    }
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => events.setView("list")}
                    aria-label="Xem dạng danh sách"
                    className={
                      events.state.view === "list"
                        ? "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/45 bg-surface/60 text-foreground shadow-[0_0_24px_rgba(124,58,237,0.15)]"
                        : "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface/45 text-foreground/70 transition hover:bg-surface/65 hover:text-foreground"
                    }
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-7">
                {events.isLoading ? (
                  <div
                    className={
                      events.state.view === "list"
                        ? "grid gap-5"
                        : "grid gap-5 md:grid-cols-2 lg:grid-cols-3"
                    }
                  >
                    {Array.from({ length: events.state.size }).map((_, idx) =>
                      events.state.view === "list" ? (
                        <div
                          key={idx}
                          className="overflow-hidden rounded-3xl border border-border bg-surface/35 p-5"
                        >
                          <div className="flex flex-col gap-5 sm:flex-row">
                            <div className="aspect-video w-full skeleton rounded-2xl sm:w-64" />
                            <div className="flex-1 space-y-3">
                              <div className="h-4 w-4/5 skeleton rounded-full" />
                              <div className="h-3 w-3/5 skeleton rounded-full" />
                              <div className="h-3 w-2/3 skeleton rounded-full" />
                            </div>
                            <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-center">
                              <div className="h-4 w-28 skeleton rounded-full" />
                              <div className="h-11 w-32 skeleton rounded-full" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          key={idx}
                          className="overflow-hidden rounded-3xl border border-border bg-surface/35"
                        >
                          <div className="aspect-video w-full skeleton" />
                          <div className="space-y-3 p-5">
                            <div className="h-4 w-4/5 skeleton rounded-full" />
                            <div className="h-3 w-3/5 skeleton rounded-full" />
                            <div className="h-3 w-2/3 skeleton rounded-full" />
                            <div className="h-4 w-2/5 skeleton rounded-full" />
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                ) : events.isError ? (
                  <div className="rounded-3xl border border-border bg-surface/35 p-6 text-sm text-foreground/80">
                    {(events.error as Error)?.message ||
                      "Không tải được danh sách sự kiện."}
                  </div>
                ) : (events.data?.content?.length ?? 0) === 0 ? (
                  <div className="rounded-3xl border border-border bg-surface/35 p-10 text-center text-sm text-foreground/80">
                    Không có sự kiện phù hợp bộ lọc hiện tại.
                  </div>
                ) : (
                  <motion.div
                    layout
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: { opacity: 0 },
                      show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.05 },
                      },
                    }}
                    className={
                      events.state.view === "list"
                        ? "grid gap-5"
                        : "grid gap-5 md:grid-cols-2 lg:grid-cols-3"
                    }
                  >
                    {events.data!.content.map((event, index) => (
                      <motion.div
                        key={event.id}
                        layout
                        variants={{
                          hidden: { opacity: 0, y: 10 },
                          show: { opacity: 1, y: 0 },
                        }}
                      >
                        <EventCard
                          data={toCardData(event)}
                          href={`/events/${event.id}`}
                          variant={events.state.view}
                          priority={events.state.page === 1 && index === 0}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>

              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => events.setPage(events.state.page - 1)}
                  disabled={isFirst || events.isLoading}
                  aria-label="Trang trước"
                  className={
                    isFirst || events.isLoading
                      ? "inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface/35 text-foreground/30"
                      : "inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface/55 text-foreground/75 transition hover:bg-surface/70 hover:text-foreground hover:shadow-[0_0_26px_rgba(124,58,237,0.14)]"
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="rounded-full border border-border bg-surface/55 px-6 py-2 text-sm font-semibold text-foreground/80 backdrop-blur-xl">
                  Trang {events.state.page} / {Math.max(1, totalPages)}
                </div>

                <button
                  type="button"
                  onClick={() => events.setPage(events.state.page + 1)}
                  disabled={isLast || events.isLoading}
                  aria-label="Trang sau"
                  className={
                    isLast || events.isLoading
                      ? "inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface/35 text-foreground/30"
                      : "inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface/55 text-foreground/75 transition hover:bg-surface/70 hover:text-foreground hover:shadow-[0_0_26px_rgba(124,58,237,0.14)]"
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
