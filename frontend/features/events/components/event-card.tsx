"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, MapPin } from "lucide-react";


export type EventCardData = {
  title: string;
  datetime: string;
  location: string;
  priceFrom: string;
  imageSrc: string;
};

export type EventCardVariant = "grid" | "list";

export default function EventCard({
  data,
  href = "#",
  variant = "grid",
  priority = false,
}: {
  data: EventCardData;
  href?: string;
  variant?: EventCardVariant;
  priority?: boolean;
}) {

  if (variant === "list") {
    return (
      <motion.article
        layout
        whileHover={{ y: -1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="group relative overflow-hidden rounded-3xl border border-border bg-surface/55 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl"
      >
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-stretch">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl sm:w-64 sm:shrink-0">
            <Image
              src={data.imageSrc || "/default-poster.svg"}
              alt={data.title}
              fill
              sizes="(max-width: 640px) 100vw, 256px"
              className="object-cover transition duration-500 group-hover:scale-[1.05]"
              priority={priority}
              loading={priority ? "eager" : "lazy"}
              style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-linear-to-t from-background/80 via-background/10 to-transparent"
            />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-lg font-bold leading-snug tracking-tight text-foreground">
              {data.title}
            </h3>

            <div className="mt-3 space-y-2 text-sm text-foreground/75">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary/85 shrink-0" />
                <span>{data.datetime}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary/85 shrink-0" />
                <span className="line-clamp-1">{data.location}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
            <div className="bg-linear-to-r from-primary to-secondary bg-clip-text text-sm font-bold text-transparent">
              {data.priceFrom}
            </div>
            <Link
              href={href}
              aria-label={`Mua vé: ${data.title}`}
              className="inline-flex h-11 items-center justify-center rounded-full bg-linear-to-r from-primary to-secondary px-6 text-sm font-semibold text-white shadow-[0_0_26px_rgba(124,58,237,0.22)] transition hover:shadow-[0_0_34px_rgba(124,58,237,0.30)]"
            >
              Mua vé
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition duration-300 group-hover:opacity-100"
          style={{
            boxShadow:
              "0 0 0 1px rgba(124, 58, 237, 0.25), 0 0 38px rgba(124, 58, 237, 0.10)",
          }}
        />
      </motion.article>
    );
  }

  return (
    <motion.article
      layout
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 250, damping: 20 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface/55 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl"
    >
      <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl">
        {/* Image */}
        <Image
          src={data.imageSrc || "/default-poster.svg"}
          alt={data.title}
          fill
          sizes="(max-width: 1024px) 100vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-[1.05]"
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          style={{ transform: "translateZ(0)", backfaceVisibility: "hidden", display: "block" }}
        />
        {/* gradient overlay */}
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-background/80 via-background/10 to-transparent"
        />
      </div>

      <div className="relative flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug tracking-tight text-foreground">
          {data.title}
        </h3>

        <div className="mt-2.5 space-y-1.5 text-xs text-foreground/70">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary/85 shrink-0" />
            <span>{data.datetime}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary/85 shrink-0" />
            <span className="line-clamp-1">{data.location}</span>
          </div>
        </div>

        <div className="mt-auto pt-3 flex items-center justify-between">
          <div className="bg-linear-to-r from-primary to-secondary bg-clip-text text-sm font-bold text-transparent">
            {data.priceFrom}
          </div>
          <Link
            href={href}
            aria-label={`Xem chi tiết: ${data.title}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-2/50 text-foreground/80 transition group-hover:border-primary/45 group-hover:bg-surface-2/70 group-hover:text-foreground group-hover:shadow-[0_0_20px_rgba(124,58,237,0.22)]"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* neon border glow on hover */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
          style={{
            boxShadow:
              "0 0 0 1px rgba(124, 58, 237, 0.35), 0 0 38px rgba(124, 58, 237, 0.12)",
          }}
        />
      </div>
    </motion.article>
  );
}