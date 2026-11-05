"use client";

import { useState } from "react"; // 1. Sửa lỗi require
import { createClient } from "@/lib/supabase/client";
import { useChat } from "@/components/MiniChat/ChatContext";
import { useQuery } from "@tanstack/react-query";
import type { Product } from "@/types";

// ✅ Types chuẩn hóa
export interface UserProfile {
  id: string;
  username: string | null;
  email: string | null;
  avatar_url: string | null;
}

// Sử dụng Omit hoặc Partial nếu dữ liệu Supabase trả về không đầy đủ so với Type Product
// Hoặc ép kiểu qua 'as unknown' để TS bỏ qua kiểm tra nghiêm ngặt nếu bạn chắc chắn data có đủ
export interface ProductWithUser extends Product {
  users: { username: string | null; avatar_url: string | null } | null;
}

export function useOtherUserProfile(targetId: string | undefined) {
  const supabase = createClient();
  const { openChat, isOpen, focusChat } = useChat();

  // 1. QUERY: LẤY USER HIỆN TẠI
  const { data: currentUser } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    staleTime: Infinity,
  });

  // 2. QUERY: THÔNG TIN TRANG CÁ NHÂN
  const profileQuery = useQuery({
    queryKey: ["user-profile", targetId],
    queryFn: async () => {
      if (!targetId) return null;
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", targetId)
        .single();
      
      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!targetId,
  });

  // 3. QUERY: DANH SÁCH SẢN PHẨM
  const productsQuery = useQuery({
    queryKey: ["user-products", targetId],
    queryFn: async () => {
      if (!targetId) return [];
      const { data, error } = await supabase
        .from("products")
        .select("*, users!inner(username, avatar_url)")
        .eq("user_id", targetId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // 2. Sửa lỗi TS2352 bằng cách ép kiểu qua unknown 
      // hoặc đảm bảo Product type có các field optional (?)
      return (data as unknown) as ProductWithUser[];
    },
    enabled: !!targetId,
  });

  // LOGIC XỬ LÝ
  const isOtherUser = !!currentUser && !!profileQuery.data && currentUser.id !== profileQuery.data.id;
  const chatAlreadyOpen = profileQuery.data ? isOpen(profileQuery.data.id) : false;

  const handleChat = () => {
    if (!profileQuery.data || !isOtherUser) return;
    if (chatAlreadyOpen) {
      focusChat(profileQuery.data.id);
    } else {
      openChat(profileQuery.data.id);
    }
  };

  // 3. Sử dụng useState đã import từ react
  const [isFollowing, setIsFollowing] = useState(false);
  const toggleFollow = () => setIsFollowing(!isFollowing);

  return {
    user: profileQuery.data,
    products: productsQuery.data ?? [],
    loading: profileQuery.isLoading || productsQuery.isLoading,
    isOtherUser,
    chatAlreadyOpen,
    isFollowing,
    handleChat,
    toggleFollow,
    error: profileQuery.error || productsQuery.error,
  };
}