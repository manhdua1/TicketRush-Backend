"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useLoginCard } from "@/features/auth/hooks/use-login-card";

export default function LoginCard() {
  const loginCard = useLoginCard();

  return (
    <div className="w-full max-w-md">
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="rounded-[36px] border border-border bg-surface/55 p-7 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-9"
      >
        <h1 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
          Đăng nhập
        </h1>

        <form
          className="mt-7 space-y-5"
          onSubmit={loginCard.handleSubmit}
        >
          <div className="space-y-2">
            <label
              htmlFor={loginCard.ids.emailId}
              className="text-xs font-bold tracking-[0.18em] text-foreground/85"
            >
              EMAIL
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/55" />
              <input
                id={loginCard.ids.emailId}
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Nhập địa chỉ email của bạn"
                value={loginCard.email}
                onChange={(event) => loginCard.setEmail(event.currentTarget.value)}
                className="h-11 w-full rounded-full border border-border bg-surface/60 pl-11 pr-4 text-sm text-foreground/90 outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor={loginCard.ids.passwordId}
                className="text-xs font-bold tracking-[0.18em] text-foreground/85"
              >
                MẬT KHẨU
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-secondary/90 transition hover:text-secondary"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/55" />
              <input
                id={loginCard.ids.passwordId}
                name="password"
                type={loginCard.showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Nhập mật khẩu của bạn"
                className="h-11 w-full rounded-full border border-border bg-surface/60 pl-11 pr-11 text-sm text-foreground/90 outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15"
              />
              <button
                type="button"
                onClick={loginCard.togglePasswordVisibility}
                className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-foreground/60 transition hover:bg-surface-2/70 hover:text-foreground"
                aria-label={loginCard.showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {loginCard.showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={loginCard.isSubmitting ? undefined : { scale: 1.01 }}
            whileTap={loginCard.isSubmitting ? undefined : { scale: 0.99 }}
            type="submit"
            disabled={loginCard.isSubmitting}
            aria-busy={loginCard.isSubmitting}
            className="mt-2 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-linear-to-r from-primary to-secondary text-sm font-semibold text-foreground shadow-lg shadow-black/20 transition enabled:hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loginCard.isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang tải..</span>
              </>
            ) : (
              "Đăng Nhập"
            )}
          </motion.button>

          {loginCard.feedback ? (
            <p
              className={`text-center text-sm ${
                loginCard.feedback.type === "success"
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {loginCard.feedback.message}
            </p>
          ) : null}
        </form>
      </motion.div>

      <p className="mt-6 text-center text-sm text-muted">
        Chưa có tài khoản?{" "}
        <Link
          href="/register"
          className="bg-linear-to-r from-primary to-secondary bg-clip-text font-semibold text-transparent transition hover:opacity-90"
        >
          Đăng Ký Ngay
        </Link>
      </p>
    </div>
  );
}
