import * as z from "zod";

// Định nghĩa Schema cho Login
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email không được để trống" })
    .email({ message: "Email không đúng định dạng" }),
  password: z
    .string()
    .min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" })
    .max(100),
});

// Tạo Type từ Schema để dùng cho React Hook Form
export type LoginInput = z.infer<typeof loginSchema>;