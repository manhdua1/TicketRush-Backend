"use client";

import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-background">
      <div className="flex flex-col items-center justify-center text-center">
        {/* Neon 404 Text */}
        <div className="mb-8 text-9xl font-black tracking-tighter select-none">
          <span
            className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 drop-shadow-[0_0_30px_rgba(168,85,247,0.8)]"
            style={{
              textShadow:
                "0 0 20px rgba(168, 85, 247, 0.8), 0 0 40px rgba(59, 130, 246, 0.6)",
            }}
          >
            404
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4">
          Trang không tồn tại
        </h1>

        {/* Description */}
        <p className="text-sm sm:text-base text-foreground/70 mb-8 max-w-md">
          Trang bạn đang tìm không tồn tại hoặc đã được chuyển đi.
        </p>

        {/* CTA Button */}
        <Link
          href="/"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 px-8 text-sm font-semibold text-white shadow-lg shadow-purple-500/50 transition hover:shadow-lg hover:shadow-purple-400/70 hover:brightness-110"
        >
          <Home className="h-5 w-5" />
          Quay lại Trang chủ
        </Link>
      </div>
    </div>
  );
}
