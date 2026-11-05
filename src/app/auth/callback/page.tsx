"use client";

import { useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { isSafeInternalPath } from "@/lib/auth/safe-path";

export default function AuthCallback() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isProcessed = useRef(false);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const handleCallback = async () => {
      // Tránh chạy 2 lần trong Strict Mode
      if (isProcessed.current) return;
      isProcessed.current = true;

      const code = new URL(window.location.href).searchParams.get("code");

      try {
        if (code) {
          // 1. Đổi mã lấy session - Đảm bảo await hoàn tất
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          
          // 2. Xóa sạch cache cũ để Query Client lấy dữ liệu user mới
          queryClient.clear();
          
          // 3. QUAN TRỌNG: Làm mới Server Components để nhận diện Cookies mới
          router.refresh();
        }
      } catch (error) {
        console.error("Auth callback error:", error);
      } finally {
        // 4. Lấy redirect path và dọn dẹp localStorage
        const redirect = localStorage.getItem("redirectAfterLogin") || "/";
        localStorage.removeItem("redirectAfterLogin");

        // 5. Chỉ cho phép đường dẫn nội bộ (chống open redirect)
        router.replace(isSafeInternalPath(redirect) ? redirect : "/");
      }
    };

    handleCallback();
  }, [router, queryClient, supabase]);

  // Hiển thị trạng thái chờ tối giản để người dùng không thấy trang trắng
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>
  );
}