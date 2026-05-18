import { useEffect, useId, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { loginAccount } from "@/features/auth/services/login";
import { ME_QUERY_KEY } from "@/features/auth/hooks/use-me";
import { getMe } from "@/features/auth/services/me";

const LOGIN_DRAFT_STORAGE_KEY = "ticketrush.auth.loginDraft";

function readLoginDraft(): { email: string } {
  if (typeof window === "undefined") {
    return { email: "" };
  }

  try {
    const raw = window.sessionStorage.getItem(LOGIN_DRAFT_STORAGE_KEY);
    if (!raw) return { email: "" };

    const parsed = JSON.parse(raw) as { email?: string };
    return { email: typeof parsed.email === "string" ? parsed.email : "" };
  } catch {
    return { email: "" };
  }
}

export type LoginCardFeedback = {
  type: "success" | "error";
  message: string;
} | null;

export function useLoginCard() {
  const emailId = useId();
  const passwordId = useId();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<LoginCardFeedback>(null);
  const [email, setEmail] = useState(() => readLoginDraft().email);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.sessionStorage.setItem(
      LOGIN_DRAFT_STORAGE_KEY,
      JSON.stringify({ email }),
    );
  }, [email]);

  function togglePasswordVisibility() {
    setShowPassword((value) => !value);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;
    setFeedback(null);

    const form = event.currentTarget;
    const data = new FormData(form);

    const submittedEmail = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    if (!submittedEmail || !password) {
      setFeedback({
        type: "error",
        message: "Vui lòng nhập email và mật khẩu",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginAccount({ email: submittedEmail, password });

      if (result.ok) {
        const meResult = await getMe();
        if (!meResult.ok) {
          setFeedback({
            type: "error",
            message:
              meResult.message ??
              "Đăng nhập thành công nhưng không lấy được thông tin người dùng",
          });
          return;
        }

        if (!meResult.result) {
          setFeedback({
            type: "error",
            message:
              "Đăng nhập thành công nhưng không lấy được thông tin người dùng",
          });
          return;
        }

        queryClient.setQueryData(ME_QUERY_KEY, meResult.result);
        window.sessionStorage.removeItem(LOGIN_DRAFT_STORAGE_KEY);
        setEmail("");

        form.reset();
        setShowPassword(false);
        setFeedback(null);
        router.replace(
          meResult.result.role === "ADMIN" ? "/admin/overview" : "/",
        );
        return;
      }

      setFeedback({
        type: "error",
        message: result.message,
      });

      const passwordField = form.elements.namedItem("password");
      if (passwordField instanceof HTMLInputElement) {
        passwordField.value = "";
      }
      setShowPassword(false);
      setEmail(submittedEmail);
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    ids: {
      emailId,
      passwordId,
    },
    email,
    setEmail,
    showPassword,
    togglePasswordVisibility,
    isSubmitting,
    feedback,
    handleSubmit,
  };
}
