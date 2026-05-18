"use client";

import { memo, type CSSProperties } from "react";
import { Ban, Lock } from "lucide-react";
import type { Seat } from "@/features/events/types";

const DEFAULT_SEAT_COLOR = "#7C3AED";

function rowToLabel(rowNumber: number): string {
  if (rowNumber >= 1 && rowNumber <= 26) {
    return String.fromCharCode(64 + rowNumber);
  }
  return `R${rowNumber}`;
}

export function buildSeatLabel(seat: Seat): string {
  if (seat.label?.trim()) return seat.label;
  return `${rowToLabel(seat.rowNumber)}${seat.colNumber}`;
}

function getSeatStatusLabel(status: Seat["status"]): string {
  switch (status) {
    case "LOCKED":
      return "Đang giữ";
    case "SOLD":
      return "Đã bán";
    default:
      return "Trống";
  }
}

type SeatItemProps = {
  seat: Seat;
  isSelected: boolean;
  onToggle: (seat: Seat) => void;
};

export const SeatItem = memo(function SeatItem({ seat, isSelected, onToggle }: SeatItemProps) {
  const isAvailable = seat.status === "AVAILABLE";
  const isDisabled = !isAvailable && !isSelected;
  const seatColor = seat.colorHex || DEFAULT_SEAT_COLOR;

  const seatStyle: CSSProperties = isSelected
    ? {
        backgroundColor: seatColor,
        boxShadow: `0 0 18px ${seatColor}88, 0 0 38px ${seatColor}55`,
      }
    : isAvailable
      ? {
          borderColor: seatColor,
          boxShadow: "0 0 10px rgba(255,255,255,0.08)",
        }
      : {};

  return (
    <button
      type="button"
      aria-label={`${seat.zoneName} ${buildSeatLabel(seat)} - ${getSeatStatusLabel(seat.status)}`}
      aria-pressed={isSelected}
      disabled={isDisabled}
      onClick={() => onToggle(seat)}
      className={
        "relative grid h-(--seat-size) w-(--seat-size) place-items-center rounded-md border text-[0.55rem] transition " +
        (isSelected
          ? "text-background"
          : isAvailable
            ? "bg-surface/30 text-foreground/70 hover:scale-110"
            : "cursor-not-allowed border-border/60 bg-surface-2/70 text-muted")
      }
      style={seatStyle}
    >
      {seat.status === "LOCKED" ? (
        <Lock className="h-3 w-3" />
      ) : seat.status === "SOLD" ? (
        <Ban className="h-3 w-3" />
      ) : (
        <span className="sr-only">{buildSeatLabel(seat)}</span>
      )}
    </button>
  );
});
