import { useEffect, useId, useMemo, useState } from "react";

import {
  registerAccount,
  type RegisterGender,
} from "@/features/auth/services/register";
import { sendRegisterOtp } from "@/features/auth/services/send-register-otp";
import { useDateOfBirthField } from "@/features/auth/hooks/use-date-of-birth-field";
import {
  buildRegisterRequest,
} from "@/features/auth/utils/register-form";

export type RegisterCardFeedback = {
  type: "success" | "error";
  message: string;
} | null;

const OTP_COOLDOWN_SECONDS = 2 * 60;
const REGISTER_DRAFT_STORAGE_KEY = "ticketrush.auth.registerDraft";

function readRegisterDraft(): {
  fullName: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  otp: string;
} {
  if (typeof window === "undefined") {
    return {
      fullName: "",
      email: "",
      dateOfBirth: "",
      gender: "male",
      otp: "",
    };
  }

  try {
    const raw = window.sessionStorage.getItem(REGISTER_DRAFT_STORAGE_KEY);
    if (!raw) {
      return {
        fullName: "",
        email: "",
        dateOfBirth: "",
        gender: "male",
        otp: "",
      };
    }

    const parsed = JSON.parse(raw) as {
      fullName?: string;
      email?: string;
      dateOfBirth?: string;
      gender?: string;
      otp?: string;
    };

    return {
      fullName: typeof parsed.fullName === "string" ? parsed.fullName : "",
      email: typeof parsed.email === "string" ? parsed.email : "",
      dateOfBirth:
        typeof parsed.dateOfBirth === "string" ? parsed.dateOfBirth : "",
      gender:
        parsed.gender === "female" || parsed.gender === "other"
          ? parsed.gender
          : "male",
      otp: typeof parsed.otp === "string" ? parsed.otp : "",
    };
  } catch {
    return {
      fullName: "",
      email: "",
      dateOfBirth: "",
      gender: "male",
      otp: "",
    };
  }
}

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

export function useRegisterCard() {
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  const dobId = useId();
  const otpId = useId();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const draft = useMemo(() => readRegisterDraft(), []);
  const [fullName, setFullName] = useState(draft.fullName);
  const [email, setEmail] = useState(draft.email);
  const [gender, setGender] = useState(draft.gender);
  const [passwordValue, setPasswordValue] = useState("");
  const [otpValue, setOtpValue] = useState(draft.otp);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<RegisterCardFeedback>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpCooldownSeconds, setOtpCooldownSeconds] = useState(0);

  const dateOfBirthField = useDateOfBirthField();

  useEffect(() => {
    if (!draft.dateOfBirth) return;
    dateOfBirthField.setFromDisplayInput(draft.dateOfBirth);
  }, [dateOfBirthField, draft.dateOfBirth]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.sessionStorage.setItem(
      REGISTER_DRAFT_STORAGE_KEY,
      JSON.stringify({
        fullName,
        email,
        dateOfBirth: dateOfBirthField.displayValue,
        gender,
        otp: otpValue,
      }),
    );
  }, [dateOfBirthField.displayValue, email, fullName, gender, otpValue]);

  function togglePasswordVisibility() {
    setShowPassword((value) => !value);
  }

  function toggleConfirmPasswordVisibility() {
    setShowConfirmPassword((value) => !value);
  }

  function resetFormState() {
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPasswordValue("");
    setOtpValue("");
    setOtpCooldownSeconds(0);
    dateOfBirthField.reset();
  }

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

  async function handleSendOtp() {
    setFeedback(null);

    if (!email) {
      setFeedback({ type: "error", message: "Vui lòng nhập email để nhận OTP" });
      return;
    }

    if (otpCooldownSeconds > 0 || isSendingOtp) {
      return;
    }

    setIsSendingOtp(true);
    const result = await sendRegisterOtp({ email });
    setIsSendingOtp(false);

    if (result.code === 1036) {
      const secondsRemaining = parseCooldownSeconds(result.message);
      if (secondsRemaining !== null) {
        setOtpCooldownSeconds(secondsRemaining);
        setFeedback({
          type: "error",
          message: `Vui lòng chờ ${formatOtpCooldown(secondsRemaining)} để gửi lại OTP`,
        });
        return;
      }
    }

    if (!result.ok) {
      setFeedback({ type: "error", message: result.message });
      return;
    }

    setOtpCooldownSeconds(OTP_COOLDOWN_SECONDS);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");

    const { request, errorMessage } = buildRegisterRequest({
      fullName,
      email,
      password,
      confirmPassword,
      dateOfBirthRaw: dateOfBirthField.displayValue,
      genderRaw: gender,
      otp: otpValue,
    });

    if (!request) {
      setFeedback({ type: "error", message: errorMessage ?? "Dữ liệu không hợp lệ" });
      return;
    }

    setIsSubmitting(true);
    const result = await registerAccount(request);
    setIsSubmitting(false);

    setFeedback({
      type: result.ok ? "success" : "error",
      message: result.message,
    });

    if (result.ok) {
      // Keep user on the registration page (do not redirect to login).
      // Reset the form UI after success.
      form.reset();
      resetFormState();
      setFullName("");
      setEmail("");
      setGender("male");
      setOtpValue("");
      dateOfBirthField.reset();
    }
  }

  const isOtpCooldownActive = otpCooldownSeconds > 0;

  return {
    ids: {
      nameId,
      emailId,
      passwordId,
      confirmPasswordId,
      dobId,
      otpId,
    },
    fullName,
    setFullName,
    email,
    setEmail,
    gender,
    setGender,
    showPassword,
    showConfirmPassword,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
    passwordValue,
    setPasswordValue,
    otpValue,
    setOtpValue,
    isSubmitting,
    isSendingOtp,
    otpCooldownSeconds,
    otpCooldownLabel,
    isOtpCooldownActive,
    feedback,
    handleSubmit,
    handleSendOtp,
    dateOfBirthField,
    genderDefault: gender as RegisterGender,
  };
}
