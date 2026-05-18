"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Eye, EyeOff, Lock, Mail } from "lucide-react";

import { useForgotPasswordCard } from "@/features/auth/hooks/use-forgot-password-card";

const OTP_LENGTH = 6;

export default function ForgotPasswordCard() {
  const forgotPassword = useForgotPasswordCard();

  return (
    <div className="w-full max-w-lg">
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="relative rounded-[40px] border border-border bg-surface/60 p-7 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-10"
      >
        <h1 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
          Đổi mật khẩu
        </h1>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm font-semibold">
          <div className="flex items-center gap-3">
            <span
              className={`grid h-8 w-8 place-items-center rounded-full border text-xs font-bold transition ${
                forgotPassword.step === 1
                  ? "border-primary/70 bg-primary text-background"
                  : "border-border text-muted"
              }`}
            >
              1
            </span>
            <span
              className={
                forgotPassword.step === 1
                  ? "text-foreground"
                  : "text-muted"
              }
            >
              Xác thực tài khoản
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted" />
          <div className="flex items-center gap-3">
            <span
              className={`grid h-8 w-8 place-items-center rounded-full border text-xs font-bold transition ${
                forgotPassword.step === 2
                  ? "border-primary/70 bg-primary text-background"
                  : "border-border text-muted"
              }`}
            >
              2
            </span>
            <span
              className={
                forgotPassword.step === 2
                  ? "text-foreground"
                  : "text-muted"
              }
            >
              Đổi mật khẩu
            </span>
          </div>
        </div>

        {forgotPassword.step === 2 ? (
          <button
            type="button"
            onClick={forgotPassword.goBackToStepOne}
            className="cursor-pointer absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-2 text-xs font-semibold text-foreground/80 transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </button>
        ) : null}

        <form className="mt-7 flex flex-col" onSubmit={forgotPassword.handleSubmit}>
          <div className={forgotPassword.step === 1 ? "space-y-5" : "space-y-5"}>
            {forgotPassword.step === 1 ? (
              <div className="w-full space-y-2">
                <label
                  htmlFor={forgotPassword.ids.emailId}
                  className="text-xs font-bold tracking-[0.18em] text-foreground/85"
                >
                  EMAIL
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/55" />
                  <input
                    id={forgotPassword.ids.emailId}
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Nhập địa chỉ email"
                    value={forgotPassword.email}
                    onChange={(event) =>
                      forgotPassword.setEmail(event.currentTarget.value)
                    }
                    className="h-11 w-full rounded-full border border-border bg-surface/60 pl-11 pr-4 text-sm text-foreground/90 outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15"
                  />
                </div>

              </div>
            ) : (
              <>
                <div className="w-full space-y-2">
                  <label
                    htmlFor={forgotPassword.ids.newPasswordId}
                    className="text-xs font-bold tracking-[0.18em] text-foreground/85"
                  >
                    MẬT KHẨU MỚI
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/55" />
                    <input
                      id={forgotPassword.ids.newPasswordId}
                      name="newPassword"
                      type={forgotPassword.showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Nhập mật khẩu mới"
                      value={forgotPassword.passwordValue}
                      onChange={(event) =>
                        forgotPassword.setPasswordValue(event.currentTarget.value)
                      }
                      className="h-11 w-full rounded-full border border-border bg-surface/60 pl-11 pr-11 text-sm text-foreground/90 outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15"
                    />
                    <button
                      type="button"
                      onClick={forgotPassword.togglePasswordVisibility}
                      className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-foreground/60 transition hover:bg-surface-2/70 hover:text-foreground"
                      aria-label={
                        forgotPassword.showPassword
                          ? "Ẩn mật khẩu"
                          : "Hiện mật khẩu"
                      }
                    >
                      {forgotPassword.showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="w-full space-y-2">
                  <label
                    htmlFor={forgotPassword.ids.confirmPasswordId}
                    className="text-xs font-bold tracking-[0.18em] text-foreground/85"
                  >
                    XÁC NHẬN MẬT KHẨU
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/55" />
                    <input
                      id={forgotPassword.ids.confirmPasswordId}
                      name="confirmPassword"
                      type={
                        forgotPassword.showConfirmPassword ? "text" : "password"
                      }
                      autoComplete="new-password"
                      placeholder="Nhập lại mật khẩu mới"
                      value={forgotPassword.confirmPasswordValue}
                      onChange={(event) =>
                        forgotPassword.setConfirmPasswordValue(
                          event.currentTarget.value,
                        )
                      }
                      className="h-11 w-full rounded-full border border-border bg-surface/60 pl-11 pr-11 text-sm text-foreground/90 outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15"
                    />
                    <button
                      type="button"
                      onClick={forgotPassword.toggleConfirmPasswordVisibility}
                      className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-foreground/60 transition hover:bg-surface-2/70 hover:text-foreground"
                      aria-label={
                        forgotPassword.showConfirmPassword
                          ? "Ẩn mật khẩu"
                          : "Hiện mật khẩu"
                      }
                    >
                      {forgotPassword.showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="w-full space-y-2">
                  <label className="text-xs font-bold text-foreground/85">
                    Mã OTP
                  </label>
                  <div
                    className="flex w-full items-center justify-between gap-3"
                    onPaste={forgotPassword.handleOtpPaste}
                  >
                    {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                      <input
                        key={`otp-${index}`}
                        ref={(node) => forgotPassword.setOtpRef(index, node)}
                        value={forgotPassword.otpDigits[index] ?? ""}
                        onChange={(event) =>
                          forgotPassword.handleOtpChange(
                            index,
                            event.currentTarget.value,
                          )
                        }
                        onKeyDown={(event) =>
                          forgotPassword.handleOtpKeyDown(index, event)
                        }
                        onFocus={(event) => event.currentTarget.select()}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        aria-label={`OTP digit ${index + 1}`}
                        className="h-14 w-14 shrink-0 rounded-2xl border border-border bg-surface/60 text-center text-lg font-semibold text-foreground/90 outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15"
                      />
                    ))}
                  </div>
                </div>

              </>
            )}
          </div>
            
            

          <div className="mt-6 space-y-3">
            <motion.button
              whileHover={
                forgotPassword.isSubmitting || forgotPassword.isSendingOtp || forgotPassword.isOtpCooldownActive
                  ? undefined
                  : { scale: 1.01 }
              }
              whileTap={
                forgotPassword.isSubmitting || forgotPassword.isSendingOtp || forgotPassword.isOtpCooldownActive
                  ? undefined
                  : { scale: 0.99 }
              }
              type="submit"
              disabled={
                forgotPassword.isSubmitting ||
                forgotPassword.isSendingOtp ||
                (forgotPassword.step === 1 && forgotPassword.isOtpCooldownActive)
              }
              aria-busy={forgotPassword.isSubmitting || forgotPassword.isSendingOtp}
              className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-linear-to-r from-primary to-secondary text-sm font-semibold text-foreground shadow-lg shadow-black/20 transition enabled:hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {forgotPassword.step === 1
                ? forgotPassword.isSendingOtp
                  ? "Đang gửi mã..."
                  : forgotPassword.isOtpCooldownActive
                    ? forgotPassword.otpCooldownLabel
                    : "Gửi mã OTP"
                : forgotPassword.isSubmitting
                  ? "Đang xử lý..."
                  : "Đổi mật khẩu"}
            </motion.button>

            <div className="min-h-5">
              {forgotPassword.step === 1 ? (
                <p className="text-xs text-muted">
                    Nhấn &quot;Gửi mã OTP&quot;, sau đó vui lòng kiểm tra hộp thư đến và làm theo
                  hướng dẫn.
                </p>
              ) : null}
            </div>

            <div className="min-h-6">
              {forgotPassword.feedback ? (
                <p
                  className={
                    "text-center text-sm " +
                    (forgotPassword.feedback.type === "success"
                      ? "text-green-400"
                      : "text-red-400")
                  }
                >
                  {forgotPassword.feedback.message}
                </p>
              ) : null}
            </div>
          </div>
        </form>
      </motion.div>

      <p className="mt-6 text-center text-sm text-muted">
        Đã nhớ mật khẩu?{" "}
        <Link
          href="/login"
          className="bg-linear-to-r from-primary to-secondary bg-clip-text font-semibold text-transparent transition hover:opacity-90"
        >
          Trở về Đăng nhập
        </Link>
      </p>
    </div>
  );
}
