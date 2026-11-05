"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import MiniChatView from "@/components/MiniChat/MiniChatBox/MiniChatView";
import { useMiniChat } from "@/components/MiniChat/MiniChatBox/hooks/useMiniChat";
import type {
  Message as HookMessage,
  User as HookUser,
} from "@/components/MiniChat/MiniChatBox/type/types";

export type ConversationSummary = {
  partner_id: string;
  username: string;
  avatar_url: string;
  last_message: string;
  last_time: string;
  is_read: boolean;
};

export type MiniChatBoxProps = {
  partnerId: string;
  index?: number;
  onClose: () => void;
  onReadMessages?: () => void;
  onNewConversation?: (conv: ConversationSummary) => void;
};

interface MiniChatHookResult {
  currentUserId: string | null;
  partner: HookUser | null;
  messages: HookMessage[];
  loading: boolean;
  sendMessage: (content: string) => Promise<HookMessage | null>;
  markUnreadFromPartner: () => Promise<boolean>;
}

export default function MiniChatBox({
  partnerId,
  index = 0,
  onClose,
  onReadMessages,
  onNewConversation,
}: MiniChatBoxProps) {
  const {
    currentUserId,
    partner,
    messages,
    loading,
    sendMessage,
    markUnreadFromPartner,
  } = useMiniChat(partnerId) as MiniChatHookResult;

  const [newMessage, setNewMessage] = useState<string>("");

  // --- ĐOẠN SỬA QUAN TRỌNG NHẤT ---
  // Chúng ta "lọc" lại mảng tin nhắn, đảm bảo created_at luôn là chuẩn ISO của Database gửi về
  // tránh việc các hàm util làm sai lệch thông tin thời gian.
  const synchronizedMessages = useMemo(() => {
    return messages.map(msg => ({
      ...msg,
      // Nếu created_at tồn tại, đảm bảo nó là một chuỗi ISO hợp lệ
      created_at: msg.created_at ? new Date(msg.created_at).toISOString() : new Date().toISOString()
    }));
  }, [messages]);
  // -------------------------------

  useEffect(() => {
    let isSubscribed = true;
    const performMarkRead = async () => {
      if (!partnerId) return;
      try {
        const hasUnread = await markUnreadFromPartner();
        if (isSubscribed && hasUnread) {
          onReadMessages?.();
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') console.error(err);
      }
    };

    const timer = setTimeout(performMarkRead, 500); 
    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, [partnerId, markUnreadFromPartner, onReadMessages]);

  const handleSend = useCallback(
    async (content: string): Promise<void> => {
      if (!content?.trim()) return;

      try {
        const insertedMessage = await sendMessage(content);
        
        if (insertedMessage && partner && onNewConversation) {
          // Ép giờ máy tính để danh sách chat bên ngoài cũng hiện đúng
          const localNow = new Date().toISOString();

          onNewConversation({
            partner_id: partner.id,
            username: partner.username ?? "Unknown",
            avatar_url: partner.avatar_url ?? "/default-avatar.png",
            last_message: insertedMessage.content,
            last_time: localNow,
            is_read: true,
          });
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') console.error("Send error:", err);
      }
    },
    [sendMessage, partner, onNewConversation] 
  );

  return (
    <MiniChatView
      partner={partner}
      messages={synchronizedMessages} // Dùng mảng đã đồng bộ hóa múi giờ
      currentUserId={currentUserId}
      newMessage={newMessage}
      setNewMessage={setNewMessage}
      onSend={handleSend}
      onClose={onClose}
      index={index}
      loading={loading}
    />
  );
}