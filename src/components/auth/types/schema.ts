import { z } from "zod";

/**
 * 1. Login Schema
 */
export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email không được để trống")
    .email("Email không hợp lệ"),
  password: z
    .string()
    .min(6, "Mật khẩu phải ít nhất 6 ký tự"),
});

export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * 2. SignUp Schema
 * Bao gồm xác nhận mật khẩu và logic kiểm tra khớp mật khẩu
 */
export const SignUpSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, "Email không được để trống")
      .email("Email không hợp lệ"),
    password: z
      .string()
      .min(6, "Mật khẩu phải ít nhất 6 ký tự"),
    confirmPassword: z
      .string()
      .min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export type SignUpInput = z.infer<typeof SignUpSchema>;

/**
 * 3. Forgot Password Schema
 */
export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email không được để trống")
    .email("Email không hợp lệ"),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

/**
 * 4. Update Password Schema (Dùng khi người dùng click từ mail về)
 */
export const UpdatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, "Mật khẩu mới phải ít nhất 6 ký tự"),
    confirmPassword: z
      .string()
      .min(1, "Vui lòng xác nhận mật khẩu mới"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export type UpdatePasswordInput = z.infer<typeof UpdatePasswordSchema>;