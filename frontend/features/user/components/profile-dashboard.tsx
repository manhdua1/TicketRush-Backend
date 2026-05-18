"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Pencil, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Cropper, { type Area, type Point } from "react-easy-crop";

import Avatar from "@/components/user/avatar";
import ProfileSidebar from "@/features/user/components/profile-sidebar";
import { useDateOfBirthField } from "@/features/auth/hooks/use-date-of-birth-field";
import { ME_QUERY_KEY } from "@/features/auth/hooks/use-me";
import { getMe } from "@/features/auth/services/me";
import { getMyInfo, type Info } from "@/features/user/services/get-my-info";
import { postMyAvatar } from "@/features/user/services/post-my-avatar";
import { postMyInfo, type NewUserInfo } from "@/features/user/services/post-my-info";
import { getCroppedImageBlob } from "@/features/user/utils/crop-image";

export default function ProfileDashboard() {
  const queryClient = useQueryClient();
  const {
    displayValue: dobDisplayValue,
    isoValue: dobIsoValue,
    pickerRef: dobPickerRef,
    setFromDisplayInput: setDobFromDisplayInput,
    setFromIso: setDobFromIso,
    openPicker: openDobPicker,
  } = useDateOfBirthField();
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

  const [myInfo, setMyInfo] = useState<Info | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const avatarSrc = myInfo?.avatarUrl || "/default-avatar.svg";

  const [avatarEditorSrc, setAvatarEditorSrc] = useState<string | null>(null);
  const [avatarEditorFilename, setAvatarEditorFilename] = useState<string>("avatar.png");
  const [avatarCrop, setAvatarCrop] = useState<Point>({ x: 0, y: 0 });
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [avatarCroppedAreaPixels, setAvatarCroppedAreaPixels] = useState<Area | null>(null);

  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"" | "MALE" | "FEMALE" | "OTHER">("");
  const [dobError, setDobError] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const applyMyInfo = useCallback((info: Info) => {
    setMyInfo(info);
    setFullName(info.fullName ?? "");
    setGender(info.gender ?? "");
    setDobFromIso(info.dateOfBirth ?? "");
  }, [setDobFromIso]);

  const refreshMyInfo = useCallback(async () => {
    const result = await getMyInfo();

    if (!result.ok || !result.data?.result) {
      setProfileError(result.message);
      return null;
    }

    setProfileError(null);
    applyMyInfo(result.data.result);
    return result.data.result;
  }, [applyMyInfo]);

  useEffect(() => {
    let ignore = false;

    async function loadMyInfo() {
      const result = await getMyInfo();
      if (ignore) return;

      if (!result.ok || !result.data?.result) {
        setProfileError(result.message);
        return;
      }

      setProfileError(null);
      applyMyInfo(result.data.result);
    }

    void loadMyInfo();

    return () => {
      ignore = true;
    };
  }, [applyMyInfo]);

  const saveMutation = useMutation({
    mutationFn: async (payload: NewUserInfo) => postMyInfo(payload),
    onSuccess: async (result) => {
      setSaveFeedback({
        type: result.ok ? "success" : "error",
        message: result.message,
      });

      if (!result.ok) return;

      if (result.result) {
        applyMyInfo(result.result);
      }

      await refreshMyInfo();
    },
  });

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => postMyAvatar(file),
    onSuccess: async (result) => {
      if (!result.ok) return;

      if (result.result) {
        applyMyInfo(result.result);
      }

      await refreshMyInfo();

      const meResult = await getMe();
      if (meResult.ok && meResult.result) {
        queryClient.setQueryData(ME_QUERY_KEY, meResult.result);
      }
      queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    },
  });

  function closeAvatarEditor() {
    setAvatarCrop({ x: 0, y: 0 });
    setAvatarZoom(1);
    setAvatarCroppedAreaPixels(null);

    setAvatarEditorSrc((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    if (avatarFileInputRef.current) {
      avatarFileInputRef.current.value = "";
    }
  }

  useEffect(() => {
    return () => {
      if (avatarEditorSrc) {
        URL.revokeObjectURL(avatarEditorSrc);
      }
    };
  }, [avatarEditorSrc]);

  const joinedAtLabel = myInfo?.createdAt
    ? new Date(myInfo.createdAt).toLocaleDateString("vi-VN")
    : "--";

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <ProfileSidebar />

      <section className="min-w-0 flex-1">
        <div className="rounded-[36px] border border-border bg-surface/55 p-7 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-9">
          <header>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Thông tin cá nhân
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Quản lý thông tin tài khoản của bạn.
            </p>
          </header>

          {profileError ? (
            <div className="mt-6 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">
              {profileError}
            </div>
          ) : null}

          <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-linear-to-r from-primary/70 to-secondary/60 p-0.5">
                  <div className="h-full w-full overflow-hidden rounded-full border border-border bg-surface-2/70">
                    <Avatar
                      src={avatarSrc}
                      alt="Ảnh đại diện"
                      className="h-full w-full rounded-full object-cover"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="cursor-pointer  absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-full border border-border bg-surface/80 text-foreground/80 backdrop-blur-xl transition hover:bg-surface-2/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                  aria-label="Chỉnh sửa ảnh đại diện"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>

              <div>
                <p className="text-sm font-semibold">Ảnh đại diện</p>
                <p className="mt-1 text-xs text-muted">
                  Nhấn biểu tượng bút để thay đổi.
                </p>
                <p className="mt-2 text-xs text-muted">
                  Ngày tham gia: <span className="text-foreground/80">{joinedAtLabel}</span>
                </p>
              </div>
            </div>
          </div>

          <input
            ref={avatarFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            aria-hidden
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (!file) return;
              if (!file.type.startsWith("image/")) return;

              setAvatarEditorSrc((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return URL.createObjectURL(file);
              });
              setAvatarEditorFilename(file.name || "avatar.png");
              setAvatarCrop({ x: 0, y: 0 });
              setAvatarZoom(1);
              setAvatarCroppedAreaPixels(null);
            }}
          />

          {avatarEditorSrc ? (
            <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-surface/50 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Cắt ảnh đại diện</p>
                  <p className="mt-1 text-xs text-muted">Kéo để căn chỉnh, dùng thanh để phóng to/thu nhỏ.</p>
                </div>
                <button
                  type="button"
                  onClick={closeAvatarEditor}
                  className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-border bg-surface/70 text-foreground/80 transition hover:bg-surface-2/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                  aria-label="Đóng"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4">
                <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-border bg-black/30">
                  <Cropper
                    image={avatarEditorSrc}
                    crop={avatarCrop}
                    zoom={avatarZoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setAvatarCrop}
                    onZoomChange={setAvatarZoom}
                    onCropComplete={(_, croppedAreaPixels) => {
                      setAvatarCroppedAreaPixels(croppedAreaPixels);
                    }}
                  />
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-3 text-xs font-semibold text-foreground/80">
                    Zoom
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.01}
                      value={avatarZoom}
                      onChange={(event) => setAvatarZoom(Number(event.currentTarget.value))}
                      className="w-full max-w-56 cursor-pointer accent-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                    />
                  </label>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={closeAvatarEditor}
                      className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full border border-border bg-surface/70 px-5 text-sm font-semibold text-foreground/80 transition hover:bg-surface-2/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                    >
                      Hủy
                    </button>
                    <motion.button
                      type="button"
                      whileHover={avatarMutation.isPending ? undefined : { scale: 1.01 }}
                      whileTap={avatarMutation.isPending ? undefined : { scale: 0.99 }}
                      transition={{ type: "spring", stiffness: 260, damping: 22 }}
                      disabled={avatarMutation.isPending || !avatarCroppedAreaPixels}
                      aria-busy={avatarMutation.isPending}
                      className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full bg-linear-to-r from-primary to-secondary px-6 text-sm font-semibold text-foreground shadow-lg shadow-black/20 transition enabled:hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={async () => {
                        if (!avatarCroppedAreaPixels) return;
                        try {
                          const blob = await getCroppedImageBlob(avatarEditorSrc, avatarCroppedAreaPixels);
                          const croppedFile = new File([blob], avatarEditorFilename, {
                            type: blob.type || "image/png",
                          });

                          const result = await avatarMutation.mutateAsync(croppedFile);
                          if (result.ok) {
                            closeAvatarEditor();
                          }
                        } catch {
                          // Keep UI simple: rely on existing page state; user can retry.
                        }
                      }}
                    >
                      {avatarMutation.isPending ? "Đang tải lên..." : "Lưu ảnh"}
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <form
            className="mt-8"
            onSubmit={async (event) => {
              event.preventDefault();

              const iso = dobIsoValue;
              const display = dobDisplayValue.trim();

              if (display && !iso) {
                setDobError("Ngày sinh không hợp lệ. Vui lòng nhập theo dd/mm/yyyy.");
                return;
              }

              if (iso) {
                const todayIso = new Date().toISOString().slice(0, 10);
                if (iso > todayIso) {
                  setDobError("Ngày sinh không hợp lệ.");
                  return;
                }
              }

              setDobError(null);

              const payload: NewUserInfo = {
                fullName: fullName.trim(),
                dateOfBirth: iso,
                gender: gender || "MALE",
              };

              if (!payload.fullName) {
                setSaveFeedback({ type: "error", message: "Vui lòng nhập họ và tên." });
                return;
              }

              if (!iso) {
                setSaveFeedback({ type: "error", message: "Ngày sinh không hợp lệ." });
                return;
              }

              setSaveFeedback(null);

              await saveMutation.mutateAsync(payload);
            }}
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold tracking-[0.18em] text-foreground/85">
                  HỌ VÀ TÊN
                </label>
                <input
                  name="fullName"
                  placeholder="Nhập họ và tên"
                  value={fullName}
                  onChange={(event) => setFullName(event.currentTarget.value)}
                  className="h-11 w-full rounded-full border border-border bg-white/5 px-4 text-sm text-foreground/90 outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold tracking-[0.18em] text-foreground/85">
                  EMAIL
                </label>
                <input
                  name="email"
                  type="email"
                  readOnly
                  placeholder="email@domain.com"
                  value={myInfo?.email ?? ""}
                  className="h-11 w-full cursor-not-allowed rounded-full border border-border bg-white/5 px-4 text-sm text-foreground/55 outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15"
                />
              </div>


              <div className="space-y-2">
                <label className="text-xs font-bold tracking-[0.18em] text-foreground/85">
                  NGÀY SINH
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="dd/mm/yyyy"
                    value={dobDisplayValue}
                    onChange={(event) => {
                      setDobError(null);
                      setDobFromDisplayInput(event.currentTarget.value);
                    }}
                    onBlur={() => {
                      const display = dobDisplayValue.trim();
                      if (!display) {
                        setDobError(null);
                        return;
                      }
                      if (!dobIsoValue) {
                        setDobError("Ngày sinh không hợp lệ. Vui lòng nhập theo dd/mm/yyyy.");
                        return;
                      }

                      const todayIso = new Date().toISOString().slice(0, 10);
                      if (dobIsoValue > todayIso) {
                        setDobError("Ngày sinh không hợp lệ.");
                        return;
                      }

                      setDobError(null);
                    }}
                    className="h-11 w-full rounded-full border border-border bg-white/5 px-4 pr-11 text-sm text-foreground/90 outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15"
                  />
                  <input
                    ref={dobPickerRef}
                    name="dateOfBirth"
                    type="date"
                    value={dobIsoValue}
                    onChange={(event) => {
                      setDobError(null);
                      setDobFromIso(event.currentTarget.value);
                    }}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="absolute left-0 top-0 h-0 w-0 opacity-0"
                  />
                  <button
                    type="button"
                    onClick={openDobPicker}
                    className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-foreground/85 transition hover:bg-surface-2/70 hover:text-foreground"
                    aria-label="Chọn ngày sinh"
                  >
                    <CalendarDays className="h-4 w-4" />
                  </button>
                </div>
                {dobError ? (
                  <p className="text-xs font-medium text-red-400">{dobError}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold tracking-[0.18em] text-foreground/85">
                  GIỚI TÍNH
                </label>
                <select
                  name="gender"
                  value={gender || "MALE"}
                  onChange={(event) => {
                    const next = event.currentTarget.value;
                    if (next === "MALE" || next === "FEMALE" || next === "OTHER") {
                      setGender(next);
                      return;
                    }
                    setGender("");
                  }}
                  className="h-11 w-full appearance-none rounded-full border border-border bg-white/5 px-4 text-sm text-foreground/90 outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/15"
                >
                  <option value="MALE" className="bg-surface">
                    Nam
                  </option>
                  <option value="FEMALE" className="bg-surface">
                    Nữ
                  </option>
                  <option value="OTHER" className="bg-surface">
                    Khác
                  </option>
                </select>
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <motion.button
                type="submit"
                whileHover={saveMutation.isPending ? undefined : { scale: 1.01 }}
                whileTap={saveMutation.isPending ? undefined : { scale: 0.99 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                disabled={saveMutation.isPending}
                aria-busy={saveMutation.isPending}
                className="cursor-pointer inline-flex h-11 items-center justify-center rounded-full bg-linear-to-r from-primary to-secondary px-6 text-sm font-semibold text-foreground shadow-lg shadow-black/20 transition enabled:hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saveMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
              </motion.button>
            </div>

            <div className="mt-4 min-h-6">
              {saveFeedback ? (
                <p
                  className={
                    "text-sm " +
                    (saveFeedback.type === "success" ? "text-green-400" : "text-red-400")
                  }
                >
                  {saveFeedback.type === "success"
                    ? "Cập nhật thông tin thành công"
                    : saveFeedback.message}
                </p>
              ) : null}
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
