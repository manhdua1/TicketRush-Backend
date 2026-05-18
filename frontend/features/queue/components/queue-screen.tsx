"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hourglass, Clock, AlertCircle, LogOut } from "lucide-react";
import type { QueueState } from "@/features/queue/hooks/use-queue";

type QueueScreenProps = {
  state: QueueState;
  onLeave: () => Promise<void>; // caller handles redirect after leave
};

function formatWaitTime(seconds: number): string {
  if (seconds <= 0) return "~1 phút";
  const minutes = Math.ceil(seconds / 60);
  return `~${minutes} phút`;
}

export default function QueueScreen({ state, onLeave }: QueueScreenProps) {
  const { position, totalInQueue, estimatedWaitSeconds } = state;
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // progress: how far along the queue we are (0 = just joined, 1 = about to be served)
  const progress =
    totalInQueue > 0 ? Math.max(0, Math.min(1, 1 - position / totalInQueue)) : 0;
  const progressPct = Math.round(progress * 100);

  const handleLeaveConfirm = async () => {
    setIsLeaving(true);
    await onLeave();
    setIsLeaving(false);
    setShowLeaveDialog(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0e0e15] px-4">
      {/* Ambient glow background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[120px]"
          style={{
            background:
              "radial-gradient(circle, #7c3aed 0%, #2563eb 60%, transparent 100%)",
          }}
        />
      </div>

      {/* Glassmorphic card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-[0_32px_120px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          {/* Status icon with pulse */}
          <div className="relative mb-6">
            <motion.div
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-primary/30 blur-md"
            />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-primary/40 bg-primary/20 shadow-[0_0_24px_rgba(124,58,237,0.5)]">
              <Hourglass className="h-7 w-7 text-primary" />
            </div>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Bạn đang trong hàng chờ
          </h1>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/55">
            Chúng tôi đang giữ chỗ cho bạn. Trải nghiệm sự kiện bùng nổ sắp
            thuộc về bạn.
          </p>
        </div>

        {/* Queue position box */}
        <div className="mt-8 rounded-2xl border border-white/8 bg-black/40 px-6 py-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/40">
            Vị trí trong hàng chờ
          </p>

          <motion.div
            key={position}
            initial={{ opacity: 0.5, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="mt-2 text-6xl font-black tracking-tight sm:text-7xl"
            style={{
              color: "#a78bfa",
              textShadow:
                "0 0 24px rgba(124,58,237,0.7), 0 0 60px rgba(124,58,237,0.35)",
            }}
          >
            #{position}
          </motion.div>

          <div className="mt-3 flex items-center justify-center gap-1.5 text-sm text-white/50">
            <Clock className="h-3.5 w-3.5" />
            <span>
              Thời gian chờ dự kiến:{" "}
              <span className="text-white/75">
                {formatWaitTime(estimatedWaitSeconds)}
              </span>
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">
            <span>Trong hàng chờ</span>
            <span>Chọn vé</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${progressPct}%`,
                background: "linear-gradient(90deg, #7c3aed, #2563eb)",
                boxShadow: "0 0 12px rgba(124,58,237,0.6)",
              }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Warning */}
        <div className="mt-6 flex gap-3 rounded-2xl border border-red-500/25 bg-red-500/10 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
          <div>
            <p className="text-sm font-bold text-red-400">Không tải lại trang</p>
            <p className="mt-0.5 text-xs leading-relaxed text-white/55">
              Làm mới hoặc đóng trang này sẽ khiến bạn mất lượt trong hàng chờ.
              Vui lòng giữ nguyên màn hình này.
            </p>
          </div>
        </div>

        {/* Leave queue button */}
        <button
          type="button"
          onClick={() => setShowLeaveDialog(true)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white/50 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Rời hàng chờ
        </button>
      </motion.div>

      {/* Leave queue confirm dialog */}
      <AnimatePresence>
        {showLeaveDialog && (
          <motion.div
            key="leave-dialog-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          >
            <motion.div
              key="leave-dialog"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#12121c] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-500/30 bg-red-500/15">
                  <LogOut className="h-4 w-4 text-red-400" />
                </div>
                <h2 className="text-base font-bold text-white">Rời hàng chờ?</h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                Bạn sẽ mất vị trí hiện tại (<span className="font-semibold text-white/80">#{position}</span>) và phải xếp hàng lại từ đầu nếu muốn đặt vé.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowLeaveDialog(false)}
                  disabled={isLeaving}
                  className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/5 disabled:opacity-50"
                >
                  Ở lại
                </button>
                <button
                  type="button"
                  onClick={handleLeaveConfirm}
                  disabled={isLeaving}
                  className="flex-1 rounded-xl bg-red-500/90 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                >
                  {isLeaving ? "Đang rời..." : "Rời hàng chờ"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
