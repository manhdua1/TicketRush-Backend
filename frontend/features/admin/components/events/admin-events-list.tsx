"use client";

import { type DragEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Loader2, RefreshCcw, Search, Sparkles } from "lucide-react";

import GlassCard from "@/features/admin/components/ui/glass-card";
import { getEvents } from "@/features/admin/services/get-events";
import { setSpotlightEvent } from "@/features/admin/services/set-spotlight-event";
import { CATEGORY_LABELS, type Category, type Event } from "@/features/events/types";

type StatusFilter = "ALL" | Event["status"];

const EMPTY_EVENTS: Event[] = [];
const EVENT_ID_DRAG_TYPE = "application/x-ticket-rush-event-id";

const STATUS_LABELS: Record<Event["status"], string> = {
  DRAFT: "Nháp",
  ON_SALE: "Đang mở bán",
  ENDED: "Đã kết thúc",
};

function FancyDropdown<T extends string>({
  value,
  options,
  onChange,
  className,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
  className?: string;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const current = options.find((o) => o.value === value)?.label ?? "";

  return (
    <details ref={detailsRef} className={["relative z-[999]", className ?? ""].join(" ")}>
      <summary className="group flex h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/85 outline-none backdrop-blur-xl transition hover:bg-white/7 focus-visible:ring-4 focus-visible:ring-primary/15">
        <span className="truncate">{current}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-white/60 transition group-open:rotate-180" />
      </summary>
      <div className="absolute right-0 z-[999] mt-2 w-60 overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E15]/85 p-1 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                detailsRef.current?.removeAttribute("open");
              }}
              className={[
                "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition",
                active ? "bg-primary/15 text-primary" : "text-white/80 hover:bg-white/5 hover:text-white/90",
              ].join(" ")}
            >
              <span className="min-w-0 truncate">{opt.label}</span>
              {active ? (
                <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_rgba(124,58,237,0.65)]" />
              ) : null}
            </button>
          );
        })}
      </div>
    </details>
  );
}

function statusChipClass(status: Event["status"]) {
  switch (status) {
    case "ON_SALE":
      return "border-emerald-300/40 bg-emerald-400/25 text-emerald-100";
    case "ENDED":
      return "border-rose-300/40 bg-rose-400/25 text-rose-100";
    default:
      return "border-white/20 bg-white/18 text-white/80";
  }
}

function formatDateTimeShort(value: string) {
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function makeDragPreview(event: Event) {
  const preview = document.createElement("div");
  preview.style.position = "fixed";
  preview.style.top = "-1000px";
  preview.style.left = "-1000px";
  preview.style.width = "220px";
  preview.style.pointerEvents = "none";
  preview.style.border = "1px solid rgba(255,255,255,0.16)";
  preview.style.borderRadius = "18px";
  preview.style.background = "rgba(14,14,21,0.94)";
  preview.style.boxShadow = "0 18px 50px rgba(0,0,0,0.42), 0 0 0 1px rgba(124,58,237,0.26)";
  preview.style.backdropFilter = "blur(14px)";
  preview.style.padding = "12px";
  preview.style.color = "white";

  const row = document.createElement("div");
  row.style.display = "flex";
  row.style.alignItems = "center";
  row.style.gap = "10px";

  const icon = document.createElement("div");
  icon.textContent = "✦";
  icon.style.display = "grid";
  icon.style.width = "36px";
  icon.style.height = "36px";
  icon.style.flexShrink = "0";
  icon.style.placeItems = "center";
  icon.style.border = "1px solid rgba(124,58,237,0.38)";
  icon.style.borderRadius = "12px";
  icon.style.background = "rgba(124,58,237,0.18)";
  icon.style.color = "rgb(196,181,253)";
  icon.style.fontSize = "18px";
  icon.style.fontWeight = "800";

  const content = document.createElement("div");
  content.style.minWidth = "0";

  const title = document.createElement("div");
  title.textContent = event.title;
  title.style.overflow = "hidden";
  title.style.textOverflow = "ellipsis";
  title.style.whiteSpace = "nowrap";
  title.style.fontSize = "13px";
  title.style.fontWeight = "800";

  const hint = document.createElement("div");
  hint.textContent = "Thả vào Spotlight";
  hint.style.marginTop = "3px";
  hint.style.fontSize = "11px";
  hint.style.fontWeight = "700";
  hint.style.color = "rgba(255,255,255,0.56)";

  content.append(title, hint);
  row.append(icon, content);
  preview.append(row);
  document.body.append(preview);

  return preview;
}

export default function AdminEventsList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [category, setCategory] = useState<"ALL" | Category>("ALL");
  const [draggedEventId, setDraggedEventId] = useState<number | null>(null);
  const [isSpotlightDropActive, setIsSpotlightDropActive] = useState(false);
  const [spotlightFeedback, setSpotlightFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const eventsQuery = useQuery({
    queryKey: ["admin", "events", "list"] as const,
    queryFn: getEvents,
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });

  const events = eventsQuery.data?.result ?? EMPTY_EVENTS;
  const spotlightEvent = events.find((event) => event.spotlight) ?? null;

  const spotlightMutation = useMutation({
    mutationFn: (eventId: number) => setSpotlightEvent(eventId, true),
    onSuccess: async (_, eventId) => {
      const event = events.find((item) => item.id === eventId);
      setSpotlightFeedback({
        type: "success",
        message: event ? `${event.title} đã được đặt làm spotlight.` : "Đã cập nhật spotlight.",
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "events", "list"] as const }),
        queryClient.invalidateQueries({ queryKey: ["spotlight-event"] as const }),
      ]);
    },
    onError: (error) => {
      setSpotlightFeedback({
        type: "error",
        message: error instanceof Error ? error.message : "Không thể đặt sự kiện làm spotlight.",
      });
    },
    onSettled: () => {
      setDraggedEventId(null);
      setIsSpotlightDropActive(false);
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (status !== "ALL" && e.status !== status) return false;
      if (category !== "ALL" && e.type !== category) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q)
      );
    });
  }, [events, search, status, category]);

  const statusOptions: Array<{ value: StatusFilter; label: string }> = [
    { value: "ALL", label: "Tất cả trạng thái" },
    { value: "DRAFT", label: "Nháp" },
    { value: "ON_SALE", label: "Đang mở bán" },
    { value: "ENDED", label: "Đã kết thúc" },
  ];

  const categoryOptions: Array<{ value: "ALL" | Category; label: string }> = [
    { value: "ALL", label: "Tất cả thể loại" },
    ...(Object.keys(CATEGORY_LABELS) as Category[]).map((key) => ({
      value: key,
      label: CATEGORY_LABELS[key],
    })),
  ];

  function handleDragStart(dragEvent: DragEvent<HTMLAnchorElement>, event: Event) {
    dragEvent.dataTransfer.effectAllowed = "copy";
    dragEvent.dataTransfer.setData(EVENT_ID_DRAG_TYPE, String(event.id));
    dragEvent.dataTransfer.setData("text/plain", String(event.id));

    const preview = makeDragPreview(event);
    dragEvent.dataTransfer.setDragImage(preview, 110, 28);
    window.setTimeout(() => preview.remove(), 0);

    setDraggedEventId(event.id);
    setSpotlightFeedback(null);
  }

  function readDraggedEventId(dragEvent: DragEvent<HTMLElement>) {
    const raw =
      dragEvent.dataTransfer.getData(EVENT_ID_DRAG_TYPE) ||
      dragEvent.dataTransfer.getData("text/plain");
    const eventId = Number(raw);
    return Number.isFinite(eventId) && eventId > 0 ? eventId : null;
  }

  function handleSpotlightDrop(dragEvent: DragEvent<HTMLDivElement>) {
    dragEvent.preventDefault();
    const eventId = readDraggedEventId(dragEvent);

    if (!eventId) {
      setSpotlightFeedback({ type: "error", message: "Không đọc được eventId từ thao tác kéo thả." });
      setIsSpotlightDropActive(false);
      return;
    }

    spotlightMutation.mutate(eventId);
  }

  function renderSpotlightDropZone(compact = false) {
    return (
      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setIsSpotlightDropActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
          setIsSpotlightDropActive(true);
        }}
        onDragLeave={(event) => {
          const nextTarget = event.relatedTarget;
          if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
          setIsSpotlightDropActive(false);
        }}
        onDrop={handleSpotlightDrop}
        className={[
          "flex flex-col gap-4 rounded-2xl border border-dashed border-white/20 bg-[#0E0E15]/85 p-4 sm:flex-row sm:items-center sm:justify-between",
          compact ? "shadow-[0_18px_70px_rgba(0,0,0,0.45)]" : "",
        ].join(" ")}
      >
        <div className="flex min-w-0 items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-primary/30 bg-primary/15 text-primary">
            {spotlightMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-[var(--font-display)] text-base font-semibold text-white/90">
              Spotlight
            </div>
            <div className="mt-1 text-sm text-white/55">
              {spotlightEvent
                ? `Đang hiển thị: ${spotlightEvent.title}`
                : "Kéo một sự kiện vào đây để hiển thị trên hero trang chủ."}
            </div>
          </div>
        </div>

        <div className="shrink-0 text-sm font-semibold text-white/60">
          {spotlightMutation.isPending
            ? "Đang cập nhật..."
            : draggedEventId
              ? "Thả vào đây để đặt spotlight"
              : "Kéo event card vào đây"}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {draggedEventId ? (
        <div className="pointer-events-none fixed inset-x-4 bottom-5 z-[1000] mx-auto max-w-5xl">
          <GlassCard
            className={[
              "pointer-events-auto bg-[#0E0E15]/90 p-3 shadow-[0_18px_70px_rgba(0,0,0,0.55)] transition",
              isSpotlightDropActive ? "border-primary/50 bg-primary/20 shadow-[0_0_0_1px_rgba(124,58,237,0.30)]" : "",
            ].join(" ")}
          >
            {renderSpotlightDropZone(true)}
          </GlassCard>
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-[var(--font-display)] text-xl font-semibold tracking-tight">
            Sự kiện
          </div>
          <div className="mt-1 text-sm text-white/55">
            Quản lý sự kiện của bạn.
          </div>
        </div>

        <button
          type="button"
          onClick={() => void eventsQuery.refetch()}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/7 hover:text-white/90"
        >
          <RefreshCcw className="h-4 w-4" />
          Làm mới
        </button>
      </div>

      <GlassCard
        className={[
          "bg-[#0E0E15]/70 p-5 transition",
          isSpotlightDropActive ? "border-primary/50 bg-primary/20 shadow-[0_0_0_1px_rgba(124,58,237,0.30)]" : "",
        ].join(" ")}
      >
        <div
          onDragEnter={(event) => {
            event.preventDefault();
            setIsSpotlightDropActive(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
            setIsSpotlightDropActive(true);
          }}
          onDragLeave={(event) => {
            const nextTarget = event.relatedTarget;
            if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
            setIsSpotlightDropActive(false);
          }}
          onDrop={handleSpotlightDrop}
          className="flex flex-col gap-4 rounded-2xl border border-dashed border-white/20 bg-[#0E0E15]/85 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex min-w-0 items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-primary/30 bg-primary/15 text-primary">
              {spotlightMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="font-[var(--font-display)] text-base font-semibold text-white/90">
                Spotlight
              </div>
              <div className="mt-1 text-sm text-white/55">
                {spotlightEvent
                  ? `Đang hiển thị: ${spotlightEvent.title}`
                  : "Kéo một sự kiện vào đây để hiển thị trên hero trang chủ."}
              </div>
            </div>
          </div>

          <div className="shrink-0 text-sm font-semibold text-white/60">
            {spotlightMutation.isPending
              ? "Đang cập nhật..."
              : draggedEventId
                ? "Thả vào đây để đặt spotlight"
                : "Kéo event card vào đây"}
          </div>
        </div>

        {spotlightFeedback ? (
          <div
            className={[
              "mt-3 rounded-2xl border p-3 text-sm",
              spotlightFeedback.type === "success"
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                : "border-red-500/25 bg-red-500/10 text-red-200",
            ].join(" ")}
          >
            {spotlightFeedback.message}
          </div>
        ) : null}
      </GlassCard>

      <GlassCard className="relative z-[50] p-6">
        <div className="isolate flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên sự kiện hoặc địa điểm..."
              className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 pl-11 pr-4 text-sm text-white/90 outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div className="flex w-full flex-wrap items-center justify-end gap-3 lg:w-auto">
            <FancyDropdown
              value={status}
              options={statusOptions}
              onChange={(v) => setStatus(v)}
              className="min-w-[220px]"
            />

            <FancyDropdown
              value={category}
              options={categoryOptions}
              onChange={(v) => setCategory(v)}
              className="min-w-[220px]"
            />
          </div>
        </div>
      </GlassCard>

      {eventsQuery.isError ? (
        <div className="rounded-3xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">
          {(eventsQuery.error as Error | null)?.message || "Không thể tải danh sách sự kiện."}
        </div>
      ) : null}

      <div className="relative z-0 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {eventsQuery.isLoading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="animate-pulse rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="aspect-[16/10] w-full rounded-2xl bg-white/10" />
              <div className="mt-4 h-4 w-2/3 rounded bg-white/10" />
              <div className="mt-2 h-3 w-1/2 rounded bg-white/10" />
            </div>
          ))
        ) : filtered.length ? (
          filtered.map((event) => (
            <Link
              key={event.id}
              href={`/admin/events/${event.id}`}
              draggable
              onDragStart={(dragEvent) => handleDragStart(dragEvent, event)}
              onDragEnd={() => {
                setDraggedEventId(null);
                setIsSpotlightDropActive(false);
              }}
              className={[
                "group rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition hover:border-primary/30 hover:bg-white/7 hover:shadow-[0_0_0_1px_rgba(124,58,237,0.20)]",
                draggedEventId === event.id ? "scale-[0.97] border-primary/40 opacity-45 ring-2 ring-primary/20" : "",
              ].join(" ")}
            >
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <div
                  className={[
                    "absolute left-3 top-3 z-10 rounded-xl border px-2.5 py-1 text-[11px] font-bold tracking-wide",
                    statusChipClass(event.status),
                  ].join(" ")}
                >
                  {STATUS_LABELS[event.status]}
                </div>

                <div className="aspect-video w-full bg-[#0E0E15]/40">
                  {event.posterUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={event.posterUrl}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-sm text-white/45">
                      Chưa có poster
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 min-w-0">
                <div className="truncate font-[var(--font-display)] text-base font-semibold text-white/90">
                  {event.title}
                </div>
                <div className="mt-1 truncate text-sm text-white/55">
                  {event.venue}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-white/55">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                    {CATEGORY_LABELS[event.type]}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                    {formatDateTimeShort(event.startTime)}
                  </span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-sm text-white/60">
            Không có sự kiện phù hợp bộ lọc hiện tại.
          </div>
        )}
      </div>
    </div>
  );
}
