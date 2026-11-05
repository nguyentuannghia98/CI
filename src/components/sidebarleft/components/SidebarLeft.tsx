"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Home, Coins, Compass, MessageSquare, Newspaper, Info, Phone, ShieldCheck, Briefcase, PlusSquare, LucideIcon } from "lucide-react"; 
import { useSidebarData } from "@/components/sidebarleft/hooks/useSidebarData";
import { useChat } from "@/components/MiniChat/ChatContext";
import { requestForToken } from "@/lib/firebase-config";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import SidebarMainNav from "./SidebarMainNav";
import SidebarCommunity from "./SidebarCommunity";
import MessagesPanel from "./MessagesPanel";
import NewsPanel from "./NewsPanel";
import Logo from "@/components/sidebarleft/components/logo";
import PostModal from "@/components/sidebarleft/components/PostModal";

// Định nghĩa kiểu dữ liệu để tránh lỗi Property 'isPanel'/'path' does not exist
interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path?: string;
  isPanel?: boolean;
  badge?: number;
}

export default function SidebarLeft() {
  const { conversations, unreadCount, clearUnread } = useSidebarData();
  const { openChat } = useChat();
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getUser();
  }, [supabase]);

  const { data: newsUnreadCount = 0 } = useQuery({
    queryKey: ["notifications", currentUserId, "unread-count"],
    queryFn: async () => {
      if (!currentUserId) return 0;
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("read", false)
        .or(`user_id.eq.${currentUserId},user_id.is.null`);
      
      if (error) return 0;
      return count || 0;
    },
    enabled: !!currentUserId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (activePanel) {
      document.body.style.setProperty("overflow", "hidden");
    } else {
      document.body.style.removeProperty("overflow");
    }
    return () => {
      document.body.style.removeProperty("overflow");
    };
  }, [activePanel]);

  useEffect(() => {
    setActivePanel(null);
  }, [pathname]);

  const enableNotifications = useCallback(async () => {
    try {
      if (typeof window === "undefined" || !("Notification" in window)) return;
      if (Notification.permission === "default") {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          const token = await requestForToken();
          const { data: { user } } = await supabase.auth.getUser();
          if (token && user) {
            await supabase.from("user_tokens").upsert(
              { user_id: user.id, fcm_token: token },
              { onConflict: "user_id" }
            );
          }
        }
      }
    } catch (error) {
      console.error("Lỗi kích hoạt thông báo:", error);
    }
  }, [supabase]);

  const navItems: NavItem[] = useMemo(() => [
    { id: "home_page", label: "Trang chủ", icon: Home, path: "/" },
    { id: "home", label: "Giao Thương", icon: Coins, path: "/giao-thuong" },
    { id: "discovery", label: "Khám phá", icon: Compass, path: "/discovery" },
    { id: "messages", label: "Tin nhắn", icon: MessageSquare, isPanel: true, badge: unreadCount },
    { id: "news", label: "Thông báo", icon: Newspaper, isPanel: true, badge: newsUnreadCount },
    
    { id: "about", label: "Giới thiệu", icon: Info, path: "/about" },
    { id: "contact", label: "Liên hệ", icon: Phone, path: "/contact" },
    { id: "policy", label: "Chính sách", icon: ShieldCheck, path: "/policies" },
    { id: "careers", label: "Tuyển dụng", icon: Briefcase, path: "/careers" },
  ], [unreadCount, newsUnreadCount]);

  const handleNavClick = useCallback(async (item: NavItem) => {
    if (item.id === "post") {
      setIsPostModalOpen(true);
      return;
    }

    if (item.isPanel) {
      setActivePanel(prev => prev === item.id ? null : item.id);
      if (item.id === "news" || item.id === "messages") {
        enableNotifications();
      }
    } else if (item.path) {
      setActivePanel(null);
      router.push(item.path);
    }
  }, [router, enableNotifications]);

  if (!isMounted) return <div className="hidden md:block w-full h-full border-r" style={{ backgroundColor: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-main), 0.3)' }} />;

  // Tạo danh sách riêng cho Mobile bao gồm nút Đăng bài ở giữa
  const mobileNavItems: NavItem[] = [
    navItems[0], // Trang chủ
    navItems[1], // Giao Thương
    { id: "post", label: "Đăng bài", icon: PlusSquare }, // Nút mở modal
    navItems[2], // Khám phá
    navItems[3], // Tin nhắn
    navItems[4], // Thông báo (trước đây chỉ có trên desktop -> mobile không xem được)
  ];

  return (
    <>
      <aside 
        className="hidden md:flex flex-col w-full h-full border-r overflow-hidden transition-colors duration-300" 
        style={{ backgroundColor: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-main), 0.3)' }}
      >
        <div className="mt-6 mb-4 px-6 shrink-0">
          <Logo />
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain pb-10 custom-scrollbar">
          {/* 1. Main Nav (Home, Giao Thương, Discovery, Messages, News) */}
          <SidebarMainNav 
            activePanel={activePanel} 
            setActivePanel={setActivePanel} 
            unreadCount={unreadCount}
            newsUnreadCount={newsUnreadCount}
          />
          
          {/* 2. Phần Cộng đồng */}
          <div className="mt-4">
            <SidebarCommunity />
          </div>

          {/* 3. Các nút bổ sung (Giới thiệu, Liên hệ, Chính sách, Tuyển dụng) */}
          <div className="mt-4 px-3 flex flex-col gap-1 border-t pt-4 border-[rgba(var(--border-main),0.1)]">
            {navItems.slice(5).map((item) => {
              const Icon = item.icon;
              const isActive = item.path ? pathname.startsWith(item.path) : false;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] w-full group cursor-pointer"
                >
                  <Icon 
                    size={22} 
                    strokeWidth={isActive ? 2.5 : 2} 
                    style={{ color: isActive ? '#c2410c' : 'rgb(var(--text-muted))' }}
                    className="group-hover:scale-110 transition-transform"
                  />
                  <span 
                    className={`text-[14px] transition-colors ${isActive ? 'font-bold' : 'font-medium'}`}
                    style={{ color: isActive ? '#c2410c' : 'rgb(var(--text-main))' }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Mobile Nav hiển thị các nút chính: Trang chủ, Giao Thương, Đăng bài, Khám phá, Tin nhắn, Thông báo */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 w-full min-h-[72px] border-t flex items-center justify-around z-[50] px-1 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)] transition-colors duration-300 overflow-x-auto no-scrollbar"
        style={{ backgroundColor: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-main), 0.3)' }}
      >
        {mobileNavItems.map((item) => {
          const isActive = item.isPanel 
            ? activePanel === item.id 
            : (item.path ? pathname === item.path : false) && !activePanel;

          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className="relative flex flex-col items-center justify-center gap-1 h-full min-w-[60px] px-1 transition-all duration-200 cursor-pointer"
              style={{ color: isActive ? 'rgb(var(--text-main))' : 'rgb(var(--text-muted))' }}
            >
              <div className="relative">
                <Icon 
                  size={24} 
                  strokeWidth={isActive ? 2.5 : 2} 
                  style={{ color: isActive ? '#c2410c' : 'inherit' }} 
                />
                {item.badge ? (
                  <span 
                    className="absolute -top-1.5 -right-2.5 text-white text-[9px] rounded-full min-w-[17px] h-[17px] flex items-center justify-center border-2 font-black bg-red-500"
                    style={{ borderColor: 'rgb(var(--bg-card))' }}
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                ) : null}
              </div>
              <span className={`text-[11px] font-bold tracking-tight whitespace-nowrap transition-opacity ${isActive ? 'opacity-100' : 'opacity-90'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <MessagesPanel
        open={activePanel === "messages"}
        setOpen={(val) => setActivePanel(val ? "messages" : null)}
        conversations={conversations}
        onSelect={(id) => { 
          openChat(id); 
          clearUnread(id); 
          setActivePanel(null); 
        }}
        activePanel={activePanel}
        setActivePanel={setActivePanel}
        clearUnread={clearUnread}
      />

      <NewsPanel
        open={activePanel === "news"}
        setOpen={(val) => setActivePanel(val ? "news" : null)}
        setActivePanel={setActivePanel}
      />

      {/* Modal đăng bài - Đã thêm userId để sửa lỗi missing property */}
      <PostModal 
        isOpen={isPostModalOpen} 
        onClose={() => setIsPostModalOpen(false)} 
        userId={currentUserId || ""}
      />
    </>
  );
}