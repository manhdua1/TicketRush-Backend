"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type TimerToastOptions = {
  message: string;
  durationMs: number; // total duration the toast stays visible
  colorClass?: string; // Tailwind border color class for progress, e.g. "border-primary"
};

export type TimerToastState = {
  visible: boolean;
  message: string;
  progress: number; // 0 → 1 (full → empty)
  colorClass: string;
};

/**
 * Hook to show a toast with an animated progress border that shrinks over time.
 * Call `show(options)` to trigger it. The toast auto-closes when the timer expires.
 */
export function useTimerToast() {
  const [toastState, setToastState] = useState<TimerToastState>({
    visible: false,
    message: "",
    progress: 1,
    colorClass: "border-primary",
  });

  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);

  const cancelAnimation = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const show = useCallback(
    (options: TimerToastOptions) => {
      cancelAnimation();
      startTimeRef.current = performance.now();
      durationRef.current = options.durationMs;

      setToastState({
        visible: true,
        message: options.message,
        progress: 1,
        colorClass: options.colorClass ?? "border-primary",
      });

      const tick = (now: number) => {
        const elapsed = now - startTimeRef.current;
        const remaining = Math.max(0, 1 - elapsed / durationRef.current);

        setToastState((prev) => ({ ...prev, progress: remaining }));

        if (remaining > 0) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setToastState((prev) => ({ ...prev, visible: false }));
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [cancelAnimation],
  );

  const dismiss = useCallback(() => {
    cancelAnimation();
    setToastState((prev) => ({ ...prev, visible: false }));
  }, [cancelAnimation]);

  // cleanup on unmount
  useEffect(() => cancelAnimation, [cancelAnimation]);

  return { toastState, show, dismiss };
}
