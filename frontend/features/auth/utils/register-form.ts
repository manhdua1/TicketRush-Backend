import type { RegisterGender, RegisterRequest } from "@/features/auth/services/register";
import { parseDobToIso } from "@/features/auth/utils/date-of-birth";
import {
  isPasswordLengthValid,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/features/auth/utils/password_validation";

export type RegisterFormFields = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirthRaw: string;
  genderRaw: string;
  otp: string;
};

export function mapGenderRawToApiGender(genderRaw: string): RegisterGender {
  return genderRaw === "female"
    ? "FEMALE"
    : genderRaw === "other"
      ? "OTHER"
      : "MALE";
}

export function buildRegisterRequest(fields: RegisterFormFields): {
  request: RegisterRequest | null;
  errorMessage: string | null;
} {
  const fullName = fields.fullName.trim();
  if (!fullName) {
    return { request: null, errorMessage: "Họ và tên không được để trống" };
  }

  const email = fields.email.trim();
  if (!email) {
    return { request: null, errorMessage: "Email không được để trống" };
  }

  if (!isPasswordLengthValid(fields.password)) {
    return {
      request: null,
      errorMessage: `Mật khẩu chỉ trong khoảng ${PASSWORD_MIN_LENGTH} đến ${PASSWORD_MAX_LENGTH} kí tự`,
    };
  }

  if (fields.password !== fields.confirmPassword) {
    return {
      request: null,
      errorMessage: "Nhập lại mật khẩu không khớp",
    };
  }

  const dateOfBirth = parseDobToIso(fields.dateOfBirthRaw);
  if (!dateOfBirth) {
    return {
      request: null,
      errorMessage: "Ngày sinh không hợp lệ",
    };
  }

  const otp = fields.otp.trim();
  if (!/^\d{6}$/.test(otp)) {
    return {
      request: null,
      errorMessage: "Mã OTP phải gồm 6 chữ số",
    };
  }

  return {
    request: {
      fullName,
      email,
      password: fields.password,
      dateOfBirth,
      gender: mapGenderRawToApiGender(fields.genderRaw),
      otp,
    },
    errorMessage: null,
  };
}
