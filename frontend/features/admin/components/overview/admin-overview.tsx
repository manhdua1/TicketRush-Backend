"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

import GlassCard from "@/features/admin/components/ui/glass-card";
import RevenueTrendsChart, {
  type RevenuePeriod,
} from "@/features/admin/components/overview/revenue-trends-chart";
import TopEventsList from "@/features/admin/components/overview/top-events-list";
import { getOnSaleSeatSummary } from "@/features/admin/services/get-on-sale-seat-summary";
import { getRevenueTrend } from "@/features/admin/services/get-revenue-trend";
import { getTotalEventsOnSale } from "@/features/admin/services/get-total-events-on-sale";
import { getTotalRevenue } from "@/features/admin/services/get-total-revenue";
import { formatPriceVND } from "@/features/events/utils/format-price";

function Sparkline({
  values,
}: {
  values: number[];
}) {
  const path = useMemo(() => {
    if (values.length < 2) return "";

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const w = 110;
    const h = 42;

    const points = values.map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return { x, y };
    });

    return points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");
  }, [values]);

  return (
    <svg width="110" height="42" viewBox="0 0 110 42" className="overflow-visible">
      <defs>
        <linearGradient id="pulseSpark" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7C3AED" stopOpacity="0.35" />
          <stop offset="1" stopColor="#7C3AED" stopOpacity="0.95" />
        </linearGradient>
        <filter id="pulseSparkGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#7C3AED" floodOpacity="0.6" />
        </filter>
      </defs>
      <path
        d={path}
        fill="none"
        stroke="url(#pulseSpark)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#pulseSparkGlow)"
      />
    </svg>
  );
}

export default function AdminOverview() {
  const [period, setPeriod] = useState<RevenuePeriod>("DAY");
  const totalRevenueQuery = useQuery({
    queryKey: ["admin", "kpi", "total-revenue"] as const,
    queryFn: getTotalRevenue,
    refetchInterval: 5_000,
  });

  const totalEventsOnSaleQuery = useQuery({
    queryKey: ["admin", "kpi", "events-on-sale"] as const,
    queryFn: getTotalEventsOnSale,
    refetchInterval: 5_000,
  });

  const seatSummaryQuery = useQuery({
    queryKey: ["admin", "kpi", "seat-summary"] as const,
    queryFn: getOnSaleSeatSummary,
    refetchInterval: 5_000,
  });

  const trendQuery = useQuery({
    queryKey: ["admin", "charts", "revenue-trend", period] as const,
    queryFn: () => getRevenueTrend(period),
    refetchInterval: 5_000,
  });

  const totalRevenue = totalRevenueQuery.data?.result ?? null;
  const totalEventsOnSale = totalEventsOnSaleQuery.data?.result ?? null;
  const seatSummary = seatSummaryQuery.data?.results ?? null;
  const trend = trendQuery.data?.result ?? null;

  const trendValues = useMemo(() => {
    return trend?.points.map((p) => p.revenue) ?? [];
  }, [trend]);

  const fillRate = seatSummary?.soldRate ?? null;
  const fillRatePct = fillRate == null ? null : Math.max(0, Math.min(100, fillRate));

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.08, delayChildren: 0.04 },
          },
        }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        <motion.div
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          className="h-full"
        >
          <GlassCard className="flex h-full flex-col p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-[var(--font-display)] text-sm font-semibold text-white/70">
                  Tổng doanh thu
                </div>
                <div className="mt-2 text-4xl font-extrabold tracking-tight">
                  {typeof totalRevenue === "number" ? formatPriceVND(totalRevenue) : "—"}
                </div>
              </div>
              <div className="pt-1">
                <Sparkline values={trendValues.length ? trendValues : [10, 12, 8, 14, 11, 18, 16]} />
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          className="h-full"
        >
          <GlassCard className="flex h-full flex-col p-6">
            <div className="font-[var(--font-display)] text-sm font-semibold text-white/70">
              Sự kiện đang mở bán
            </div>
            <div className="mt-2 text-4xl font-extrabold tracking-tight">
              {typeof totalEventsOnSale === "number" ? totalEventsOnSale : 14}
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          className="h-full"
        >
          <GlassCard className="flex h-full flex-col p-6">
            <div className="font-[var(--font-display)] text-sm font-semibold text-white/70">
              Tỉ lệ lấp đầy ghế
            </div>
            <div className="mt-2 text-4xl font-extrabold tracking-tight">
              {fillRatePct == null ? "86%" : `${Math.round(fillRatePct)}%`}
            </div>
            <div className="mt-5">
              <div className="h-2.5 w-full rounded-full bg-white/10">
                <div
                  className="h-2.5 rounded-full bg-primary shadow-[0_0_18px_rgba(124,58,237,0.35)] transition-[width]"
                  style={{ width: `${(fillRatePct ?? 86).toFixed(1)}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-white/55">
                {fillRatePct == null
                  ? "Đang tải dữ liệu..."
                  : `${seatSummary!.soldSeats} ghế đã bán`}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>

      <GlassCard className="p-6">
        <RevenueTrendsChart period={period} onPeriodChange={setPeriod} data={trend} />
      </GlassCard>

      <GlassCard className="p-6">
        <TopEventsList />
      </GlassCard>
    </div>
  );
}
