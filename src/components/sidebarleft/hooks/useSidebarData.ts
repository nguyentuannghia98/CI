"use client";

import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Conversation } from "@/components/sidebarleft/types/chat";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/components/MiniChat/MiniChatBox/hooks/useCurrentUser";

// Định nghĩa interface cho dữ liệu từ bảng conversations trong Database
interface DBConversation {
  id: string;
  user_1: string;
  user_2: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count_user_1: number | null;
  unread_count_user_2: number | null;
}

export function useSidebarData() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const userId = useCurrentUser();
  // SidebarLeft được render 2 lần (desktop + mobile), nên nếu dùng chung tên kênh
  // realtime thì 2 join cùng topic sẽ đụng nhau và kênh không hoạt động. Dùng hậu tố
  // duy nhất cho mỗi instance để mỗi kênh join độc lập (chung cache React Query).
  const instanceId = useRef(Math.random().toString(36).slice(2, 8)).current;

  // 1. Fetch Danh sách hội thoại
  const { data: conversations = [], isLoading: isConversationsLoading } = useQuery({
    queryKey: ["conversations", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("conversations")
        .select(`
          id,
          user_1,
          user_2,
          last_message,
          last_message_at,
          unread_count_user_1,
          unread_count_user_2
        `)
        .or(`user_1.eq.${userId},user_2.eq.${userId}`)
        .order("last_message_at", { ascending: false });

      if (error || !data) return [];

      const rawConversations = data as DBConversation[];

      // Lấy danh sách ID của đối phương (partner)
      const partnerIds = rawConversations
        .map(conv => (conv.user_1 === userId ? conv.user_2 : conv.user_1))
        .filter((id): id is string => !!id); 

      // Lấy thông tin username/avatar của đối phương
      const { data: usersList } = await supabase
        .from("users")
        .select("id, username, avatar_url")
        .in("id", partnerIds);

      return rawConversations.map((conv) => {
        const isUser1 = conv.user_1 === userId;
        const partnerId = isUser1 ? conv.user_2 : conv.user_1;
        const u = usersList?.find((x) => x.id === partnerId);
        
        const unreadCountLocal = (isUser1 ? conv.unread_count_user_1 : conv.unread_count_user_2) || 0;

        return {
          id: conv.id,
          partner_id: partnerId,
          username: u?.username || "Người dùng",
          avatar_url: u?.avatar_url || null,
          last_message: conv.last_message || "",
          last_time: conv.last_message_at,
          is_read: unreadCountLocal === 0,
          unread_count: unreadCountLocal,
        };
      }) as Conversation[];
    },
    enabled: !!userId,
  });

  // 2. Lấy TỔNG SỐ ĐẦU NGƯỜI CHƯA ĐỌC
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-conversations-count", userId],
    queryFn: async () => {
      if (!userId) return 0;
      
      const { data } = await supabase
        .from("conversations")
        .select("user_1, user_2, unread_count_user_1, unread_count_user_2")
        .or(`user_1.eq.${userId},user_2.eq.${userId}`);

      if (!data) return 0;

      const typedData = data as DBConversation[];

      return typedData.reduce((acc, conv) => {
        const isUser1 = conv.user_1 === userId;
        const countForMe = (isUser1 ? conv.unread_count_user_1 : conv.unread_count_user_2) || 0;
        return countForMe > 0 ? acc + 1 : acc;
      }, 0);
    },
    enabled: !!userId,
  });

  // 3. Realtime Listener
  //    - Bảng `conversations` KHÔNG nằm trong publication realtime của Supabase nên
  //      các sự kiện không tới được client (đây là nguyên nhân sidebar không tự cập nhật).
  //    - Bảng `messages` thì CÓ (chat realtime F1 chạy tốt) → lắng nghe INSERT tin nhắn
  //      liên quan tới mình để làm mới danh sách hội thoại.
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`sidebar-conv-changes-${userId}-${instanceId}`)
      .on(
        "postgres_changes",
        { 
          event: "*", 
          schema: "public", 
          table: "conversations"
        },
        (payload) => {
          const rec = (payload.new as DBConversation) || (payload.old as DBConversation);
          
          if (rec && (rec.user_1 === userId || rec.user_2 === userId)) {
            queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
            queryClient.invalidateQueries({ queryKey: ["unread-conversations-count", userId] });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as { sender_id?: string; receiver_id?: string } | null;
          if (msg && (msg.sender_id === userId || msg.receiver_id === userId)) {
            queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
            queryClient.invalidateQueries({ queryKey: ["unread-conversations-count", userId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, queryClient, instanceId]);

  // 4. Hàm xóa trạng thái chưa đọc
  const clearUnread = useCallback(async (partnerId: string) => {
    if (!userId) return;

    // Tìm hội thoại hiện tại giữa 2 người
    const { data: conv } = await supabase
      .from("conversations")
      .select("id, user_1")
      .or(`and(user_1.eq.${userId},user_2.eq.${partnerId}),and(user_1.eq.${partnerId},user_2.eq.${userId})`)
      .single();

    if (!conv) return;

    const isUser1 = conv.user_1 === userId;
    const updatePayload = isUser1 
      ? { unread_count_user_1: 0 } 
      : { unread_count_user_2: 0 };

    // Cập nhật số tin nhắn chưa đọc về 0 trong bảng conversations
    const { error } = await supabase
      .from("conversations")
      .update(updatePayload)
      .eq("id", conv.id);

    if (!error) {
      // Đánh dấu tất cả tin nhắn từ đối phương là đã đọc
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("receiver_id", userId)
        .eq("sender_id", partnerId)
        .eq("is_read", false);

      // Làm mới dữ liệu trên UI
      queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
      queryClient.invalidateQueries({ queryKey: ["unread-conversations-count", userId] });
    }
  }, [userId, supabase, queryClient]);

  return { 
    conversations, 
    unreadCount, 
    clearUnread, 
    userId, 
    isLoading: isConversationsLoading 
  };
}