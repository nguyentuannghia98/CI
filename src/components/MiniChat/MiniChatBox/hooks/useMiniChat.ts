"use client";

import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCurrentUser } from "./useCurrentUser";
import { usePartner } from "./usePartner";
import { useMessages } from "./useMessages";
import { Message } from "@/components/MiniChat/MiniChatBox/type/types";
import { useQueryClient } from "@tanstack/react-query";

export function useMiniChat(partnerId: string | null) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  
  const currentUserId = useCurrentUser();
  const partner = usePartner(partnerId);

  // Lấy data và các hàm bổ trợ từ useMessages
  const {
    messages,
    loading,
    setMessages,
    markUnreadFromPartner,
    fetchMessages,
  } = useMessages(currentUserId, partnerId);

  // Hàm gửi tin nhắn với Optimistic Update
  const sendMessage = useCallback(
    async (content: string): Promise<Message | null> => {
      if (!currentUserId || !partnerId || !content.trim()) return null;

      const queryKey = ["messages", currentUserId, partnerId];
      const text = content.trim();
      
      // Giờ UTC chuẩn cho optimistic; còn DB sẽ tự set created_at = now() (UTC).
      const optimisticCreatedAt = new Date().toISOString();

      // Tạo một tin nhắn tạm thời (Optimistic)
      const temporaryMessage: Message = {
        id: `temp-${Date.now()}`,
        sender_id: currentUserId,
        receiver_id: partnerId,
        content: text,
        created_at: optimisticCreatedAt,
        is_read: false,
      };

      // Cập nhật UI ngay lập tức
      queryClient.setQueryData(queryKey, (old: Message[] = []) => [
        ...old,
        temporaryMessage,
      ]);

      try {
        const { data, error } = await supabase
          .from("messages")
          .insert({
            sender_id: currentUserId,
            receiver_id: partnerId,
            content: text,
            is_read: false,
            // created_at: để DB tự set (now(), UTC) cho chuẩn
          })
          .select()
          .single();

        if (error) throw error;

        // Dùng nguyên created_at do server trả về (UTC chuẩn)
        const finalMessage = data as Message;

        // Thay thế tin nhắn tạm bằng tin nhắn thật
        queryClient.setQueryData(queryKey, (old: Message[] = []) =>
          old.map(m => m.id === temporaryMessage.id ? finalMessage : m)
        );

        return finalMessage;
      } catch (error) {
        console.error("[useMiniChat] sendMessage error:", error);
        
        queryClient.setQueryData(queryKey, (old: Message[] = []) => 
          old.filter(m => m.id !== temporaryMessage.id)
        );
        return null;
      }
    },
    [currentUserId, partnerId, queryClient, supabase]
  );

  return {
    currentUserId,
    partner,
    messages,
    loading,
    sendMessage,
    markUnreadFromPartner,
    setMessages,
    refetchMessages: fetchMessages,
  };
}