"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Clock, Zap } from "lucide-react";
import type { Event } from "@/features/events/types";

/* ──────────────────────────────────────────────────────────
   Helpers
────────────────────────────────────────────────────────── */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTimeLeft(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { days, hours, minutes, seconds };
}

/* ──────────────────────────────────────────────────────────
   Countdown unit
────────────────────────────────────────────────────────── */
function CountUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/8 px-4 py-2.5 text-center backdrop-blur-md">
        <AnimatePresence mode="wait">
          <motion.span
            key={value}
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="block min-w-[2ch] text-3xl font-extrabold tabular-nums leading-none text-foreground sm:text-4xl"
          >
            {String(value).padStart(2, "0")}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/55">
        {label}
      </span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Spotlight Hero (with real event data)
────────────────────────────────────────────────────────── */
function SpotlightHero({ event }: { event: Event }) {
  const [timeLeft, setTimeLeft] = useState(() => ({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  }));

  useEffect(() => {
    const tick = () => setTimeLeft(getTimeLeft(event.startTime));
    tick(); // ensure we update immediately after mount (client only)
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [event.startTime]);

  return (
    <section className="relative min-h-[88vh] overflow-hidden flex items-end pb-16 sm:pb-24">
      {/* BG image */}
      <div className="absolute inset-0 -z-10">
        <Image
          src={event.posterUrl || "/events/event-1.svg"}
          alt={event.title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          style={{ transform: "translateZ(0)" }}
        />
        {/* layered dark gradient */}
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/70 to-background/20" />
        <div className="absolute inset-0 bg-linear-to-r from-background/90 via-background/40 to-transparent" />
        {/* ambient purple glow */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 60% at 15% 80%, rgba(124,58,237,0.28) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-2xl"
        >
          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/35 bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-primary backdrop-blur-sm">
            <Zap className="h-3 w-3" />
            Spotlight Event
          </span>

          {/* Title */}
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            {event.title}
          </h1>

          {/* Meta */}
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-foreground/70">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-primary/80" />
              {formatDate(event.startTime)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary/80" />
              {formatTime(event.startTime)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary/80" />
              {event.venue}
            </span>
          </div>

          {/* Countdown */}
          <div className="mt-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-foreground/45">
              Sự kiện bắt đầu sau
            </p>
            <div className="flex items-start gap-3">
              <CountUnit value={timeLeft.days} label="Ngày" />
              <span className="mt-3 text-2xl font-bold text-foreground/30">:</span>
              <CountUnit value={timeLeft.hours} label="Giờ" />
              <span className="mt-3 text-2xl font-bold text-foreground/30">:</span>
              <CountUnit value={timeLeft.minutes} label="Phút" />
              <span className="mt-3 text-2xl font-bold text-foreground/30">:</span>
              <CountUnit value={timeLeft.seconds} label="Giây" />
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/events/${event.id}`}
              className="inline-flex h-12 items-center justify-center rounded-full bg-linear-to-r from-primary to-secondary px-7 text-sm font-bold text-white shadow-[0_0_30px_rgba(124,58,237,0.38)] transition hover:scale-[1.03] hover:shadow-[0_0_44px_rgba(124,58,237,0.48)] active:scale-[0.98]"
            >
              Mua Vé Ngay
            </Link>
            <Link
              href={`/events/${event.id}`}
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 bg-white/8 px-7 text-sm font-semibold text-foreground backdrop-blur-md transition hover:bg-white/14 hover:scale-[1.02] active:scale-[0.98]"
            >
              Xem Chi Tiết
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────
   Fallback Hero (no spotlight)
────────────────────────────────────────────────────────── */
function FallbackHero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_25%,rgba(124,58,237,0.22)_0%,rgba(14,14,21,0)_62%)]"
      />
      <div className="mx-auto flex max-w-6xl flex-col items-center px-4 pb-20 pt-14 text-center sm:px-6 sm:pb-24 sm:pt-16 lg:px-8">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-4xl text-balance text-4xl font-extrabold tracking-tight sm:text-6xl"
        >
          <span className="text-foreground">Đừng Bỏ Lỡ Các</span>{" "}
          <span className="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent box-decoration-clone">
            Sự Kiện Hấp Dẫn!
          </span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.16 }}
          className="mt-9 flex items-center justify-center gap-3"
        >
          <a
            href="#trending"
            className="inline-flex h-11 items-center justify-center rounded-full bg-linear-to-r from-primary to-secondary px-6 text-sm font-semibold text-white shadow-[0_0_26px_rgba(124,58,237,0.30)] transition hover:scale-[1.02] hover:shadow-[0_0_38px_rgba(124,58,237,0.40)] active:scale-[0.99]"
          >
            Mua Vé Ngay
          </a>
          <Link
            href="/events"
            className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-surface/40 px-6 text-sm font-semibold text-foreground/90 backdrop-blur-xl transition hover:bg-surface/60 hover:scale-[1.02] active:scale-[0.99]"
          >
            Khám phá
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────
   Export
────────────────────────────────────────────────────────── */
export default function Hero({ spotlightEvent }: { spotlightEvent: Event | null }) {
  if (spotlightEvent && spotlightEvent.id) {
    return <SpotlightHero event={spotlightEvent} />;
  }
  return <FallbackHero />;
}
