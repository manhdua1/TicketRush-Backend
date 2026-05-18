"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";

import EventCard, { type EventCardData } from "@/features/events/components/event-card";
import type { Event } from "@/features/events/types";
import { useGetEventById } from "@/features/events/hooks/use-get-event-by-id";
import { useRelatedEvents } from "@/features/events/hooks/use-related-events";
import { formatIsoToDobDisplay } from "@/features/auth/utils/date-of-birth";
import { formatPriceVND } from "@/features/events/utils/format-price";
import { checkQueue } from "@/features/queue/services/check_queue";
import { sendHeartBeat } from "@/features/queue/services/heartbeat_queue";

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
    priceFrom:
      minPrice === null ? "Liên hệ" : `Từ ${formatVnd(minPrice)}`,
    imageSrc: event.posterUrl || "default-poster.svg",
  };
}

export default function EventDetailScreen({ eventId }: { eventId: number }) {
  const [isHoveringImage, setIsHoveringImage] = useState(false);
  const [isHoveringDetailZone, setIsHoveringDetailZone] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isCheckingQueue, setIsCheckingQueue] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const router = useRouter();

  // When queue grants access → navigate to booking
  // When queue expires → show error, hide queue screen
  useEffect(() => {
    if (false) {
      setQueueError("Hết thời gian chờ. Vui lòng thử lại.");
    }
  }, []);

  useEffect(() => {
    if (!Number.isFinite(eventId) || eventId <= 0) return;

    void sendHeartBeat(eventId);
    const heartbeatId = window.setInterval(() => {
      void sendHeartBeat(eventId);
    }, 25_000);

    return () => window.clearInterval(heartbeatId);
  }, [eventId]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const updateViewport = () => {
      setIsDesktop(mediaQuery.matches);
    };

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);

    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  const showDetail = !isDesktop || !isHoveringImage || isHoveringDetailZone;
  
  const { event, loading } = useGetEventById(eventId);

  const {
    events: relatedEvents,
    totalPages,
    currentPage,
    isFirst,
    isLast,
    loading: relatedLoading,
    error: relatedError,
    goToNextPage,
    goToPrevPage,
  } = useRelatedEvents(eventId, event?.type);

  const heroImageSrc = event?.posterUrl ?? "/events/event-1.svg";

  const EventMap = dynamic(() => import("./event-map"), { ssr: false });
  
  const formattedDate = event?.startTime 
    ? formatIsoToDobDisplay(new Date(event.startTime).toISOString().slice(0, 10))
    : "--";
  
  const minPrice = event?.zones && event.zones.length > 0
    ? Math.min(...event.zones.map(z => z.price))
    : undefined;
  const bookingHref = `/events/${eventId}/booking`;

  const handleBuyTicket = async () => {
    setQueueError(null);
    setIsCheckingQueue(true);

    await sendHeartBeat(eventId);
    const result = await checkQueue(eventId);
    setIsCheckingQueue(false);

    if (!result.ok) {
      setQueueError(result.message || "Khong the kiem tra hang cho. Vui long thu lai.");
      return;
    }

    router.push(result.required ? `/events/${eventId}/queue` : bookingHref);
  };

  return (
    <>
    <div className="pb-16">
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="relative overflow-hidden rounded-[2.25rem] border border-border bg-surface/30 shadow-[0_26px_120px_rgba(0,0,0,0.55)]"
          >
            <div
              className="relative aspect-video w-full overflow-hidden rounded-[2.25rem]"
              onMouseEnter={() => isDesktop && setIsHoveringImage(true)}
              onMouseLeave={() => isDesktop && setIsHoveringImage(false)}
            >
              {loading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-surface/20">
                  <motion.div 
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="h-full w-full bg-linear-to-r from-transparent via-white/5 to-transparent"
                  />
                </div>
              )}
              <Image
                src={heroImageSrc}
                alt="Poster sự kiện"
                fill
                sizes="(max-width: 1024px) 100vw, 1280px"
                className={`object-cover transition-opacity duration-700 ${loading ? 'opacity-0' : 'opacity-100'}`}
                priority
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-linear-to-t from-background/85 via-background/15 to-transparent"
              />
            </div>
          </motion.div>
          <motion.aside
            initial={{ opacity: 0, x: -14, y: 8 }}
            animate={{
              opacity: showDetail ? 1 : 0,
              y: showDetail ? 0 : 12,
              scale: showDetail ? 1 : 0.98,
            }}
            transition={{ duration: 0.55, ease: "easeOut", delay: 0.05 }}
            className="
              mt-6 max-w-xl rounded-3xl
              border border-border bg-surface/55 p-6
              shadow-[0_20px_80px_rgba(0,0,0,0.40)]
              backdrop-blur-xl
              lg:absolute lg:bottom-10 lg:left-10
            "
            onMouseEnter={() => setIsHoveringDetailZone(true)}
            onMouseLeave={() => setIsHoveringDetailZone(false)}
            onFocusCapture={() => setIsHoveringDetailZone(true)}
            onBlurCapture={() => setIsHoveringDetailZone(false)}
            onTouchStart={() => setIsHoveringDetailZone(true)}
          >
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              {loading ? "Đang tải..." : event?.title ?? "Sự kiện"}
            </h1>

            <div className="mt-4 space-y-2 text-sm text-foreground/75">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary/85" />
                <span>{event ? `${new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${new Date(event.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "--"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary/85" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary/85" />
                <span className="leading-relaxed">{event?.venue ?? 'Địa điểm chưa xác định'}</span>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-sm font-semibold text-foreground/85">
                {minPrice !== undefined ? `Giá vé từ ${formatPriceVND(minPrice)}` : 'Giá vé'}
              </div>
              {queueError && (
                <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                  {queueError}
                </div>
              )}
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                onClick={handleBuyTicket}
                disabled={isCheckingQueue}
                className="cursor-pointer mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-linear-to-r from-primary to-secondary text-sm font-bold text-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.06)] outline-none transition focus:ring-4 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  boxShadow:
                    "0 0 0 1px rgba(255,255,255,0.06), 0 22px 70px color-mix(in srgb, var(--primary) 20%, transparent)",
                }}
              >
                {isCheckingQueue ? "Dang kiem tra..." : "Mua vé ngay"}
              </motion.button>
            </div>
          </motion.aside>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-surface/45 p-6 shadow-[0_18px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-10">
          <h2 className="text-2xl font-extrabold tracking-tight">Giới thiệu</h2>

          <div className="mt-4 space-y-4 text-sm leading-relaxed text-foreground/75">
            <p className="whitespace-pre-wrap">{event?.description ?? "Không có phần mô tả cho sự kiện này."}</p>
          </div>
        </div>

        {/* Separate map container with its own border */}
        <div className="mt-6 rounded-3xl border border-border bg-surface/45 p-4 shadow-[0_18px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-6">
          <h3 className="text-lg font-semibold">Địa điểm</h3>
          {event?.latitude && event?.longitude ? (
            <div className="mt-4 h-96 w-full overflow-hidden rounded-2xl">
              <EventMap lat={event.latitude} lng={event.longitude} title={event.title} />
            </div>
          ) : (
            <div className="mt-4 text-sm text-foreground/60">Địa điểm chưa có tọa độ.</div>
          )}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              Có thể bạn cũng thích
            </h2>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goToPrevPage}
                disabled={isFirst}
                aria-label="Sự kiện trước"
                className={
                  isFirst
                    ? "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface/35 text-foreground/30"
                    : "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface/55 text-foreground/75 transition hover:bg-surface/70 hover:text-foreground hover:shadow-[0_0_26px_rgba(124,58,237,0.14)]"
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-semibold text-foreground/75">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={goToNextPage}
                disabled={isLast}
                aria-label="Sự kiện tiếp"
                className={
                  isLast
                    ? "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface/35 text-foreground/30"
                    : "inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface/55 text-foreground/75 transition hover:bg-surface/70 hover:text-foreground hover:shadow-[0_0_26px_rgba(124,58,237,0.14)]"
                }
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {relatedLoading ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, idx) => (
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
            ))}
          </div>
        ) : relatedError || relatedEvents.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-border bg-surface/35 p-10 text-center text-sm text-foreground/80">
            {relatedError || "Không có sự kiện liên quan"}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.08 },
              },
            }}
            className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
          >
            {relatedEvents.map((relatedEvent) => (
              <motion.div
                key={relatedEvent.id}
                layout
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  show: { opacity: 1, y: 0 },
                }}
              >
                <EventCard data={toCardData(relatedEvent)} href={`/events/${relatedEvent.id}`} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </div>
    </>
  );
}
