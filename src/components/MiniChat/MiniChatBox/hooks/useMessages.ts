"use client";

import { useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Message } from "@/components/MiniChat/MiniChatBox/type/types";
import { buildOrFilter, normalizeMessage } from "@/components/MiniChat/MiniChatBox/util/utils";

export function useMessages(
  currentUserId: string | null,
  partnerId: string | null
) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const queryKey = ["messages", currentUserId, partnerId];

  // 1. Fetch tin nhắn cũ bằng TanStack Query
  const { data: messages = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!currentUserId || !partnerId) return [];
      
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(buildOrFilter(currentUserId, partnerId))
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      // Đảm bảo dữ liệu sau khi normalize vẫn giữ đúng đối tượng Date/Chuỗi chuẩn
      return (data ?? []).map((msg) => {
        const normalized = normalizeMessage(msg);
        return {
          ...normalized,
          // Đảm bảo created_at được xử lý đồng nhất
          created_at: msg.created_at 
        };
      });
    },
    enabled: !!currentUserId && !!partnerId, 
    staleTime: 1000 * 60, 
  });

  // 2. Thiết lập Realtime để nhận tin nhắn mới ngay lập tức
  useEffect(() => {
    if (!currentUserId || !partnerId) return;

    // queryKey cục bộ, ổn định theo [currentUserId, partnerId] -> không tạo lại mỗi render
    const key = ["messages", currentUserId, partnerId];

    const channel = supabase
      .channel(`chat:${currentUserId}-${partnerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${currentUserId}`, 
        },
        (payload) => {
          const rawMessage = payload.new;
          const newMessage = normalizeMessage(rawMessage);
          
          // Kiểm tra xem có đúng là tin nhắn từ partner hiện tại không
          if (newMessage.sender_id === partnerId) {
            queryClient.setQueryData(key, (old: Message[] = []) => [
              ...old,
              {
                ...newMessage,
                created_at: rawMessage.created_at // Giữ nguyên thời gian từ payload
              },
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, partnerId, queryClient, supabase]);

  // 3. API: Đánh dấu đã đọc
  const markUnreadFromPartner = useCallback(async () => {
    if (!currentUserId || !partnerId) return false;

    try {
      const { error } = await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("sender_id", partnerId)
        .eq("receiver_id", currentUserId)
        .eq("is_read", false);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error("[useMessages] markUnread error:", err);
      return false;
    }
  }, [currentUserId, partnerId, supabase]);

  return {
    messages,
    loading: isLoading,
    setMessages: (msgs: Message[]) => queryClient.setQueryData(queryKey, msgs),
    fetchMessages: () => queryClient.invalidateQueries({ queryKey }),
    markUnreadFromPartner,
  };
}