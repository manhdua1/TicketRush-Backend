import { useEffect, useId, useMemo, useRef, useState } from "react";

import { changePassword } from "@/features/auth/services/reset-password";
import { sendResetPasswordOtp } from "@/features/auth/services/send-reset-password-otp";
import {
  isPasswordLengthValid,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/features/auth/utils/password_validation";

export type ForgotPasswordFeedback = {
  type: "success" | "error";
  message: string;
} | null;

const OTP_LENGTH = 6;
const OTP_COOLDOWN_SECONDS = 2 * 60;

function formatOtpCooldown(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function parseCooldownSeconds(message: string) {
  const seconds = Number.parseInt(message, 10);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

function normalizeOtpDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, OTP_LENGTH);
}

export function useForgotPasswordCard() {
  const emailId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();

  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(
    Array.from({ length: OTP_LENGTH }, () => ""),
  );
  const [passwordValue, setPasswordValue] = useState("");
  const [confirmPasswordValue, setConfirmPasswordValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpCooldownSeconds, setOtpCooldownSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<ForgotPasswordFeedback>(null);

  useEffect(() => {
    if (otpCooldownSeconds <= 0) return;

    const interval = window.setInterval(() => {
      setOtpCooldownSeconds((value) => Math.max(0, value - 1));
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [otpCooldownSeconds]);

  const otpCooldownLabel = useMemo(() => {
    return formatOtpCooldown(otpCooldownSeconds);
  }, [otpCooldownSeconds]);

  const otpValue = otpDigits.join("");

  function setOtpRef(index: number, node: HTMLInputElement | null) {
    otpRefs.current[index] = node;
  }

  function focusOtp(index: number) {
    otpRefs.current[index]?.focus();
  }

  function setOtpValue(nextValue: string) {
    const normalized = normalizeOtpDigits(nextValue);
    const nextDigits = Array.from({ length: OTP_LENGTH }, (_, index) => {
      return normalized[index] ?? "";
    });
    setOtpDigits(nextDigits);
  }

  function handleOtpChange(index: number, value: string) {
    const digitsOnly = normalizeOtpDigits(value);

    if (!digitsOnly) {
      setOtpDigits((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
      return;
    }

    setOtpDigits((prev) => {
      const next = [...prev];
      let cursor = index;
      for (const digit of digitsOnly) {
        if (cursor >= OTP_LENGTH) break;
        next[cursor] = digit;
        cursor += 1;
      }
      if (cursor < OTP_LENGTH) {
        focusOtp(cursor);
      }
      return next;
    });
  }

  function handleOtpKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusOtp(Math.max(0, index - 1));
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusOtp(Math.min(OTP_LENGTH - 1, index + 1));
      return;
    }

    if (event.key === "Backspace") {
      if (otpDigits[index]) {
        event.preventDefault();
        setOtpDigits((prev) => {
          const next = [...prev];
          next[index] = "";
          return next;
        });
        return;
      }

      if (index > 0) {
        event.preventDefault();
        focusOtp(index - 1);
        setOtpDigits((prev) => {
          const next = [...prev];
          next[index - 1] = "";
          return next;
        });
      }
    }
  }

  function handleOtpPaste(event: React.ClipboardEvent<HTMLDivElement>) {
    const text = event.clipboardData.getData("text");
    if (!text) return;

    event.preventDefault();
    setOtpValue(text);
    const normalized = normalizeOtpDigits(text);
    const nextIndex = Math.min(normalized.length, OTP_LENGTH - 1);
    focusOtp(nextIndex);
  }

  function togglePasswordVisibility() {
    setShowPassword((value) => !value);
  }

  function toggleConfirmPasswordVisibility() {
    setShowConfirmPassword((value) => !value);
  }

  function goBackToStepOne() {
    setStep(1);
    setFeedback(null);
    setOtpDigits(Array.from({ length: OTP_LENGTH }, () => ""));
    setPasswordValue("");
    setConfirmPasswordValue("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  async function handleSendOtp() {
    setFeedback(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFeedback({ type: "error", message: "Vui lòng nhập email để nhận OTP" });
      return false;
    }

    if (otpCooldownSeconds > 0 || isSendingOtp) {
      return false;
    }

    setIsSendingOtp(true);
    const result = await sendResetPasswordOtp({ email: trimmedEmail });
    setIsSendingOtp(false);

    if (result.code === 1036) {
      const secondsRemaining = parseCooldownSeconds(result.message);
      if (secondsRemaining !== null) {
        setOtpCooldownSeconds(secondsRemaining);
        setFeedback({
          type: "error",
          message: `Vui lòng chờ ${formatOtpCooldown(secondsRemaining)} để gửi lại OTP`,
        });
        return false;
      }
    }

    if (!result.ok) {
      setFeedback({ type: "error", message: result.message });
      return false;
    }

    setOtpCooldownSeconds(OTP_COOLDOWN_SECONDS);
    setFeedback({ type: "success", message: "Đã gửi OTP" });
    return true;
  }

  function validateStepOne() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return "Vui lòng nhập email";
    }

    return null;
  }

  function validateStepTwoOtp() {
    if (!/^\d{6}$/.test(otpValue)) {
      return "Mã OTP phải gồm 6 chữ số";
    }

    return null;
  }

  function validateStepTwo() {
    if (!isPasswordLengthValid(passwordValue)) {
      return `Mật khẩu chỉ trong khoảng ${PASSWORD_MIN_LENGTH} đến ${PASSWORD_MAX_LENGTH} kí tự`;
    }

    if (passwordValue !== confirmPasswordValue) {
      return "Nhập lại mật khẩu không khớp";
    }

    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (step === 1) {
      const error = validateStepOne();
      if (error) {
        setFeedback({ type: "error", message: error });
        return;
      }

      const sent = await handleSendOtp();
      if (sent) {
        setStep(2);
      }
      return;
    }

    const otpError = validateStepTwoOtp();
    if (otpError) {
      setFeedback({ type: "error", message: otpError });
      return;
    }

    const stepTwoError = validateStepTwo();
    if (stepTwoError) {
      setFeedback({ type: "error", message: stepTwoError });
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    const result = await changePassword({
      email: email.trim(),
      otp: otpValue,
      newPassword: passwordValue,
    });

    setIsSubmitting(false);
    setFeedback({
      type: result.ok ? "success" : "error",
      message: result.message,
    });

    if (result.ok) {
      setPasswordValue("");
      setConfirmPasswordValue("");
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }

  return {
    ids: {
      emailId,
      newPasswordId,
      confirmPasswordId,
    },
    step,
    email,
    setEmail,
    otpDigits,
    setOtpRef,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpPaste,
    passwordValue,
    setPasswordValue,
    confirmPasswordValue,
    setConfirmPasswordValue,
    showPassword,
    showConfirmPassword,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
    isSendingOtp,
    isSubmitting,
    otpCooldownSeconds,
    otpCooldownLabel,
    isOtpCooldownActive: otpCooldownSeconds > 0,
    feedback,
    handleSendOtp,
    handleSubmit,
    goBackToStepOne,
    passwordMin: PASSWORD_MIN_LENGTH,
    passwordMax: PASSWORD_MAX_LENGTH,
  };
}
