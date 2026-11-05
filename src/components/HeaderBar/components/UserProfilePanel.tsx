"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  ChevronRight,
  User,
  LogOut,
} from "lucide-react";

// Sửa thành chữ u viết thường:
import UserAvatar from '@/components/UserAvatar/UserAvatar';
import { createClient } from "@/lib/supabase/client"; 
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/UserMenu/ThemeToggle";

type UserProfilePanelProps = {
  isOpen: boolean;
  onClose: () => void;
  userData: {
    id?: string;
    username?: string | null;
    avatar_url?: string | null;
    email?: string | null;
    is_online?: boolean | string | null;
  } | null;
};

export const UserProfilePanel = ({
  isOpen,
  onClose,
  userData,
}: UserProfilePanelProps) => {
  const router = useRouter();
  const supabase = createClient();
  const [myEmail, setMyEmail] = useState<string | null>(null);

  useEffect(() => {
    const getMySession = async () => {
      const { data } = await supabase.auth.getUser();
      setMyEmail(data.user?.email || null);
    };
    
    if (isOpen) { // Chỉ gọi session khi panel mở để tối ưu performance
      getMySession();
    }
  }, [supabase, isOpen]); // Thêm isOpen vào dependency

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
    router.push("/");
    router.refresh();
  };

  const navigateTo = (path: string) => {
    onClose();
    router.push(path);
  };

  const profileHref = userData?.id ? `/profile/${userData.id}` : "/login";

  const menuItems = [
    { icon: <User size={20} />, label: "Hồ sơ của tôi", href: profileHref },
  ];

  const displayName = userData?.username || userData?.email?.split('@')[0] || "Người dùng";
  const finalAvatarUrl = userData?.avatar_url || null;
  
  const isActuallyOnline = 
    userData?.is_online === true || 
    userData?.is_online === "true" || 
    (userData?.email === myEmail && myEmail !== null);

  return (
    <>
      <div
        className={`fixed inset-0 z-[100] bg-black/50 transition-opacity duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 right-0 z-[110] w-[85%] max-w-[300px] bg-white dark:bg-gray-900 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-800 bg-white dark:bg-gray-900">
          <span className="text-xl font-bold text-gray-900 dark:text-white">Tài khoản</span>
          <button onClick={onClose} aria-label="Đóng" className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400">
            <X size={24} />
          </button>
        </div>

        <div
          onClick={() => navigateTo(profileHref)}
          className="p-6 flex flex-col items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
        >
          <div className="relative mb-3">
            <UserAvatar
              avatarUrl={finalAvatarUrl}
              size="lg"
              name={displayName}
              className="border-2 border-orange-100 group-hover:border-orange-300 transition-all"
            />
            {isActuallyOnline && (
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full"></span>
            )}
          </div>
          
          <span className="font-semibold text-gray-800 dark:text-gray-100 text-center">
            {displayName}
          </span>
          
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`w-2 h-2 rounded-full ${isActuallyOnline ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}></span>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {isActuallyOnline ? "Đang hoạt động" : "Ngoại tuyến"}
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto bg-white dark:bg-gray-900 py-2 no-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigateTo(item.href)}
              className="w-full flex items-center justify-between px-6 py-4 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 group"
            >
              <div className="flex items-center gap-4">
                <span className="text-gray-400 group-hover:text-gray-600">{item.icon}</span>
                <span className="font-medium text-[15px]">{item.label}</span>
              </div>
              <ChevronRight size={18} className="text-gray-300 group-hover:translate-x-1 transition-transform" />
            </button>
          ))}

          <div className="mt-4 pt-2 border-t dark:border-gray-800">
            <ThemeToggle />

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-6 py-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium text-[15px]">Đăng xuất</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};