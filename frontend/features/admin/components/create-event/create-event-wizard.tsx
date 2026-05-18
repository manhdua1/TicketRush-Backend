"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Plus,
  TicketCheck,
  Trash2,
} from "lucide-react";

import GlassCard from "@/features/admin/components/ui/glass-card";
import CreateEventSteps from "@/features/admin/components/create-event/create-event-steps";
import { createEvent } from "@/features/admin/services/create-event";
import { addEventZone } from "@/features/admin/services/add-event-zones";
import { changeEventStatus } from "@/features/admin/services/change-event-status";
import { getEventById } from "@/features/events/services/get-event-by-id";
import { CATEGORY_LABELS, type Category, type Event, type Zone } from "@/features/events/types";
import type { EventDetailRequest } from "@/features/admin/services/modify-event-detail";
import { formatPriceVND } from "@/features/events/utils/format-price";

type Step = 1 | 2 | 3 | 4;

type ZoneDraft = {
  id: string;
  name: string;
  price: number;
  totalRows: number;
  totalCols: number;
  colorHex: string;
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
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value)?.label ?? "";

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className={["relative z-[999]", className ?? ""].join(" ")}
    >
      <summary className="group flex h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/85 outline-none backdrop-blur-xl transition hover:bg-white/7 focus-visible:ring-4 focus-visible:ring-primary/15">
        <span className="truncate">{current}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-white/60 transition group-open:rotate-180" />
      </summary>
      <div className="absolute right-0 z-[999] mt-2 w-full min-w-[240px] overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E15]/85 p-1 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
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

function makeId() {
  const randomUUID = globalThis.crypto?.randomUUID;
  if (typeof randomUUID === "function") return randomUUID.call(globalThis.crypto);
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeZoneDraft(): ZoneDraft {
  return {
    id: makeId(),
    name: "Khu A",
    price: 200_000,
    totalRows: 6,
    totalCols: 10,
    colorHex: "#7C3AED",
  };
}

function isValidHexColor(input: string) {
  return /^#[0-9a-fA-F]{6}$/.test(input.trim());
}

function toIsoFromLocalDateTime(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
}

function formatLocalDateTime(value: string) {
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

function ZonePreview({ zone }: { zone: ZoneDraft | Zone }) {
  const rows = Math.max(1, Math.min(20, zone.totalRows));
  const cols = Math.max(1, Math.min(24, zone.totalCols));
  const total = zone.totalRows * zone.totalCols;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white/90">{zone.name}</div>
          {"price" in zone ? (
            <div className="mt-0.5 text-xs text-white/55">
              {formatPriceVND(zone.price)} • {total} ghế
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-4 w-4 rounded-full border border-white/10 shadow-[0_0_14px_rgba(255,255,255,0.08)]"
            style={{ backgroundColor: zone.colorHex }}
          />
          <span className="text-xs font-semibold text-white/55">{zone.colorHex}</span>
        </div>
      </div>

      <div className="mt-4 overflow-auto rounded-xl border border-white/10 bg-[#0E0E15]/35 p-3">
        <div
          className="grid gap-1 [--seat-size:0.95rem]"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, var(--seat-size)))` }}
        >
          {Array.from({ length: rows * cols }).map((_, index) => (
            <div
              key={index}
              className="h-(--seat-size) w-(--seat-size) rounded-[0.35rem] border border-white/10 bg-white/5"
              style={{ borderColor: zone.colorHex + "99" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CreateEventWizard() {
  const searchParams = useSearchParams();
  const eventIdFromQuery = useMemo(() => {
    const raw = searchParams?.get("eventId");
    const value = raw ? Number(raw) : NaN;
    return Number.isFinite(value) && value > 0 ? value : null;
  }, [searchParams]);

  const [step, setStep] = useState<Step>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [type, setType] = useState<Category>("LIVE_MUSIC");
  const [posterUrl, setPosterUrl] = useState("");
  const [startLocal, setStartLocal] = useState("");
  const [endLocal, setEndLocal] = useState("");

  const [createdEvent, setCreatedEvent] = useState<Event | null>(null);
  const [zones, setZones] = useState<ZoneDraft[]>(() => [makeZoneDraft()]);
  const [createdZones, setCreatedZones] = useState<Zone[] | null>(null);

  const categoryOptions = useMemo(
    () =>
      (Object.keys(CATEGORY_LABELS) as Category[]).map((key) => ({
        value: key,
        label: CATEGORY_LABELS[key],
      })),
    [],
  );

  const endAfterStart = useMemo(() => {
    if (!startLocal || !endLocal) return true;
    const start = new Date(startLocal).getTime();
    const end = new Date(endLocal).getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) return true;
    return end > start;
  }, [startLocal, endLocal]);

  const canSubmitStep1 = useMemo(() => {
    if (!title.trim()) return false;
    if (!description.trim()) return false;
    if (!venue.trim()) return false;
    if (!posterUrl.trim()) return false;
    if (!startLocal || !endLocal) return false;
    if (!endAfterStart) return false;
    return true;
  }, [title, description, venue, posterUrl, startLocal, endLocal, endAfterStart]);

  const canSubmitStep2 = useMemo(() => {
    if (!createdEvent?.id) return false;
    if (zones.length === 0) return false;
    return zones.every((z) => {
      if (!z.name.trim()) return false;
      if (!Number.isFinite(z.price) || z.price <= 0) return false;
      if (!Number.isInteger(z.totalRows) || z.totalRows <= 0) return false;
      if (!Number.isInteger(z.totalCols) || z.totalCols <= 0) return false;
      if (!isValidHexColor(z.colorHex)) return false;
      return true;
    });
  }, [createdEvent?.id, zones]);

  const isAddZonesMode = eventIdFromQuery != null;

  useEffect(() => {
    if (!eventIdFromQuery) return;
    if (createdEvent?.id === eventIdFromQuery) return;

    setError(null);
    setStep(2);

    void (async () => {
      const res = await getEventById(eventIdFromQuery);
      if (!res.ok || !res.data) {
        setError(res.message || "Không thể tải thông tin sự kiện");
        return;
      }
      setCreatedEvent(res.data.result);
    })();
  }, [createdEvent?.id, eventIdFromQuery]);

  const handleCreateEvent = async () => {
    setError(null);
    setBusy(true);
    try {
      const startTime = toIsoFromLocalDateTime(startLocal);
      const endTime = toIsoFromLocalDateTime(endLocal);

      const request: EventDetailRequest = {
        title: title.trim(),
        description: description.trim(),
        venue: venue.trim(),
        startTime,
        endTime,
        type,
        posterUrl: posterUrl.trim(),
        latitude: null,
        longitude: null,
        endTimeAfterStartTime: Boolean(startTime && endTime && new Date(endTime).getTime() > new Date(startTime).getTime()),
      };

      const created = await createEvent(request);
      setCreatedEvent(created);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tạo sự kiện. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  };

  const handleCreateZones = async () => {
    if (!createdEvent?.id) return;

    setError(null);
    setBusy(true);
    try {
      const resultZones: Zone[] = [];
      for (const zone of zones) {
        const createdZone = await addEventZone(String(createdEvent.id), {
          name: zone.name.trim(),
          price: zone.price,
          totalRows: zone.totalRows,
          totalCols: zone.totalCols,
          colorHex: zone.colorHex.trim(),
        });
        resultZones.push(createdZone);
      }
      setCreatedZones(resultZones);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tạo sơ đồ ghế. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  };

  const handlePublish = async () => {
    if (!createdEvent?.id) return;

    setError(null);
    setBusy(true);
    try {
      const updated = await changeEventStatus(createdEvent.id, "ON_SALE");
      setCreatedEvent(updated);
      setStep(4);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể mở bán sự kiện. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  };

  const resetAll = () => {
    setStep(1);
    setBusy(false);
    setError(null);
    setTitle("");
    setDescription("");
    setVenue("");
    setType("LIVE_MUSIC");
    setPosterUrl("");
    setStartLocal("");
    setEndLocal("");
    setCreatedEvent(null);
    setZones([makeZoneDraft()]);
    setCreatedZones(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="font-[var(--font-display)] text-xl font-semibold tracking-tight">
            Tạo sự kiện
          </div>
          <div className="mt-1 text-sm text-white/55">
            Hoàn thành 4 bước để mở bán sự kiện.
          </div>
        </div>

        <CreateEventSteps currentStep={step} />
      </div>

      {error ? (
        <div className="rounded-3xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {step === 1 ? (
        <GlassCard className="p-6">
          <div className="isolate grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <div className="text-xs font-semibold tracking-wide text-white/60">Tên sự kiện</div>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white/90 outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                    placeholder="Nhập tên sự kiện..."
                  />
                </label>
                <div className="space-y-2">
                  <div className="text-xs font-semibold tracking-wide text-white/60">Thể loại</div>
                  <FancyDropdown
                    value={type}
                    options={categoryOptions}
                    onChange={(v) => setType(v as Category)}
                  />
                </div>
              </div>

              <label className="space-y-2">
                <div className="text-xs font-semibold tracking-wide text-white/60">Mô tả</div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                  placeholder="Nhập mô tả sự kiện..."
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <div className="text-xs font-semibold tracking-wide text-white/60">Địa điểm</div>
                  <input
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white/90 outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                    placeholder="Nhập địa điểm tổ chức..."
                  />
                </label>
                <label className="space-y-2">
                  <div className="text-xs font-semibold tracking-wide text-white/60">Poster URL</div>
                  <input
                    value={posterUrl}
                    onChange={(e) => setPosterUrl(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white/90 outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                    placeholder="Nhập url poster..."
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <div className="text-xs font-semibold tracking-wide text-white/60">Thời gian bắt đầu</div>
                  <input
                    type="datetime-local"
                    value={startLocal}
                    onChange={(e) => setStartLocal(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/90 outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                  />
                </label>
                <label className="space-y-2">
                  <div className="text-xs font-semibold tracking-wide text-white/60">Thời gian kết thúc</div>
                  <input
                    type="datetime-local"
                    value={endLocal}
                    onChange={(e) => setEndLocal(e.target.value)}
                    className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/90 outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                  />
                </label>
              </div>

              {!endAfterStart ? (
                <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
                  Thời gian kết thúc phải sau thời gian bắt đầu.
                </div>
              ) : null}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={!canSubmitStep1 || busy}
                  onClick={() => void handleCreateEvent()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-background shadow-[0_0_28px_rgba(124,58,237,0.35)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Xác nhận & tạo sự kiện
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-semibold tracking-wide text-white/60">Xem trước poster</div>
                <div className="mt-3 aspect-video overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  {posterUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={posterUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-sm text-white/45">
                      Chưa có poster
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                <div className="font-semibold text-white/90">Gợi ý</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/60">
                  <li>Nhập URL ảnh poster (khuyến nghị 16:9).</li>
                  <li>Đảm bảo thời gian bắt đầu và kết thúc hợp lý.</li>
                  <li>Vị trí tổ chức sự kiện nên được nhập chính xác, rõ ràng</li>
                  <li>Sau bước này sẽ tạo sự kiện ở trạng thái nháp, admin có thể thêm khu vực ghế, khởi động sự kiện bất kỳ lúc nào</li>
                </ul>
              </div>
            </div>
          </div>
        </GlassCard>
      ) : null}

      {step === 2 ? (
        <GlassCard className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="font-[var(--font-display)] text-lg font-semibold tracking-tight">
                Sơ đồ ghế
              </div>
              <div className="mt-1 text-sm text-white/55">
                Tạo các khu vực ghế cho sự kiện.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setZones((current) => [...current, makeZoneDraft()])}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/7 hover:text-white/90"
            >
              <Plus className="h-4 w-4" />
              Thêm khu vực
            </button>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-4">
              {zones.map((zone, index) => (
                <div key={zone.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-white/90">
                      Khu vực {index + 1}
                    </div>
                    <button
                      type="button"
                      onClick={() => setZones((current) => current.filter((z) => z.id !== zone.id))}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-200"
                      disabled={zones.length <= 1}
                      title={zones.length <= 1 ? "Cần ít nhất 1 khu vực" : "Xoá khu vực"}
                    >
                      <Trash2 className="h-4 w-4" />
                      Xoá
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2">
                      <div className="text-xs font-semibold tracking-wide text-white/60">Tên khu</div>
                      <input
                        value={zone.name}
                        onChange={(e) =>
                          setZones((current) =>
                            current.map((z) => (z.id === zone.id ? { ...z, name: e.target.value } : z)),
                          )
                        }
                        className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white/90 outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                        placeholder="Nhập tên zone..."
                      />
                    </label>

                    <label className="space-y-2">
                      <div className="text-xs font-semibold tracking-wide text-white/60">Giá vé</div>
                      <input
                        inputMode="numeric"
                        value={zone.price}
                        onChange={(e) => {
                          const next = Number(String(e.target.value).replace(/[^\d]/g, ""));
                          setZones((current) =>
                            current.map((z) => (z.id === zone.id ? { ...z, price: Number.isFinite(next) ? next : 0 } : z)),
                          );
                        }}
                        className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/90 outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                        placeholder="Nhập giá ghế..."
                      />
                      <div className="text-xs text-white/45">{formatPriceVND(zone.price)}</div>
                    </label>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <label className="space-y-2">
                      <div className="text-xs font-semibold tracking-wide text-white/60">Hàng</div>
                      <input
                        type="number"
                        min={1}
                        value={zone.totalRows}
                        onChange={(e) => {
                          const next = Math.max(1, Number(e.target.value || 1));
                          setZones((current) =>
                            current.map((z) => (z.id === zone.id ? { ...z, totalRows: Math.floor(next) } : z)),
                          );
                        }}
                        className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/90 outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                      />
                    </label>

                    <label className="space-y-2">
                      <div className="text-xs font-semibold tracking-wide text-white/60">Cột</div>
                      <input
                        type="number"
                        min={1}
                        value={zone.totalCols}
                        onChange={(e) => {
                          const next = Math.max(1, Number(e.target.value || 1));
                          setZones((current) =>
                            current.map((z) => (z.id === zone.id ? { ...z, totalCols: Math.floor(next) } : z)),
                          );
                        }}
                        className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/90 outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                      />
                    </label>

                    <label className="space-y-2">
                      <div className="text-xs font-semibold tracking-wide text-white/60">Màu</div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={isValidHexColor(zone.colorHex) ? zone.colorHex : "#7C3AED"}
                          onChange={(e) =>
                            setZones((current) =>
                              current.map((z) => (z.id === zone.id ? { ...z, colorHex: e.target.value } : z)),
                            )
                          }
                          className="h-11 w-11 cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-1"
                          aria-label="Chọn màu"
                        />
                        <input
                          value={zone.colorHex}
                          onChange={(e) =>
                            setZones((current) =>
                              current.map((z) => (z.id === zone.id ? { ...z, colorHex: e.target.value } : z)),
                            )
                          }
                          className="h-11 min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white/90 outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                          placeholder="Nhập mã màu hex..."
                        />
                      </div>
                      {!isValidHexColor(zone.colorHex) ? (
                        <div className="text-xs text-amber-200/90">Mã màu phải theo dạng #RRGGBB.</div>
                      ) : null}
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="text-sm font-semibold text-white/90">Xem trước</div>
                <div className="mt-3 space-y-3">
                  {zones.map((zone) => (
                    <ZonePreview key={zone.id} zone={zone} />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <Link
                  href={isAddZonesMode ? `/admin/events/${eventIdFromQuery}` : "/admin/overview"}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/75 transition hover:bg-white/7 hover:text-white/90"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {isAddZonesMode ? "Về chi tiết sự kiện" : "Về tổng quan"}
                </Link>
                <button
                  type="button"
                  disabled={!canSubmitStep2 || busy}
                  onClick={() => void handleCreateZones()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-background shadow-[0_0_28px_rgba(124,58,237,0.35)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Xác nhận & tạo khu ghế
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      ) : null}

      {step === 3 ? (
        <GlassCard className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="font-[var(--font-display)] text-lg font-semibold tracking-tight">
                Kiểm tra
              </div>
              <div className="mt-1 text-sm text-white/55">
                Xác nhận lại thông tin trước khi mở bán.
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm font-semibold text-white/90">Thông tin sự kiện</div>
                <div className="mt-3 grid gap-3 text-sm text-white/70">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-white/55">Tên</span>
                    <span className="font-semibold text-white/90">{createdEvent?.title}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-white/55">Địa điểm</span>
                    <span className="font-semibold text-white/90">{createdEvent?.venue}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-white/55">Bắt đầu</span>
                    <span className="font-semibold text-white/90">{formatLocalDateTime(createdEvent?.startTime ?? "")}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-white/55">Kết thúc</span>
                    <span className="font-semibold text-white/90">{formatLocalDateTime(createdEvent?.endTime ?? "")}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm font-semibold text-white/90">Khu ghế</div>
                <div className="mt-3 space-y-3">
                  {(createdZones ?? createdEvent?.zones ?? []).length ? (
                    (createdZones ?? createdEvent?.zones ?? []).map((zone) => (
                      <ZonePreview key={zone.id} zone={zone} />
                    ))
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                      Chưa có khu ghế.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs font-semibold tracking-wide text-white/60">Poster</div>
                <div className="mt-3 aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                  {createdEvent?.posterUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={createdEvent.posterUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-sm text-white/45">—</div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                <div className="flex items-start gap-3">
                  <TicketCheck className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold text-white/90">Mở bán</div>
                    <div className="mt-1 text-sm text-white/60">
                      Khi xác nhận, sự kiện sẽ chuyển sang trạng thái <span className="font-semibold text-white/85">ON_SALE</span>.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={busy || !createdEvent?.id}
                  onClick={() => void handlePublish()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-background shadow-[0_0_28px_rgba(124,58,237,0.35)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Xác nhận & mở bán
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      ) : null}

      {step === 4 ? (
        <GlassCard className="p-10">
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <div className="relative">
              <div aria-hidden className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
              <div className="relative grid h-20 w-20 place-items-center rounded-full border border-primary/30 bg-white/5">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
            </div>
            <div className="mt-5 font-[var(--font-display)] text-2xl font-semibold tracking-tight">
              Tạo sự kiện thành công
            </div>
            <div className="mt-2 text-sm text-white/60">
              Sự kiện <span className="font-semibold text-white/85">{createdEvent?.title}</span> đã được mở bán.
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={resetAll}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/7 hover:text-white/90"
              >
                <Plus className="h-4 w-4" />
                Tạo sự kiện khác
              </button>
              <Link
                href="/admin/events"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-background shadow-[0_0_28px_rgba(124,58,237,0.35)] transition hover:opacity-95"
              >
                <ArrowRight className="h-4 w-4" />
                Xem danh sách sự kiện
              </Link>
            </div>
          </div>
        </GlassCard>
      ) : null}
    </div>
  );
}
