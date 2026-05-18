"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { TimerToastState } from "@/features/queue/hooks/use-timer-toast";

type TimerToastProps = {
  toast: TimerToastState;
  onDismiss?: () => void;
};

/**
 * A floating toast notification with a progress border that depletes over time.
 * The border is a conic-gradient that shrinks from full (360°) to 0° as time runs out.
 */
export default function TimerToast({ toast, onDismiss }: TimerToastProps) {
  const degrees = Math.round(toast.progress * 360);

  return (
    <AnimatePresence>
      {toast.visible && (
        <motion.div
          key="timer-toast"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.96 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-6 left-1/2 z-[9999] -translate-x-1/2"
        >
          {/* Outer conic-gradient border ring */}
          <div
            className="rounded-2xl p-[2px]"
            style={{
              background: `conic-gradient(#7c3aed ${degrees}deg, rgba(255,255,255,0.1) ${degrees}deg)`,
            }}
          >
            {/* Inner card */}
            <div className="flex min-w-[300px] max-w-[420px] items-center gap-3 rounded-[14px] bg-[#12121c] px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
              {/* Animated circle indicator */}
              <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
                <svg className="absolute inset-0" viewBox="0 0 36 36" fill="none">
                  {/* Track */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="3"
                  />
                  {/* Progress arc */}
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    stroke="#7c3aed"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 15}`}
                    strokeDashoffset={`${2 * Math.PI * 15 * (1 - toast.progress)}`}
                    transform="rotate(-90 18 18)"
                    style={{ transition: "stroke-dashoffset 0.1s linear" }}
                  />
                </svg>
                {/* Clock emoji center */}
                <span className="text-sm">⏱</span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-snug text-white">
                  {toast.message}
                </p>
              </div>

              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  aria-label="Đóng thông báo"
                  className="ml-1 shrink-0 rounded-full p-1 text-white/40 transition hover:text-white/80"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
