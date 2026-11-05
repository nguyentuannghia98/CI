"use client";

import { useEffect, useState, memo } from "react";
import dynamic from "next/dynamic";
import AppLayout from "@/components/layouts/AppLayout";
import { useAuthActions, useIsAuthInitialized, useUser } from "@/components/auth/store/AuthStore"; 
import { useProductStore } from "@/lib/Zustard/store/useProductStore";

const FirebaseInit = dynamic(() => import("@/components/FirebaseInit"), {
  ssr: false,
});

const ProductDetailModal = dynamic(
  () => import("@/components/UniversalCard/ProductDetailModal").then(mod => mod.ProductDetailModal),
  { ssr: false }
);

const GlobalMiniChat = dynamic(() => import("@/components/MiniChat/GlobalMiniChat"), {
  ssr: false,
});

function ClientRootWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const { initialize } = useAuthActions();
  const isInitialized = useIsAuthInitialized();
  const currentUser = useUser();
  
  // ✅ Lấy danh sách sản phẩm tập trung từ Store
  const products = useProductStore((state) => state.products);
  const isModalOpen = useProductStore((state) => state.isModalOpen);

  useEffect(() => {
    setMounted(true);
    initialize();
  }, [initialize]);

  // Chống lỗi Hydration
  if (!mounted) return null;

  // Màn hình khởi tạo (Chỉ hiện khi chưa xong Auth)
  if (!isInitialized) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-orange-100 border-t-orange-500 rounded-full animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-tight">Đang khởi tạo NexLoot</p>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic">The Masterpiece is loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <FirebaseInit />
      <AppLayout>
        {children}
        
        {/* Chỉ tải và mount modal khi người dùng thực sự mở một sản phẩm */}
        {isModalOpen && (
          <ProductDetailModal 
            allProducts={products}
            currentUser={currentUser ? {
              id: currentUser.id,
              username: currentUser.user_metadata?.username || "Thành viên",
              avatar_url: currentUser.user_metadata?.avatar_url || null
            } : null} 
          />
        )}

        <GlobalMiniChat />
      </AppLayout>
    </>
  );
}

export default memo(ClientRootWrapper);