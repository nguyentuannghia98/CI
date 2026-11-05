"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client"; // Đã sửa: Import hàm createClient
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldCheck, Lock } from "lucide-react";

// Schema bảo mật hơn với xác nhận mật khẩu
const updatePasswordSchema = z
  .object({
    password: z.string().min(6, "Mật khẩu mới phải ít nhất 6 ký tự"),
    confirmPassword: z.string().min(6, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>;

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Khởi tạo supabase instance bên trong component
  const supabase = useMemo(() => createClient(), []);

  // 1. Kiểm tra session khi vào trang.
  //    Link khôi phục (PKCE) mang ?code= — thư viện supabase tự đổi code lấy session khi khởi tạo,
  //    và getUser() sẽ chờ quá trình khởi tạo hoàn tất nên không cần đổi code thủ công.
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Nếu không có session (link hết hạn hoặc truy cập lậu), đá về trang chủ
        router.replace("/?error=invalid-reset-link");
      }
    };

    checkSession();
  }, [router, supabase]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePasswordValues>({
    resolver: zodResolver(updatePasswordSchema),
  });

  const onSubmit = async (values: UpdatePasswordValues) => {
    try {
      setLoading(true);
      setErrorMsg("");

      const { error } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (error) throw error;

      setIsSuccess(true);
      
      // Chuyển hướng sau 2 giây để user kịp thấy thông báo thành công
      setTimeout(() => {
        router.push("/");
      }, 2000);

    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Đã có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-black">
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xl text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="text-green-600 w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Thành công!</h2>
          <p className="text-gray-500">Mật khẩu của bạn đã được cập nhật. Đang quay lại trang chủ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-black">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 transition-all">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Lock className="w-6 h-6 text-indigo-600" /> Đặt lại mật khẩu
          </h1>
          <p className="text-gray-500 text-sm mt-2">Đảm bảo mật khẩu mới của bạn có tính bảo mật cao.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {errorMsg && (
            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-center font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Mật khẩu mới</label>
            <input
              type="password"
              {...register("password")}
              disabled={loading}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-500 text-[11px] mt-1 italic">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5 text-gray-700 dark:text-gray-300">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              {...register("confirmPassword")}
              disabled={loading}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="••••••••"
            />
            {errors.confirmPassword && <p className="text-red-500 text-[11px] mt-1 italic">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Cập nhật mật khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
}