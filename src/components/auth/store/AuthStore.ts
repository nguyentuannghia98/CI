"use client";

import { create } from 'zustand';
import { User, Subscription } from '@supabase/supabase-js';
import { createClient } from "@/lib/supabase/client";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  subscription: Subscription | null; // Lưu để quản lý dọn dẹp bộ nhớ
  actions: {
    setAuth: (user: User | null) => void;
    logout: () => Promise<void>;
    initialize: () => () => void; // Trả về hàm cleanup để dùng trong useEffect
  };
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  subscription: null,

  actions: {
    setAuth: (user) => {
      const { user: currentUser, isInitialized } = get();
      
      // Tối ưu Performance: Chỉ cập nhật nếu thực sự có sự thay đổi ID
      if (isInitialized && currentUser?.id === user?.id) return;

      set({ 
        user, 
        isAuthenticated: !!user,
        isInitialized: true 
      });
    },

    initialize: () => {
      // Ngăn chặn khởi tạo nhiều lần trên Client
      if (typeof window === "undefined" || get().subscription) return () => {};

      const supabase = createClient();

      // 1. Lấy user đã xác minh ngay khi khởi động
      supabase.auth.getUser().then(({ data: { user } }) => {
        get().actions.setAuth(user ?? null);
      });

      // 2. Thiết lập Listener lắng nghe thay đổi (Login/Logout/Token Refresh)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        console.debug(`[Auth] Event: ${event}`);
        
        if (event === 'SIGNED_OUT') {
          set({ user: null, isAuthenticated: false, isInitialized: true });
        } else {
          get().actions.setAuth(session?.user ?? null);
        }
      });

      set({ subscription });

      // TRẢ VỀ HÀM CLEANUP: Rất quan trọng để tránh Memory Leak khi component unmount
      return () => {
        subscription.unsubscribe();
        set({ subscription: null });
      };
    },

    logout: async () => {
      try {
        const supabase = createClient();
        
        // Optimistic UI: Xóa trạng thái ngay lập tức để người dùng cảm thấy mượt mà
        set({ user: null, isAuthenticated: false });
        
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        // Điều hướng mượt mà hoặc reload nếu cần xóa sạch cache RAM
        window.location.href = "/"; 
      } catch (error) {
        console.error("Lỗi khi đăng xuất:", error);
      }
    },
  },
}));

// --- Export chuẩn để sử dụng trong dự án ---
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsAuthInitialized = () => useAuthStore((state) => state.isInitialized);
export const useAuthActions = () => useAuthStore((state) => state.actions);

export { useAuthStore };