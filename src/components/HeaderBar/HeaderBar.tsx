"use client";

import React, { useState, useCallback, memo, forwardRef, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LayoutGrid, Grid, Menu as MenuIcon, Loader2 } from "lucide-react";
import SearchBar from "@/components/Search/components/SearchBar";
import { useScrollHeader } from "@/components/HeaderBar/hooks/useScrollHeader";
import { HeaderProps } from "@/components/HeaderBar/types/types";
import { CategoryPanel } from "@/components/HeaderBar/components/CategoryPanel";
import { UserProfilePanel } from "@/components/HeaderBar/components/UserProfilePanel";
import UserMenu from "@/components/UserMenu/UserMenu";
import { useHeaderData } from "@/components/HeaderBar/hooks/useHeaderData";

// --- IMPORT ZUSTARD Ở ĐÂY ---
import { useViewStore } from "@/lib/Zustard/store/useViewStore";

/* ================= SUB-COMPONENTS ================= */

const MemoizedCategoryPanel = memo(CategoryPanel);
const MemoizedUserProfilePanel = memo(UserProfilePanel);

/* ================= MAIN COMPONENT ================= */

const HeaderBar = forwardRef<HTMLDivElement, HeaderProps>(
  ({ setSelectedCategory }, ref) => {
    const router = useRouter();
    const pathname = usePathname();
    const { showHeader } = useScrollHeader();
    const { userData, branches, loading } = useHeaderData();

    // --- LOGIC ZUSTARD ---
    // biggerGrid bây giờ sẽ đại diện cho viewMode === 'grid'
    const viewMode = useViewStore((state) => state.viewMode);
    const setViewMode = useViewStore((state) => state.setViewMode);
    
    // Giữ tên biến biggerGrid để không phải sửa UI bên dưới
    const biggerGrid = viewMode === 'grid';
    
    const handleToggleGrid = () => {
      // Nếu đang grid thì đổi thành list, và ngược lại
      setViewMode(viewMode === 'grid' ? 'list' : 'grid');
    };

    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const navResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      setIsNavigating(false);
      if (navResetRef.current) clearTimeout(navResetRef.current);
    }, [pathname]);

    useEffect(() => {
      return () => {
        if (navResetRef.current) clearTimeout(navResetRef.current);
      };
    }, []);

    const handleBranchNavigation = useCallback((branchId: string) => {
      if (pathname !== `/category/${branchId}`) {
        setIsNavigating(true);
        setSelectedCategory?.(branchId);
        router.push(`/category/${branchId}`);
      }
      setIsPanelOpen(false);
      if (navResetRef.current) clearTimeout(navResetRef.current);
      navResetRef.current = setTimeout(() => setIsNavigating(false), 5000);
    }, [router, setSelectedCategory, pathname]);

    if (loading && branches.length === 0) {
      return <div className="h-[60px] md:h-[64px] w-full bg-white border-b border-gray-100 sticky top-0" />;
    }

    return (
      <>
        {/* Loading Overlay */}
        {isNavigating && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-[#ff4500]" size={32} />
              <p className="text-[13px] font-medium text-gray-500 uppercase tracking-widest">Đang tải</p>
            </div>
          </div>
        )}

        <header
          ref={ref}
          className={`fixed top-0 right-0 z-[50] bg-white border-b border-gray-100
          transition-transform duration-300 ease-in-out left-0 md:left-[250px]
          ${showHeader ? "translate-y-0" : "max-md:-translate-y-full"}`}
        >
          {/* ----- MOBILE VIEW ----- */}
          <div className="md:hidden flex flex-col bg-white">
            <div className="flex items-center px-4 h-[60px] gap-3">
              <button
                type="button"
                onClick={() => setIsPanelOpen(true)}
                aria-label="Mở danh mục"
                className="p-2 -ml-2 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <MenuIcon size={24} />
              </button>
              <div className="flex-grow">
                <SearchBar key={userData?.id} userId={userData?.id || "guest"} onSearch={() => {}} />
              </div>
              <UserMenu variant="mobile" onOpenMobilePanel={() => setIsUserPanelOpen(true)} />
            </div>
          </div>

          {/* ----- DESKTOP VIEW ----- */}
          <div className="hidden md:flex items-center h-[64px] bg-white">
            <div className="flex flex-grow items-center px-8 min-w-0 h-full">
              
              {/* Cột trái: Spacer để cân bằng SearchBar ở giữa */}
              <div className="flex-1" />

              {/* 1. Thanh tìm kiếm - Căn giữa tuyệt đối */}
              <div className="w-full max-w-[600px] shrink-0 mx-4">
                <SearchBar key={userData?.id} userId={userData?.id || "guest"} onSearch={() => {}} />
              </div>
              
              {/* Cột phải: Chứa nút Hiển thị, đẩy về sát bên phải */}
              <div className="flex-1 flex justify-end">
                {/* 2. NÚT HIỂN THỊ */}
                <button
                  type="button"
                  onClick={handleToggleGrid}
                  className="group flex items-center gap-2.5 px-4 py-2 rounded-full
                             text-gray-500 hover:text-[#ff4500] hover:bg-[#ff4500]/10
                             transition-all duration-200 shrink-0 active:scale-95 cursor-pointer"
                  title={biggerGrid ? "Chế độ lưới nhỏ" : "Chế độ lưới lớn"}
                >
                  <div className="relative w-[20px] h-[20px] flex items-center justify-center">
                    {biggerGrid ? (
                      <Grid size={20} className="transition-transform duration-200 rotate-0 text-[#ff4500]" />
                    ) : (
                      <LayoutGrid size={20} className="transition-transform duration-200 scale-110" />
                    )}
                  </div>
                  <span className="hidden lg:inline text-[14px] font-semibold tracking-tight">
                    Hiển thị
                  </span>
                </button>
              </div>
            </div>

            {/* Cụm UserMenu cố định bên phải */}
            <div className="px-6 flex items-center justify-center border-l border-gray-100 shrink-0">
              <UserMenu variant="desktop" />
            </div>
          </div>
        </header>

        {/* Spacer */}
        <div className="h-[60px] md:h-[64px] w-full shrink-0" aria-hidden="true" />

        <MemoizedCategoryPanel
          isOpen={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
          branches={branches}
          onSelectBranch={handleBranchNavigation}
        />

        <MemoizedUserProfilePanel
          isOpen={isUserPanelOpen}
          onClose={() => setIsUserPanelOpen(false)}
          userData={userData}
        />
      </>
    );
  }
);

HeaderBar.displayName = "HeaderBar";
export default HeaderBar;