"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Ticket, Home } from "lucide-react";
import { formatPriceVND } from "@/features/events/utils/format-price";

type PaymentSuccessScreenProps = {
  eventName: string;
  eventDate: string;
  totalAmount: number;
};

export default function PaymentSuccessScreen({
  eventName,
  eventDate,
  totalAmount,
}: PaymentSuccessScreenProps) {
  const router = useRouter();

  const handleViewTickets = () => {
    router.push("/profile/tickets");
  };

  const handleBackHome = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#0E0E15] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[500px] rounded-3xl border border-purple-500/20 bg-black/40 p-8 shadow-[0_0_50px_rgba(124,58,237,0.15)] backdrop-blur-xl"
      >
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
            className="relative"
          >
            <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-purple-500 to-blue-500 opacity-20 blur-xl"></div>
            <div className="relative h-24 w-24 rounded-full border-2 border-purple-500/50 bg-black/60 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-purple-500" />
            </div>
          </motion.div>
        </div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-center text-4xl font-bold text-white tracking-tight"
        >
          Thanh toán thành công!
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-4 text-center text-gray-300 text-sm leading-relaxed"
        >
          Chúc mừng! Bạn đã sở hữu vé cho đêm hội tuyệt vời nhất. Thông tin chi
          tiết đã được gửi đến email của bạn.
        </motion.p>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-8 rounded-2xl bg-black/40 p-6 border border-purple-500/10"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-gray-400 tracking-wider">
                SỰ KIỆN
              </span>
              <span className="text-white font-bold text-right">{eventName}</span>
            </div>

            <div className="border-t border-purple-500/10"></div>

            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-gray-400 tracking-wider">
                THỜI GIAN
              </span>
              <span className="text-white font-semibold">{eventDate}</span>
            </div>

            <div className="border-t border-purple-500/10"></div>

            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-gray-400 tracking-wider">
                TỔNG CỘNG
              </span>
              <span className="text-2xl font-bold text-purple-500">
                {formatPriceVND(totalAmount)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="mt-8 space-y-3"
        >
          {/* Primary Button */}
          <button
            onClick={handleViewTickets}
            className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold text-sm transition hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(124,58,237,0.35)]"
          >
            <Ticket className="h-4 w-4" />
            Xem vé của tôi
          </button>

          {/* Secondary Button */}
          <button
            onClick={handleBackHome}
            className="w-full py-3 px-4 rounded-full border border-purple-500/30 bg-black/20 text-white font-bold text-sm transition hover:border-purple-500/60 hover:bg-black/40 active:scale-95 flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4" />
            Quay lại trang chủ
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
