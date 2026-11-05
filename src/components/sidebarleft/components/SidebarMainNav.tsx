"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Home,
  Coins,
  Compass,
  MessageSquare,
  Newspaper,
  PlusSquare,
  Gavel,
  Swords,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuthModalStore } from "@/components/auth/store/useAuthModalStore";
import QuickPostModal from "./PostModal"; 
import { useCurrentUser } from "@/components/MiniChat/MiniChatBox/hooks/useCurrentUser";

type SidebarMainNavProps = {
  activePanel: string | null;
  setActivePanel: (panel: string | null) => void;
  unreadCount?: number;
  newsUnreadCount?: number; // Thêm prop này để nhận dữ liệu từ SidebarLeft
};

export default function SidebarMainNav({
  activePanel,
  setActivePanel,
  unreadCount = 0,
  newsUnreadCount = 0, // Nhận giá trị mặc định là 0
}: SidebarMainNavProps) {
  const [showQuickPost, setShowQuickPost] = useState(false); 
  const pathname = usePathname();
  
  const currentUserId = useCurrentUser();
  const openLogin = useAuthModalStore((state) => state.openLogin);

  const requireAuth = (callback: () => void) => {
    if (!currentUserId) {
      openLogin();
      return;
    }
    callback();
  };

  const togglePanel = (panelName: string) => {
    setActivePanel(activePanel === panelName ? null : panelName);
  };

  const itemClass =
    "flex items-center gap-4 px-5 py-3 mx-2 rounded-xl transition-all duration-200 cursor-pointer group !text-gray-600 hover:bg-gray-50 hover:!text-gray-900";

  const activeClass = "bg-orange-50 !text-orange-700 hover:bg-orange-50";

  return (
    <>
      <nav className="mt-4 space-y-1">
        {/* Trang chủ */}
        <Link 
          href="/" 
          className={`${itemClass} ${pathname === "/" && !activePanel ? activeClass : ""}`}
          onClick={() => setActivePanel(null)}
        >
          <Home className="w-6 h-6" />
          <span className="font-bold">Trang chủ</span>
        </Link>

        {/* Giao Thương */}
        <Link 
          href="/giao-thuong" 
          className={`${itemClass} ${pathname === "/giao-thuong" && !activePanel ? activeClass : ""}`}
          onClick={() => setActivePanel(null)}
        >
          <Coins className="w-6 h-6" />
          <span className="font-bold">Giao Thương</span>
        </Link>

        {/* Khám phá */}
        <Link 
          href="/discovery" 
          className={`${itemClass} ${pathname === "/discovery" && !activePanel ? activeClass : ""}`}
          onClick={() => setActivePanel(null)}
        >
          <Compass className="w-6 h-6" />
          <span className="font-bold">Khám phá</span>
        </Link>

        {/* Đấu giá */}
        <Link 
          href="/auction" 
          className={`${itemClass} ${pathname === "/auction" && !activePanel ? activeClass : ""}`}
          onClick={() => setActivePanel(null)}
        >
          <Gavel className="w-6 h-6" />
          <span className="font-bold">Đấu giá</span>
        </Link>

        {/* Sàn đấu */}
        <Link 
          href="/arena" 
          className={`${itemClass} ${pathname === "/arena" && !activePanel ? activeClass : ""}`}
          onClick={() => setActivePanel(null)}
        >
          <Swords className="w-6 h-6" />
          <span className="font-bold">Sàn đấu</span>
        </Link>

        {/* Đăng bài */}
        <div
          onClick={() => requireAuth(() => {
            setActivePanel(null);
            setShowQuickPost(true); 
          })}
          className={`${itemClass} ${showQuickPost ? activeClass : ""}`}
        >
          <PlusSquare className="w-6 h-6" />
          <span className="font-bold">Đăng bài</span>
        </div>

        {/* Tin nhắn */}
        <div
          onClick={() => requireAuth(() => togglePanel("messages"))}
          className={`${itemClass} relative ${activePanel === "messages" ? activeClass : ""}`}
        >
          <MessageSquare className="w-6 h-6" />
          <span className="font-bold">Tin nhắn</span>
          {unreadCount > 0 && (
            <span className="absolute right-4 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>

        {/* Thông báo */}
        <div
          onClick={() => requireAuth(() => togglePanel("news"))}
          className={`${itemClass} relative ${activePanel === "news" ? activeClass : ""}`}
        >
          <Newspaper className="w-6 h-6" />
          <span className="font-bold">Thông báo</span>
          {/* HIỂN THỊ CHẤM ĐỎ THÔNG BÁO TẠI ĐÂY */}
          {newsUnreadCount > 0 && (
            <span className="absolute right-4 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-white animate-in zoom-in">
              {newsUnreadCount > 9 ? "9+" : newsUnreadCount}
            </span>
          )}
        </div>
      </nav>

      {/* --- RENDER MODALS --- */}

      {/* QuickPostModal sử dụng userId từ hook, điều khiển qua state showQuickPost */}
      {currentUserId && (
        <QuickPostModal 
          isOpen={showQuickPost}
          userId={currentUserId} 
          onClose={() => setShowQuickPost(false)}
          onPostCreated={() => {
            setShowQuickPost(false);
            // Bạn có thể thêm Toast thông báo thành công ở đây
          }}
        />
      )}
    </>
  );
}