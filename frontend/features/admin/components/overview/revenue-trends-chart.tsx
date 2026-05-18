"use client";

import { useMemo, useRef } from "react";
import { ChevronDown } from "lucide-react";
import {
  Area,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
} from "recharts";
import { formatPriceVND } from "@/features/events/utils/format-price";

export type RevenuePeriod = "DAY" | "WEEK" | "MONTH";

type RevenuePoint = {
  label: string;
  startTime: string;
  endTime: string;
  revenue: number;
};

export type RevenueTrendData = {
  period: string;
  totalRevenue: number;
  points: RevenuePoint[];
};

function formatCompactMoney(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
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

function CustomDot({ cx, cy }: { cx?: number; cy?: number }) {
  if (typeof cx !== "number" || typeof cy !== "number") return null;

  return (
    <g filter="url(#pulseDotGlow)">
      <circle cx={cx} cy={cy} r={5.5} fill="#0E0E15" stroke="#7C3AED" strokeWidth={2.5} />
      <circle cx={cx} cy={cy} r={2.2} fill="#7C3AED" />
    </g>
  );
}

export default function RevenueTrendsChart({
  period,
  onPeriodChange,
  data,
}: {
  period: RevenuePeriod;
  onPeriodChange: (period: RevenuePeriod) => void;
  data: RevenueTrendData | null;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const periodLabel =
    period === "DAY"
      ? "24 giờ gần đây"
      : period === "WEEK"
        ? "7 ngày gần đây"
        : "30 ngày gần đây";

  const chartData = useMemo(() => {
    const points = data?.points ?? [];
    return points.map((p) => ({
      label: p.label,
      revenue: p.revenue,
      startTime: p.startTime,
      endTime: p.endTime,
    }));
  }, [data]);

  return (
    <div className="isolate flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-[var(--font-display)] text-lg font-semibold tracking-tight">
            Xu hướng doanh thu
          </div>
          <div className="mt-1 text-sm text-white/55">
            {periodLabel}
          </div>
        </div>

        <details ref={detailsRef} className="relative z-[999]">
          <summary className="group flex h-10 cursor-pointer list-none items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-sm font-semibold text-foreground/90 outline-none backdrop-blur-xl transition hover:bg-white/7 focus-visible:ring-4 focus-visible:ring-primary/15">
            {periodLabel}
            <ChevronDown className="ml-1 h-4 w-4 text-white/60 transition group-open:rotate-180" />
          </summary>
          <div className="absolute right-0 z-[999] mt-2 w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#0E0E15]/85 p-1 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            {(
              [
                { value: "DAY" as const, label: "24 giờ gần đây" },
                { value: "WEEK" as const, label: "7 ngày gần đây" },
                { value: "MONTH" as const, label: "30 ngày gần đây" },
              ] satisfies Array<{ value: RevenuePeriod; label: string }>
            ).map((option) => {
              const active = option.value === period;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onPeriodChange(option.value);
                    detailsRef.current?.removeAttribute("open");
                  }}
                  className={[
                    "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition",
                    active ? "bg-primary/15 text-primary" : "text-white/80 hover:bg-white/5 hover:text-white/90",
                  ].join(" ")}
                >
                  <span>{option.label}</span>
                  {active ? (
                    <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_rgba(124,58,237,0.65)]" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </details>
      </div>

      <div className="relative z-0 w-full min-w-0">
        <ResponsiveContainer width="100%" height={340}>
          <ComposedChart data={chartData} margin={{ top: 12, right: 18, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="pulseArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#7C3AED" stopOpacity={0.30} />
                <stop offset="1" stopColor="#7C3AED" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="pulseStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#A78BFA" stopOpacity={0.65} />
                <stop offset="1" stopColor="#7C3AED" stopOpacity={1} />
              </linearGradient>
              <filter id="pulseLineGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#7C3AED" floodOpacity="0.45" />
              </filter>
              <filter id="pulseDotGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="4.5" floodColor="#7C3AED" floodOpacity="0.55" />
              </filter>
            </defs>

            <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 6" />
            <XAxis
              dataKey="label"
              tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatCompactMoney}
              width={48}
            />

            <Tooltip
              cursor={{ stroke: "rgba(124,58,237,0.25)", strokeWidth: 1 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const row = payload[0]?.payload as {
                  label?: string;
                  startTime?: string;
                  endTime?: string;
                  revenue?: number;
                };

                const revenue =
                  typeof row.revenue === "number" ? row.revenue : Number(row.revenue ?? 0);

                return (
                  <div className="w-72 rounded-2xl border border-white/10 bg-[#0E0E15]/85 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl">
                    <div className="text-xs font-semibold text-white/80">
                      {typeof row.label === "string" ? row.label : "Doanh thu"}
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-white/70">
                      <div>
                        <span className="text-white/55">Từ:</span>{" "}
                        {formatDateTime(String(row.startTime ?? ""))}
                      </div>
                      <div>
                        <span className="text-white/55">Đến:</span>{" "}
                        {formatDateTime(String(row.endTime ?? ""))}
                      </div>
                      <div className="pt-1 text-sm font-bold text-white/90">
                        <span className="text-xs font-semibold text-white/55">Doanh thu:</span>{" "}
                        {formatPriceVND(revenue)}
                      </div>
                    </div>
                  </div>
                );
              }}
            />

            <Area
              type="linear"
              dataKey="revenue"
              fill="url(#pulseArea)"
              stroke="none"
              isAnimationActive
            />
            <Line
              type="linear"
              dataKey="revenue"
              stroke="url(#pulseStroke)"
              strokeWidth={3}
              dot={<CustomDot />}
              activeDot={{ r: 7, fill: "#7C3AED", stroke: "#C4B5FD", strokeWidth: 2, filter: "url(#pulseDotGlow)" }}
              filter="url(#pulseLineGlow)"
              isAnimationActive
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
