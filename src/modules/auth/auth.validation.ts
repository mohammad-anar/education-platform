import { z } from "zod";

const registerZodSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  avatarUrl: z.string().url().optional(),
  roleCode: z.string().optional(),
  instituteId: z.string().uuid().optional(),
});

const loginZodSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

const changePasswordZodSchema = z.object({
  oldPassword: z.string().min(1, "Old password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

const forgotPasswordZodSchema = z.object({
  email: z.string().email("Valid email is required"),
});

const resetPasswordZodSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

const refreshTokenZodSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

const sendOtpZodSchema = z.object({
  email: z.string().email("Valid email is required"),
});

const verifyOtpZodSchema = z.object({
  email: z.string().email("Valid email is required"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const AuthValidation = {
  registerZodSchema,
  loginZodSchema,
  changePasswordZodSchema,
  forgotPasswordZodSchema,
  resetPasswordZodSchema,
  refreshTokenZodSchema,
  sendOtpZodSchema,
  verifyOtpZodSchema,
};

export default AuthValidation;
