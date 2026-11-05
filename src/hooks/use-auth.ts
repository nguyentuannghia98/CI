"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client"; // Sử dụng hàm tạo client mới
import { useEffect, useMemo } from "react";
import { useAuthActions } from "@/components/auth/store/AuthStore";

export const AUTH_QUERY_KEY = ["auth-user"];

export function useAuth() {
  const queryClient = useQueryClient();
  const { setAuth } = useAuthActions();
  
  // Khởi tạo supabase instance ổn định
  const supabase = useMemo(() => createClient(), []);

  const query = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      // 1. Ưu tiên lấy User từ getUser() để đảm bảo tính an toàn (Server-side validation)
      // getUser() sẽ gửi request lên Supabase để verify token thay vì chỉ đọc từ LocalStorage
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        setAuth(null);
        return null;
      }

      // 2. Đồng bộ hóa Zustand
      setAuth(user); 
      return user;
    },
    staleTime: 1000 * 60 * 15, // 15 phút (giảm xuống một chút để an toàn hơn)
    gcTime: 1000 * 60 * 60,    // 1 giờ
    retry: false,              // Không cần retry nếu lỗi auth
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const newUser = session?.user ?? null;

      // Cập nhật đồng thời cả 2 state manager
      queryClient.setQueryData(AUTH_QUERY_KEY, newUser);
      setAuth(newUser);

      // Xử lý các sự kiện cụ thể
      if (event === "SIGNED_OUT") {
        queryClient.clear(); 
        queryClient.setQueryData(AUTH_QUERY_KEY, null);
      } 
      
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // Làm mới các dữ liệu phụ thuộc vào User ID
        queryClient.invalidateQueries({ queryKey: ["user-communities"] });
        queryClient.invalidateQueries({ queryKey: ["auth-user"] });
      }
    });

    return () => subscription.unsubscribe();
  }, [queryClient, setAuth, supabase]);

  return {
    user: query.data ?? null,
    userId: query.data?.id ?? null,
    isLoading: query.isLoading,
    isAuthenticated: !!query.data,
    // Trạng thái này cực kỳ quan trọng để chặn Flash of Unauthenticated Content (FOUC)
    isInitialLoading: query.isPending, 
  };
}