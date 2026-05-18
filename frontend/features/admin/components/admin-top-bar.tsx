"use client";

import { Search } from "lucide-react";

export default function AdminTopBar() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-full max-w-2xl">
        <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/55" />
        <input
          placeholder="Tìm kiếm sự kiện, địa điểm, mã sự kiện..."
          className="h-12 w-full rounded-full border border-white/10 bg-white/5 pl-12 pr-5 text-sm text-foreground/90 outline-none backdrop-blur-xl transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15"
        />
      </div>
    </div>
  );
}

