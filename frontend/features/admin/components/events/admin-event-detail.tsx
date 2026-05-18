"use client";

import { type RefObject, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import {
  ArrowLeft,
  Armchair,
  Check,
  ChevronDown,
  MapPin,
  Pencil,
  ShieldAlert,
  X,
} from "lucide-react";

import GlassCard from "@/features/admin/components/ui/glass-card";
import { getEventById } from "@/features/events/services/get-event-by-id";
import { getEventStats } from "@/features/admin/services/get-event-stats";
import { getEventAudiences } from "@/features/admin/services/get-event-audiences";
import {
  modifyEventDetail,
  type EventDetailRequest,
} from "@/features/admin/services/modify-event-detail";
import { changeEventStatus } from "@/features/admin/services/change-event-status";
import { CATEGORY_LABELS, type Category, type Event } from "@/features/events/types";
import { formatPriceVND } from "@/features/events/utils/format-price";

type EditableField =
  | "title"
  | "description"
  | "venue"
  | "startTime"
  | "endTime"
  | "type"
  | "posterUrl"
  | "coordinates";

type Coordinate = {
  latitude: number;
  longitude: number;
};

const LocationPickerMap = dynamic(() => import("./location-picker-map"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center text-sm font-semibold text-white/55">
      Đang tải bản đồ...
    </div>
  ),
});

const STATUS_LABELS: Record<Event["status"], string> = {
  DRAFT: "Nháp",
  ON_SALE: "Đang mở bán",
  ENDED: "Đã kết thúc",
};

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

function clampPct(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function genderColor(raw: string) {
  const key = raw.trim().toUpperCase();
  if (key === "MALE" || key === "M") return "#60A5FA"; // blue-400
  if (key === "FEMALE" || key === "F") return "#F472B6"; // pink-400
  if (key === "OTHER") return "#A78BFA"; // violet-400
  return "#34D399"; // emerald-400 fallback
}

function genderLabel(raw: string) {
  const key = raw.trim().toUpperCase();
  if (key === "MALE" || key === "M") return "Nam";
  if (key === "FEMALE" || key === "F") return "Nữ";
  if (key === "OTHER") return "Khác";
  return raw;
}

function ageGroupLabel(raw: string) {
  const key = raw.trim().toUpperCase();
  const compact = key.replaceAll("_", "").replaceAll("-", "").replaceAll(" ", "");
  if (compact === "UNDER18" || compact === "BELOW18" || compact === "U18") return "Dưới 18";
  if (compact === "1824" || compact.includes("1824")) return "18-24";
  if (compact === "2534" || compact.includes("2534")) return "25-34";
  if (compact === "3544" || compact.includes("3544")) return "35-44";
  if (compact === "45PLUS" || compact === "45+" || compact.includes("45PLUS")) return "45+";
  return raw;
}

function formatDateTime(value: string) {
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function toDateTimeLocalValue(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIsoFromDateTimeLocal(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

function formatNullableCoordinate(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "null";
}

function parseCoordinateInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCoordinatePairValue(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
) {
  const hasLatitude = typeof latitude === "number" && Number.isFinite(latitude);
  const hasLongitude = typeof longitude === "number" && Number.isFinite(longitude);
  if (!hasLatitude && !hasLongitude) return "null";
  return `(${formatNullableCoordinate(latitude)}, ${formatNullableCoordinate(longitude)})`;
}

function formatCoordinatePairInputValue(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
) {
  if (latitude == null && longitude == null) return "";
  const left = latitude == null ? "" : String(latitude);
  const right = longitude == null ? "" : String(longitude);
  if (!left && !right) return "";
  return `${left}, ${right}`.trim();
}

function parseCoordinatePairInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return { latitude: null as number | null, longitude: null as number | null };

  const normalized = trimmed.replaceAll("(", "").replaceAll(")", "");
  const [rawLat = "", rawLng = ""] = normalized.split(",", 2).map((part) => part.trim());

  return {
    latitude: parseCoordinateInput(rawLat),
    longitude: parseCoordinateInput(rawLng),
  };
}

function CategoryDropdown({
  value,
  onChange,
  detailsRef,
}: {
  value: Category;
  onChange: (value: Category) => void;
  detailsRef: RefObject<HTMLDetailsElement | null>;
}) {
  return (
    <details ref={detailsRef} className="relative z-[80] mt-3">
      <summary className="group flex h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm font-semibold text-foreground/90 outline-none backdrop-blur-xl transition hover:bg-white/7 focus-visible:ring-4 focus-visible:ring-primary/15">
        <span className="truncate">{CATEGORY_LABELS[value]}</span>
        <ChevronDown className="ml-1 h-4 w-4 shrink-0 text-white/60 transition group-open:rotate-180" />
      </summary>
      <div className="absolute left-0 right-0 z-[999] mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E15]/85 p-1 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((key) => {
          const active = key === value;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                onChange(key);
                detailsRef.current?.removeAttribute("open");
              }}
              className={[
                "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition",
                active ? "bg-primary/15 text-primary" : "text-white/80 hover:bg-white/5 hover:text-white/90",
              ].join(" ")}
            >
              <span className="min-w-0 truncate">{CATEGORY_LABELS[key]}</span>
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

function buildDraft(event: Event): EventDetailRequest {
  return {
    title: event.title ?? "",
    description: event.description ?? "",
    venue: event.venue ?? "",
    startTime: event.startTime ?? "",
    endTime: event.endTime ?? "",
    type: event.type,
    posterUrl: event.posterUrl ?? "",
    longitude: event.longitude ?? null,
    latitude: event.latitude ?? null,
    endTimeAfterStartTime: true,
  };
}

export default function AdminEventDetail({ eventId }: { eventId: number }) {
  const queryClient = useQueryClient();
  const [overrides, setOverrides] = useState<Partial<EventDetailRequest>>({});
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [mapPickerCoordinate, setMapPickerCoordinate] = useState<Coordinate | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);
  const venueRef = useRef<HTMLInputElement>(null);
  const posterRef = useRef<HTMLInputElement>(null);
  const coordinateRef = useRef<HTMLInputElement>(null);
  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLDetailsElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  const eventQueryKey = ["admin", "events", "detail", eventId] as const;
  const eventQuery = useQuery({
    queryKey: eventQueryKey,
    queryFn: async () => {
      const res = await getEventById(eventId);
      if (!res.ok || !res.data) {
        throw new Error(res.message || "Không thể tải chi tiết sự kiện");
      }
      return res.data.result;
    },
    enabled: Number.isFinite(eventId) && eventId > 0,
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });

  const event = eventQuery.data ?? null;
  const baseDraft = useMemo(() => (event ? buildDraft(event) : null), [event]);
  const draft = useMemo(
    () => (baseDraft ? { ...baseDraft, ...overrides } : null),
    [baseDraft, overrides],
  );

  const statsQuery = useQuery({
    queryKey: ["admin", "events", "stats", eventId] as const,
    queryFn: () => getEventStats(eventId),
    enabled: Number.isFinite(eventId) && eventId > 0,
    refetchInterval: 5_000,
    staleTime: 5_000,
    refetchOnWindowFocus: false,
  });

  const audienceQuery = useQuery({
    queryKey: ["admin", "events", "audience", eventId] as const,
    queryFn: () => getEventAudiences(eventId),
    enabled: Number.isFinite(eventId) && eventId > 0,
    refetchInterval: 5_000,
    staleTime: 5_000,
    refetchOnWindowFocus: false,
  });

  const sortedZoneStats = useMemo(() => {
    const list = statsQuery.data?.zoneStats ?? [];
    return [...list].sort((a, b) => {
      const aNum = Number(a.zoneId);
      const bNum = Number(b.zoneId);
      if (Number.isFinite(aNum) && Number.isFinite(bNum)) return aNum - bNum;
      return String(a.zoneId).localeCompare(String(b.zoneId));
    });
  }, [statsQuery.data?.zoneStats]);

  const genderPieData = useMemo(() => {
    const genderStats = audienceQuery.data?.genderStats ?? [];
    return genderStats
      .filter((item) => Number(item?.count ?? 0) > 0)
      .map((item) => {
        const pct = clampPct(item.percentage);
        return {
          key: String(item.gender),
          name: genderLabel(String(item.gender)),
          value: Number(item.count) || 0,
          percentage: pct,
          color: genderColor(String(item.gender)),
        };
      });
  }, [audienceQuery.data?.genderStats]);

  const ageDistributionData = useMemo(() => {
    const ageStats = audienceQuery.data?.ageGroupStats ?? [];
    return ageStats
      .filter((item) => Number(item?.count ?? 0) > 0)
      .map((item) => ({
        key: String(item.ageGroup),
        label: ageGroupLabel(String(item.ageGroup)),
        percentage: clampPct(item.percentage),
      }));
  }, [audienceQuery.data?.ageGroupStats]);

  useEffect(() => {
    if (!editingField) return;
    const focusMap: Record<EditableField, () => void> = {
      title: () => titleRef.current?.focus(),
      venue: () => venueRef.current?.focus(),
      posterUrl: () => posterRef.current?.focus(),
      startTime: () => startRef.current?.focus(),
      endTime: () => endRef.current?.focus(),
      type: () => typeRef.current?.focus(),
      coordinates: () => coordinateRef.current?.focus(),
      description: () => descRef.current?.focus(),
    };
    focusMap[editingField]?.();
  }, [editingField]);

  const dirty = useMemo(() => {
    if (!baseDraft || !draft) return false;
    return (
      draft.title !== baseDraft.title ||
      draft.description !== baseDraft.description ||
      draft.venue !== baseDraft.venue ||
      draft.startTime !== baseDraft.startTime ||
      draft.endTime !== baseDraft.endTime ||
      draft.type !== baseDraft.type ||
      draft.posterUrl !== baseDraft.posterUrl ||
      draft.latitude !== baseDraft.latitude ||
      draft.longitude !== baseDraft.longitude
    );
  }, [baseDraft, draft]);

  const updateMutation = useMutation({
    mutationFn: async (nextDraft: EventDetailRequest) => {
      const start = nextDraft.startTime ? new Date(nextDraft.startTime).getTime() : NaN;
      const end = nextDraft.endTime ? new Date(nextDraft.endTime).getTime() : NaN;
      const endAfter = Number.isFinite(start) && Number.isFinite(end) ? end > start : true;

      return modifyEventDetail(eventId, {
        ...nextDraft,
        endTimeAfterStartTime: endAfter,
      });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(eventQueryKey, updated);
      queryClient.invalidateQueries({ queryKey: ["admin", "events", "list"] as const });
      setOverrides({});
      setEditingField(null);
      setLocalError(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (status: Event["status"]) => {
      return changeEventStatus(eventId, status);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(eventQueryKey, updated);
      queryClient.invalidateQueries({ queryKey: ["admin", "events", "list"] as const });
      setLocalError(null);
    },
  });

  const handleCancelEdit = () => {
    setOverrides({});
    setEditingField(null);
    setLocalError(null);
  };

  const openMapPicker = () => {
    const latitude = draft?.latitude;
    const longitude = draft?.longitude;
    const hasCoordinate =
      typeof latitude === "number" &&
      Number.isFinite(latitude) &&
      typeof longitude === "number" &&
      Number.isFinite(longitude);

    setMapPickerCoordinate(hasCoordinate ? { latitude, longitude } : null);
    setMapPickerOpen(true);
  };

  const applyMapPickerCoordinate = () => {
    if (!mapPickerCoordinate) return;
    setOverrides((current) => ({
      ...current,
      latitude: mapPickerCoordinate.latitude,
      longitude: mapPickerCoordinate.longitude,
    }));
    setEditingField("coordinates");
    setMapPickerOpen(false);
  };

  const handleSave = async () => {
    if (!draft) return;
    setLocalError(null);

    const start = draft.startTime ? new Date(draft.startTime).getTime() : NaN;
    const end = draft.endTime ? new Date(draft.endTime).getTime() : NaN;
    if (Number.isFinite(start) && Number.isFinite(end) && end <= start) {
      setLocalError("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return;
    }

    try {
      await updateMutation.mutateAsync(draft);
      setEditingField(null);
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Không thể lưu thay đổi.");
    }
  };

  const handleStart = async () => {
    if (!event) return;
    try {
      await statusMutation.mutateAsync("ON_SALE");
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Không thể khởi động sự kiện.");
    }
  };

  const handleCancelEvent = async () => {
    if (!event) return;
    if (!window.confirm("Bạn chắc chắn muốn hủy sự kiện này?")) return;
    try {
      await statusMutation.mutateAsync("ENDED");
    } catch (e) {
      setLocalError(e instanceof Error ? e.message : "Không thể hủy sự kiện.");
    }
  };

  if (!Number.isFinite(eventId) || eventId <= 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        ID sự kiện không hợp lệ.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {mapPickerOpen ? (
        <div className="fixed inset-0 z-[1200] bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="mx-auto flex h-full max-h-[760px] max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0E0E15] shadow-[0_24px_100px_rgba(0,0,0,0.65)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
              <div>
                <div className="font-[var(--font-display)] text-lg font-semibold tracking-tight">
                  Chọn tọa độ sự kiện
                </div>
                <div className="mt-1 text-sm text-white/55">
                  Click vào bản đồ để đặt marker vĩ độ/kinh độ.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMapPickerOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/7 hover:text-white/90"
                aria-label="Đóng bản đồ"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1">
              <LocationPickerMap
                coordinate={mapPickerCoordinate}
                onChange={setMapPickerCoordinate}
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-semibold text-white/65">
                {mapPickerCoordinate
                  ? `(${mapPickerCoordinate.latitude}, ${mapPickerCoordinate.longitude})`
                  : "Chưa chọn tọa độ"}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setMapPickerOpen(false)}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/75 transition hover:bg-white/7 hover:text-white/90"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={applyMapPickerCoordinate}
                  disabled={!mapPickerCoordinate}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-background shadow-[0_0_28px_rgba(124,58,237,0.35)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <MapPin className="h-4 w-4" />
                  Dùng tọa độ này
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/admin/events"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/7 hover:text-white/90"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="truncate font-[var(--font-display)] text-xl font-semibold tracking-tight">
              {eventQuery.isLoading ? "Đang tải..." : event?.title ?? "Sự kiện"}
            </div>
            {event ? (
              <div
                className={[
                  "rounded-xl border px-2.5 py-1 text-xs font-bold",
                  statusChipClass(event.status),
                ].join(" ")}
              >
                {STATUS_LABELS[event.status]}
              </div>
            ) : null}
          </div>
          <div className="mt-1 text-sm text-white/55">
            {event ? `ID: ${event.id}` : "—"}
          </div>
        </div>

        {event ? (
          <div className="flex flex-wrap items-center gap-3">
            {event.status === "DRAFT" ? (
              <Link
                href={`/admin/create-event?eventId=${event.id}&step=2`}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/7 hover:text-white/90"
              >
                <Armchair className="h-4 w-4" />
                Thêm khu vực ghế
              </Link>
            ) : null}
            {event.status === "DRAFT" ? (
              <button
                type="button"
                onClick={() => void handleStart()}
                disabled={statusMutation.isPending}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500/90 px-4 py-2.5 text-sm font-semibold text-[#0E0E15] transition hover:opacity-95 disabled:opacity-60"
              >
                <Check className="h-4 w-4" />
                Khởi động sự kiện
              </button>
            ) : null}
            {event.status !== "ENDED" ? (
              <button
                type="button"
                onClick={() => void handleCancelEvent()}
                disabled={statusMutation.isPending}
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/15 hover:text-rose-100 disabled:opacity-60"
              >
                <ShieldAlert className="h-4 w-4" />
                Hủy sự kiện
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {eventQuery.isError ? (
        <div className="rounded-3xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">
          {(eventQuery.error as Error | null)?.message || "Không thể tải chi tiết sự kiện."}
        </div>
      ) : null}

      {localError ? (
        <div className="rounded-3xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">
          {localError}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <GlassCard className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-[var(--font-display)] text-lg font-semibold tracking-tight">
                Thông tin sự kiện
              </div>
              <div className="mt-1 text-sm text-white/55">
                Bấm biểu tượng bút để chỉnh sửa, sau đó nhấn “Xác nhận”.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={!dirty || updateMutation.isPending}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/75 transition hover:bg-white/7 hover:text-white/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-4 w-4" />
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={!dirty || updateMutation.isPending}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-background shadow-[0_0_28px_rgba(124,58,237,0.35)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Check className="h-4 w-4" />
                Xác nhận
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold tracking-wide text-white/60">Tên sự kiện</div>
                  <button
                    type="button"
                    onClick={() => setEditingField("title")}
                    className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/7 hover:text-white/90"
                    aria-label="Chỉnh sửa tên"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
                {editingField === "title" ? (
                  <input
                    ref={titleRef}
                    value={draft?.title ?? ""}
                    onChange={(e) => setOverrides((c) => ({ ...c, title: e.target.value }))}
                    className="mt-3 h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/90 outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                  />
                ) : (
                  <div className="mt-3 text-sm font-semibold text-white/85">
                    {draft?.title || "—"}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold tracking-wide text-white/60">Thể loại</div>
                  <button
                    type="button"
                    onClick={() => setEditingField("type")}
                    className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/7 hover:text-white/90"
                    aria-label="Chỉnh sửa thể loại"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
                {editingField === "type" ? (
                  <CategoryDropdown
                    detailsRef={typeRef}
                    value={(draft?.type ?? "LIVE_MUSIC") as Category}
                    onChange={(nextType) => setOverrides((current) => ({ ...current, type: nextType }))}
                  />
                ) : (
                  <div className="mt-3 text-sm font-semibold text-white/85">
                    {draft ? CATEGORY_LABELS[draft.type] : "—"}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold tracking-wide text-white/60">Mô tả</div>
                <button
                  type="button"
                  onClick={() => setEditingField("description")}
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/7 hover:text-white/90"
                  aria-label="Chỉnh sửa mô tả"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
              {editingField === "description" ? (
                <textarea
                  ref={descRef}
                  value={draft?.description ?? ""}
                  onChange={(e) => setOverrides((c) => ({ ...c, description: e.target.value }))}
                  rows={5}
                  className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                />
              ) : (
                <div className="mt-3 whitespace-pre-wrap text-sm text-white/75">
                  {draft?.description || "—"}
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold tracking-wide text-white/60">Địa điểm</div>
                  <button
                    type="button"
                    onClick={() => setEditingField("venue")}
                    className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/7 hover:text-white/90"
                    aria-label="Chỉnh sửa địa điểm"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
                {editingField === "venue" ? (
                  <input
                    ref={venueRef}
                    value={draft?.venue ?? ""}
                    onChange={(e) => setOverrides((c) => ({ ...c, venue: e.target.value }))}
                    className="mt-3 h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/90 outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                  />
                ) : (
                  <div className="mt-3 text-sm font-semibold text-white/85">
                    {draft?.venue || "—"}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold tracking-wide text-white/60">Poster URL</div>
                  <button
                    type="button"
                    onClick={() => setEditingField("posterUrl")}
                    className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/7 hover:text-white/90"
                    aria-label="Chỉnh sửa poster"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
                {editingField === "posterUrl" ? (
                  <input
                    ref={posterRef}
                    value={draft?.posterUrl ?? ""}
                    onChange={(e) => setOverrides((c) => ({ ...c, posterUrl: e.target.value }))}
                    className="mt-3 h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/90 outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                  />
                ) : (
                  <div className="mt-3 truncate text-sm font-semibold text-white/85">
                    {draft?.posterUrl || "—"}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold tracking-wide text-white/60">Tọa độ</div>
                  <button
                    type="button"
                    onClick={() => setEditingField("coordinates")}
                    className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/7 hover:text-white/90"
                    aria-label="Chỉnh sửa tọa độ"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>

                {editingField === "coordinates" ? (
                  <div className="relative mt-3">
                    <input
                      ref={coordinateRef}
                      inputMode="decimal"
                      value={formatCoordinatePairInputValue(draft?.latitude, draft?.longitude)}
                      onChange={(e) => {
                        const next = parseCoordinatePairInput(e.target.value);
                        setOverrides((current) => ({
                          ...current,
                          latitude: next.latitude,
                          longitude: next.longitude,
                        }));
                      }}
                      placeholder="21.0285, 105.8542"
                      className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 pr-12 text-sm font-semibold text-white/90 outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                    />
                    <button
                      type="button"
                      onClick={openMapPicker}
                      className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-xl text-white/65 transition hover:bg-white/10 hover:text-white/90"
                      aria-label="Chọn trên bản đồ"
                    >
                      <MapPin className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 text-sm font-semibold text-white/85">
                    {formatCoordinatePairValue(draft?.latitude, draft?.longitude)}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold tracking-wide text-white/60">Bắt đầu</div>
                  <button
                    type="button"
                    onClick={() => setEditingField("startTime")}
                    className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/7 hover:text-white/90"
                    aria-label="Chỉnh sửa thời gian bắt đầu"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
                {editingField === "startTime" ? (
                  <input
                    ref={startRef}
                    type="datetime-local"
                    value={toDateTimeLocalValue(draft?.startTime ?? "")}
                    onChange={(e) =>
                      setOverrides((c) => ({
                        ...c,
                        startTime: toIsoFromDateTimeLocal(e.target.value),
                      }))
                    }
                    className="mt-3 h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/90 outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                  />
                ) : (
                  <div className="mt-3 text-sm font-semibold text-white/85">
                    {draft?.startTime ? formatDateTime(draft.startTime) : "—"}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold tracking-wide text-white/60">Kết thúc</div>
                  <button
                    type="button"
                    onClick={() => setEditingField("endTime")}
                    className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/7 hover:text-white/90"
                    aria-label="Chỉnh sửa thời gian kết thúc"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
                {editingField === "endTime" ? (
                  <input
                    ref={endRef}
                    type="datetime-local"
                    value={toDateTimeLocalValue(draft?.endTime ?? "")}
                    onChange={(e) =>
                      setOverrides((c) => ({
                        ...c,
                        endTime: toIsoFromDateTimeLocal(e.target.value),
                      }))
                    }
                    className="mt-3 h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/90 outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                  />
                ) : (
                  <div className="mt-3 text-sm font-semibold text-white/85">
                    {draft?.endTime ? formatDateTime(draft.endTime) : "—"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="font-[var(--font-display)] text-lg font-semibold tracking-tight">
              Poster
            </div>
            <div className="mt-4 aspect-video overflow-hidden rounded-3xl border border-white/10 bg-white/5">
              {draft?.posterUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.posterUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-sm text-white/45">
                  Chưa có poster
                </div>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="font-[var(--font-display)] text-lg font-semibold tracking-tight">
              Thao tác
            </div>

            <div className="mt-5 grid gap-3">
              {event?.status === "DRAFT" ? (
                <Link
                  href={`/admin/create-event?eventId=${event.id}&step=2`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/7 hover:text-white/90"
                >
                  <Armchair className="h-4 w-4" />
                  Thêm khu vực ghế
                </Link>
              ) : null}
              {event?.status === "DRAFT" ? (
                <button
                  type="button"
                  onClick={() => void handleStart()}
                  disabled={statusMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/90 px-4 py-3 text-sm font-semibold text-[#0E0E15] transition hover:opacity-95 disabled:opacity-60"
                >
                  <Check className="h-4 w-4" />
                  Khởi động sự kiện (ON_SALE)
                </button>
              ) : null}

              {event?.status !== "ENDED" ? (
                <button
                  type="button"
                  onClick={() => void handleCancelEvent()}
                  disabled={statusMutation.isPending}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/15 hover:text-rose-100 disabled:opacity-60"
                >
                  <ShieldAlert className="h-4 w-4" />
                  Hủy sự kiện (ENDED)
                </button>
              ) : null}
            </div>
          </GlassCard>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <div className="font-[var(--font-display)] text-lg font-semibold tracking-tight">
            Thống kê
          </div>
          {statsQuery.isError ? (
            <div className="mt-3 rounded-2xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-200">
              {(statsQuery.error as Error | null)?.message || "Không thể tải thống kê."}
            </div>
          ) : statsQuery.isLoading || !statsQuery.data ? (
            <div className="mt-4 grid gap-3">
              <div className="h-6 w-2/3 animate-pulse rounded bg-white/10" />
              <div className="h-24 w-full animate-pulse rounded-2xl bg-white/10" />
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-semibold tracking-wide text-white/60">Doanh thu</div>
                  <div className="mt-2 text-lg font-extrabold tracking-tight text-white/90">
                    {formatPriceVND(statsQuery.data.totalRevenue)}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-semibold tracking-wide text-white/60">Tổng ghế</div>
                  <div className="mt-2 text-lg font-extrabold tracking-tight text-white/90">
                    {statsQuery.data.totalSeats}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-semibold tracking-wide text-white/60">Lấp đầy</div>
                  <div className="mt-2 text-lg font-extrabold tracking-tight text-white/90">
                    {`${Math.round(clampPct(statsQuery.data.occupancyRate))}%`}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm font-semibold text-white/90">Tình trạng ghế</div>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs font-semibold tracking-wide text-white/60">Đã bán</div>
                    <div className="mt-2 text-base font-bold text-white/90">{statsQuery.data.soldSeats}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs font-semibold tracking-wide text-white/60">Đang giữ</div>
                    <div className="mt-2 text-base font-bold text-white/90">{statsQuery.data.lockedSeats}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs font-semibold tracking-wide text-white/60">Còn trống</div>
                    <div className="mt-2 text-base font-bold text-white/90">{statsQuery.data.availableSeats}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white/90">Theo khu</div>
                  <div className="text-xs font-semibold text-white/45">
                    {statsQuery.data.zoneStats?.length ?? 0} khu
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  {sortedZoneStats.map((z) => {
                    const pct = clampPct(z.occupancyRate);
                    return (
                      <div key={z.zoneId} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                aria-hidden
                                className="h-3 w-3 rounded-full border border-white/10"
                                style={{ backgroundColor: z.colorHex }}
                              />
                              <div className="truncate text-sm font-semibold text-white/90">{z.zoneName}</div>
                            </div>
                            <div className="mt-1 text-xs text-white/55">
                              {formatPriceVND(z.price)} • {z.soldSeats}/{z.totalSeats} ghế • Doanh thu:{" "}
                              <span className="font-semibold text-white/80">{formatPriceVND(z.revenue)}</span>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-lg font-extrabold tracking-tight text-white/90">
                              {`${Math.round(pct)}%`}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 h-2.5 w-full rounded-full bg-white/10">
                          <div
                            className="h-2.5 rounded-full shadow-[0_0_18px_rgba(255,255,255,0.10)] transition-[width]"
                            style={{
                              width: `${pct.toFixed(1)}%`,
                              backgroundColor: z.colorHex,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {!sortedZoneStats.length ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                      Chưa có thống kê theo khu.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <div className="font-[var(--font-display)] text-lg font-semibold tracking-tight">
            Khán giả
          </div>
          {audienceQuery.isError ? (
            <div className="mt-3 rounded-2xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-200">
              {(audienceQuery.error as Error | null)?.message || "Không thể tải thống kê khán giả."}
            </div>
          ) : audienceQuery.isLoading || !audienceQuery.data ? (
            <div className="mt-4 grid gap-3">
              <div className="h-6 w-1/2 animate-pulse rounded bg-white/10" />
              <div className="h-24 w-full animate-pulse rounded-2xl bg-white/10" />
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs font-semibold tracking-wide text-white/60">Tổng người mua</div>
                  <div className="mt-2 text-lg font-extrabold tracking-tight text-white/90">
                    {audienceQuery.data.totalBuyers}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
                  <div className="text-xs font-semibold tracking-wide text-white/60">Ghi chú</div>
                  <div className="mt-2 text-sm text-white/65">
                    Thống kê theo giới tính và nhóm tuổi (tính theo vé đã mua).
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/35 p-5">
                {genderPieData.length ? (
                  <div className="grid min-w-0 gap-6 md:grid-cols-[minmax(0,220px)_1fr] md:items-center">
                    <div className="min-w-0">
                      <ResponsiveContainer width="100%" aspect={1.15} minWidth={0} minHeight={180}>
                        <PieChart>
                          <Tooltip
                            contentStyle={{
                              background: "rgba(12, 12, 18, 0.95)",
                              border: "1px solid rgba(255,255,255,0.12)",
                              borderRadius: 12,
                              color: "rgba(255,255,255,0.92)",
                              fontSize: 12,
                            }}
                            formatter={(value: unknown, name: unknown, payload: unknown) => {
                              const val = typeof value === "number" ? value : Number(value);
                              const p = payload as { payload?: { percentage?: number } } | null;
                              const pct = clampPct(p?.payload?.percentage);
                              return [`${Number.isFinite(val) ? val : 0} • ${pct.toFixed(0)}%`, String(name)];
                            }}
                          />
                          <Pie
                            data={genderPieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={58}
                            outerRadius={86}
                            cornerRadius={2}
                            paddingAngle={3}
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth={1}
                          >
                            {genderPieData.map((item) => (
                              <Cell key={item.key} fill={item.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-3">
                      {genderPieData.map((item) => (
                        <div key={item.key} className="flex items-center justify-between gap-4 rounded-xl bg-white/[0.03] px-3 py-2">
                          <div className="flex items-center gap-3">
                            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-base font-extrabold uppercase tracking-wide text-white/90">
                              {item.name}
                            </span>
                          </div>
                          <span className="text-base font-extrabold text-white/90">{`${item.percentage.toFixed(0)}%`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                    Chưa có dữ liệu giới tính.
                  </div>
                )}

                <div className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-white/40">Phân bố độ tuổi</div>
                <div className="mt-4 space-y-4">
                  {ageDistributionData.map((item) => (
                    <div key={item.key}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-bold tracking-wide text-white/75">{item.label}</span>
                        <span className="text-lg font-black text-white">{`${item.percentage.toFixed(0)}%`}</span>
                      </div>
                      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/8">
                        <div
                          className="h-full rounded-full bg-emerald-400 transition-[width]"
                          style={{ width: `${item.percentage.toFixed(1)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {!ageDistributionData.length ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                      Chưa có dữ liệu nhóm tuổi.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
