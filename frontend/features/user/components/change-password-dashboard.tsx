"use client";

import { useState } from "react";

import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, KeyRound } from "lucide-react";

import ProfileSidebar from "@/features/user/components/profile-sidebar";
import { changePassword } from "@/features/user/services/change-password";
import { isPasswordLengthValid, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/features/auth/utils/password_validation";

export default function ChangePasswordDashboard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const passwordRuleOk = isPasswordLengthValid(newPassword);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const trimmedCurrentPassword = currentPassword.trim();
    if (!trimmedCurrentPassword) {
      setFeedback({ type: "error", message: "Vui lòng nhập mật khẩu hiện tại" });
      return;
    }

    if (!isPasswordLengthValid(newPassword)) {
      setFeedback({
        type: "error",
        message: `Mật khẩu mới chỉ trong khoảng ${PASSWORD_MIN_LENGTH} đến ${PASSWORD_MAX_LENGTH} kí tự`,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", message: "Nhập lại mật khẩu không khớp" });
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);
    const result = await changePassword({
      currentPassword: trimmedCurrentPassword,
      newPassword,
    });
    setIsSubmitting(false);

    setFeedback({
      type: result.ok ? "success" : "error",
      message: result.message === "Email hoặc mật khẩu sai" ? "Mật khẩu hiện tại sai" : result.message,
    });

    if (result.ok) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <ProfileSidebar />

      <section className="min-w-0 flex-1">
        <div className="rounded-[36px] border border-border bg-surface/55 p-7 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-9">
          <header>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Đổi mật khẩu
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Cập nhật mật khẩu tài khoản của bạn để tăng cường bảo mật.
            </p>
          </header>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-xs font-bold tracking-[0.18em] text-foreground/85">
                  MẬT KHẨU HIỆN TẠI
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/55" />
                  <input
                    name="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu hiện tại"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.currentTarget.value)}
                    className="h-11 w-full rounded-full border border-border bg-surface/60 pl-11 pr-11 text-sm text-foreground/90 outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((value) => !value)}
                    className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-foreground/60 transition hover:bg-surface-2/70 hover:text-foreground"
                    aria-label={showCurrentPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold tracking-[0.18em] text-foreground/85">
                  MẬT KHẨU MỚI
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/55" />
                  <input
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Tạo mật khẩu mới"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.currentTarget.value)}
                    className="h-11 w-full rounded-full border border-border bg-surface/60 pl-11 pr-11 text-sm text-foreground/90 outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((value) => !value)}
                    className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-foreground/60 transition hover:bg-surface-2/70 hover:text-foreground"
                    aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold tracking-[0.18em] text-foreground/85">
                  NHẬP LẠI MẬT KHẨU MỚI
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/55" />
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Xác nhận mật khẩu mới"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.currentTarget.value)}
                    className="h-11 w-full rounded-full border border-border bg-surface/60 pl-11 pr-11 text-sm text-foreground/90 outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-foreground/60 transition hover:bg-surface-2/70 hover:text-foreground"
                    aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={isSubmitting ? undefined : { scale: 1.01 }}
                whileTap={isSubmitting ? undefined : { scale: 0.99 }}
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
                className="mt-2 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-linear-to-r from-primary to-secondary text-sm font-semibold text-foreground shadow-lg shadow-black/20 transition enabled:hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Đang xử lý..." : "Cập nhật mật khẩu"}
              </motion.button>

              {feedback ? (
                <p
                  className={`text-center text-sm ${
                    feedback.type === "success" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {feedback.type === "success" ? "Cập nhật mật khẩu thành công" : feedback.message}
                </p>
              ) : null}
            </form>

            <aside className="rounded-[30px] border border-border bg-surface/45 p-5 backdrop-blur-xl">
              <h2 className="text-sm font-bold tracking-[0.18em] text-foreground/80">
                GỢI Ý BẢO MẬT
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-muted">
                <li>• Mật khẩu mới nên khác mật khẩu cũ và đủ mạnh.</li>
                <li>• Dùng ít nhất một chữ hoa, một chữ số và một ký tự đặc biệt.</li>
                <li>• Sau khi đổi mật khẩu, bạn nên đăng nhập lại trên thiết bị khác.</li>
              </ul>

              <div className="mt-6 rounded-2xl border border-border bg-surface/60 p-4 text-sm text-foreground/80">
                <p className="font-semibold text-foreground">Trạng thái mật khẩu</p>
                <p className={passwordRuleOk ? "mt-2 text-green-400" : "mt-2 text-muted"}>
                  {passwordRuleOk
                    ? "Mật khẩu mới đang trong khoảng độ dài hợp lệ."
                    : `Mật khẩu mới cần từ ${PASSWORD_MIN_LENGTH} đến ${PASSWORD_MAX_LENGTH} kí tự.`}
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
