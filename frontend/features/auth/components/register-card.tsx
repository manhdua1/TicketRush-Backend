"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  UserRound,
} from "lucide-react";
import {
  isPasswordLengthValid,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/features/auth/utils/password_validation";

import { useRegisterCard } from "@/features/auth/hooks/use-register-card";

export default function RegisterCard() {
  const registerCard = useRegisterCard();
  const passwordRuleOk = isPasswordLengthValid(registerCard.passwordValue);

  return (
    <div className="w-full max-w-lg">
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="rounded-[40px] border border-border bg-surface/55 p-7 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-10"
      >
        <h1 className="text-center text-2xl font-extrabold tracking-tight sm:text-3xl">
          Đăng ký
        </h1>

        <form
          className="mt-8 space-y-5"
          onSubmit={registerCard.handleSubmit}
        >
          <div className="space-y-2">
            <label
              htmlFor={registerCard.ids.nameId}
              className="text-xs font-bold text-foreground/85"
            >
              Họ tên
            </label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/55" />
              <input
                id={registerCard.ids.nameId}
                name="fullName"
                type="text"
                autoComplete="name"
                placeholder="Nhập họ và tên của bạn"
                value={registerCard.fullName}
                onChange={(event) =>
                  registerCard.setFullName(event.currentTarget.value)
                }
                className="h-11 w-full rounded-full border border-border bg-surface/60 pl-11 pr-4 text-sm text-foreground/90 outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor={registerCard.ids.emailId}
              className="text-xs font-bold text-foreground/85"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/55" />
              <input
                id={registerCard.ids.emailId}
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Nhập địa chỉ email"
                value={registerCard.email}
                onChange={(event) => registerCard.setEmail(event.currentTarget.value)}
                className="h-11 w-full rounded-full border border-border bg-surface/60 pl-11 pr-4 text-sm text-foreground/90 outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor={registerCard.ids.passwordId}
              className="text-xs font-bold text-foreground/85"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/55" />
              <input
                id={registerCard.ids.passwordId}
                name="password"
                type={registerCard.showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Tạo mật khẩu"
                onChange={(event) =>
                  registerCard.setPasswordValue(event.currentTarget.value)
                }
                className="h-11 w-full rounded-full border border-border bg-surface/60 pl-11 pr-11 text-sm text-foreground/90 outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15"
              />
              <button
                type="button"
                onClick={registerCard.togglePasswordVisibility}
                className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-foreground/60 transition hover:bg-surface-2/70 hover:text-foreground"
                aria-label={
                  registerCard.showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                }
              >
                {registerCard.showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            <ul
              className="mt-2 space-y-1 text-sm"
              aria-live="polite"
            >
              <li className="flex items-center gap-2">
                {passwordRuleOk ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <span className="text-muted">•</span>
                )}
                <span
                  className={
                    passwordRuleOk ? "text-green-400" : "text-muted"
                  }
                >
                  Mật khẩu phải từ {PASSWORD_MIN_LENGTH} đến {PASSWORD_MAX_LENGTH} kí tự
                </span>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <label
              htmlFor={registerCard.ids.confirmPasswordId}
              className="text-xs font-bold text-foreground/85"
            >
              Nhập lại mật khẩu
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/55" />
              <input
                id={registerCard.ids.confirmPasswordId}
                name="confirmPassword"
                type={registerCard.showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Xác nhận mật khẩu"
                className="h-11 w-full rounded-full border border-border bg-surface/60 pl-11 pr-11 text-sm text-foreground/90 outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15"
              />
              <button
                type="button"
                onClick={registerCard.toggleConfirmPasswordVisibility}
                className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-foreground/60 transition hover:bg-surface-2/70 hover:text-foreground"
                aria-label={
                  registerCard.showConfirmPassword
                    ? "Ẩn mật khẩu"
                    : "Hiện mật khẩu"
                }
              >
                {registerCard.showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor={registerCard.ids.dobId}
                className="text-xs font-bold text-foreground/85"
              >
                Ngày sinh
              </label>
              <div className="relative">
                <input
                  id={registerCard.ids.dobId}
                  type="text"
                  inputMode="numeric"
                  placeholder="dd/mm/yyyy"
                  value={registerCard.dateOfBirthField.displayValue}
                  onChange={(event) => {
                    registerCard.dateOfBirthField.setFromDisplayInput(
                      event.currentTarget.value,
                    );
                  }}
                  className="h-11 w-full rounded-full border border-border bg-surface/60 px-4 pr-11 text-sm text-foreground/90 outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15"
                />
                <input
                  ref={registerCard.dateOfBirthField.pickerRef}
                  name="dateOfBirth"
                  type="date"
                  value={registerCard.dateOfBirthField.isoValue}
                  onChange={(event) => {
                    registerCard.dateOfBirthField.setFromIso(
                      event.currentTarget.value,
                    );
                  }}
                  tabIndex={-1}
                  aria-hidden="true"
                  className="absolute left-0 top-0 h-0 w-0 opacity-0"
                />
                <button
                  type="button"
                  onClick={registerCard.dateOfBirthField.openPicker}
                  className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-foreground/60 transition hover:bg-surface-2/70 hover:text-foreground"
                  aria-label="Chọn ngày sinh"
                >
                  <CalendarDays className="h-4 w-4" />
                </button>
              </div>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-xs font-bold text-foreground/85">
                Giới tính
              </legend>
              <div className="flex h-11 items-center gap-4 rounded-full border border-border bg-surface/60 px-4">
                <label className="inline-flex cursor-pointer select-none items-center gap-2 text-sm text-muted">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    className="h-4 w-4 cursor-pointer accent-primary"
                    checked={registerCard.gender === "male"}
                    onChange={() => registerCard.setGender("male")}
                  />
                  Nam
                </label>
                <label className="inline-flex cursor-pointer select-none items-center gap-2 text-sm text-muted">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    className="h-4 w-4 cursor-pointer accent-primary"
                    checked={registerCard.gender === "female"}
                    onChange={() => registerCard.setGender("female")}
                  />
                  Nữ
                </label>
                <label className="inline-flex cursor-pointer select-none items-center gap-2 text-sm text-muted">
                  <input
                    type="radio"
                    name="gender"
                    value="other"
                    className="h-4 w-4 cursor-pointer accent-primary"
                    checked={registerCard.gender === "other"}
                    onChange={() => registerCard.setGender("other")}
                  />
                  Khác
                </label>
              </div>
            </fieldset>
          </div>

          <div className="space-y-2">
            <label
              htmlFor={registerCard.ids.otpId}
              className="text-xs font-bold text-foreground/85"
            >
              Mã OTP
            </label>

            <div className="flex gap-3">
              <div className="relative flex-1">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/55" />
                <input
                  id={registerCard.ids.otpId}
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Nhập mã OTP"
                  maxLength={6}
                  value={registerCard.otpValue}
                  onChange={(event) => {
                    const digitsOnly = event.currentTarget.value.replace(/\D/g, "");
                    registerCard.setOtpValue(digitsOnly.slice(0, 6));
                  }}
                  className="h-11 w-full rounded-full border border-border bg-surface/60 pl-11 pr-4 text-sm text-foreground/90 outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15"
                />
              </div>

              <button
                type="button"
                onClick={registerCard.handleSendOtp}
                disabled={
                  registerCard.isSendingOtp ||
                  registerCard.isOtpCooldownActive
                }
                aria-busy={registerCard.isSendingOtp}
                className="inline-flex h-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-r from-primary to-secondary px-5 text-sm font-semibold leading-none text-foreground shadow-lg shadow-black/20 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 enabled:cursor-pointer enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 disabled:brightness-75 disabled:shadow-none"
              >
                {registerCard.isOtpCooldownActive
                  ? registerCard.otpCooldownLabel
                  : registerCard.isSendingOtp
                    ? "Đang gửi..."
                    : "Gửi OTP"}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={registerCard.isSubmitting ? undefined : { scale: 1.01 }}
            whileTap={registerCard.isSubmitting ? undefined : { scale: 0.99 }}
            type="submit"
            disabled={registerCard.isSubmitting}
            aria-busy={registerCard.isSubmitting}
            className="mt-2 inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-linear-to-r from-primary to-secondary text-sm font-semibold text-foreground shadow-lg shadow-black/20 transition enabled:hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {registerCard.isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Đang tải..</span>
              </>
            ) : (
              "Đăng Ký"
            )}
          </motion.button>

          {registerCard.feedback ? (
            <p
              className={`text-center text-sm ${
                registerCard.feedback.type === "success"
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {registerCard.feedback.message}
            </p>
          ) : null}
        </form>
      </motion.div>

      <p className="mt-6 text-center text-sm text-muted">
        Đã có tài khoản?{" "}
        <Link
          href="/login"
          className="cursor-pointer font-semibold text-secondary/90 transition hover:text-secondary hover:opacity-90"
        >
          Đăng nhập ngay
        </Link>
      </p>
    </div>
  );
}
