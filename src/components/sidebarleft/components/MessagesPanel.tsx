"use client";

import React, { useMemo, useEffect, useState, memo } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { User as UserIcon, X, MessageSquareOff } from "lucide-react";
import { useChat } from "@/components/MiniChat/ChatContext";
import { parseDbDate } from "@/lib/datetime";

export type Conversation = {
  partner_id: string;
  username: string;
  avatar_url: string | null;
  last_message: string;
  last_time: string;
  is_read?: boolean;
  unread_count?: number; 
};

interface MessagesPanelProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  conversations: Conversation[];
  onSelect: (partnerId: string) => void;
  activePanel: string | null;
  setActivePanel: React.Dispatch<React.SetStateAction<string | null>>;
  clearUnread: (partnerId: string) => void;
}

interface FormattedConversation extends Conversation {
  formatted_time: string;
}

const formatSmartTime = (dateStr: string) => {
  if (!dateStr) return "";
  const date = parseDbDate(dateStr);
  if (!date) return "";
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));

  if (diffInDays === 0) {
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffInDays === 1) return "Hôm qua";
  if (diffInDays < 7) return date.toLocaleDateString("vi-VN", { weekday: "short" });
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
};

const ConversationItem = memo(({
  c,
  onClick,
}: {
  c: FormattedConversation;
  onClick: (partnerId: string) => void;
}) => {
  const isUnread = c.unread_count ? c.unread_count > 0 : c.is_read === false;

  return (
    <div
      className="group flex items-center gap-3 p-4 hover:bg-black/[0.03] dark:hover:bg-white/[0.05] cursor-pointer transition-all border-b border-[rgba(var(--border-main),0.05)] md:border-none active:bg-black/[0.05] dark:active:bg-white/[0.1]"
      onClick={() => onClick(c.partner_id)}
    >
      <div className="relative w-12 h-12 md:w-11 md:h-11 shrink-0">
        {c.avatar_url ? (
          <Image
            src={c.avatar_url}
            alt={c.username}
            fill
            sizes="48px"
            className="rounded-full object-cover border border-[rgba(var(--border-main),0.1)] bg-[rgb(var(--bg-main))]"
          />
        ) : (
          <div className="w-full h-full rounded-full bg-[rgba(var(--border-main),0.1)] border border-[rgba(var(--border-main),0.1)] flex items-center justify-center text-[rgb(var(--text-muted))]">
            <UserIcon size={24} />
          </div>
        )}
        
        {isUnread && (
          <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-orange-500 border-2 border-[rgb(var(--bg-card))] rounded-full flex items-center justify-center text-[10px] text-white font-bold animate-in zoom-in">
            {c.unread_count && c.unread_count > 9 ? "9+" : c.unread_count || ""}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-0.5">
          <p className={`truncate text-[15px] md:text-sm ${isUnread ? "font-bold text-[rgb(var(--text-main))]" : "font-medium text-[rgb(var(--text-main))]"}`}>
            {c.username}
          </p>
          <span className="text-[10px] font-normal text-[rgb(var(--text-muted))] ml-2 whitespace-nowrap uppercase italic">
            {c.formatted_time}
          </span>
        </div>
        <p className={`text-[13px] line-clamp-1 ${isUnread ? "font-semibold text-[rgb(var(--text-main))]" : "font-normal text-[rgb(var(--text-muted))]"}`}>
          {c.last_message}
        </p>
      </div>
    </div>
  );
});
ConversationItem.displayName = "ConversationItem";

export default function MessagesPanel(props: MessagesPanelProps) {
  const { open, setOpen, conversations, onSelect, setActivePanel, clearUnread } = props;
  const { openChat, focusChat, isOpen } = useChat();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- LOGIC CHỐNG CO/ĐẨY TRANG (LAYOUT SHIFT) ---
  useEffect(() => {
    if (open) {
      document.documentElement.style.scrollbarGutter = "stable";
    } else {
      document.documentElement.style.scrollbarGutter = "";
    }
    return () => { document.documentElement.style.scrollbarGutter = ""; };
  }, [open]);

  const formattedConversations = useMemo<FormattedConversation[]>(
    () => conversations.map((c) => ({
      ...c,
      formatted_time: formatSmartTime(c.last_time)
    })),
    [conversations]
  );

  if (!mounted) return null;

  const handleClose = () => {
    setOpen(false);
    setActivePanel(null);
  };

  const handleConversationClick = (id: string) => {
    if (isOpen(id)) focusChat(id);
    else openChat(id);
    
    clearUnread(id);
    onSelect(id);
    handleClose();
  };

  return createPortal(
    <>
      <div 
        className={`fixed inset-0 bg-black/40 z-[100] transition-opacity duration-300 md:hidden ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`} 
        onClick={handleClose}
      />

      <div className={`
        fixed inset-y-0 left-0 z-[101] w-full
        md:inset-auto md:top-[5.5rem] 
        md:left-[16rem] md:w-[20rem] md:h-[calc(100vh-7rem)] 
        bg-[rgb(var(--bg-card))] border-r border-[rgba(var(--border-main),0.1)] shadow-2xl 
        md:rounded-r-2xl md:rounded-l-none 
        transition-all duration-300 ease-out transform
        ${open 
          ? "translate-x-0 opacity-100" 
          : "-translate-x-full md:translate-x-[-20px] md:opacity-0 md:pointer-events-none"}
      `}
      style={{ borderLeft: 'none' }}
      >
        <div className="flex items-center justify-between p-4 border-b border-[rgba(var(--border-main),0.1)] bg-[rgb(var(--bg-card))] sticky top-0 z-10 md:rounded-tr-2xl pt-safe">
          <h2 className="text-xl md:text-lg font-bold text-[rgb(var(--text-main))]">Tin nhắn</h2>
          <button onClick={handleClose} aria-label="Đóng tin nhắn" className="p-2.5 hover:bg-[rgba(var(--border-main),0.1)] rounded-full transition-colors active:scale-90">
            <X size={22} className="text-[rgb(var(--text-muted))]" />
          </button>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-5rem)] md:h-[calc(100vh-12rem)] overscroll-contain custom-scrollbar">
          {formattedConversations.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-[rgb(var(--text-muted))] gap-3">
              <div className="bg-[rgba(var(--border-main),0.05)] p-4 rounded-full">
                <MessageSquareOff size={32} strokeWidth={1.5} />
              </div>
              <p className="text-sm font-normal">Bạn chưa có tin nhắn nào</p>
            </div>
          ) : (
            <div className="divide-y divide-[rgba(var(--border-main),0.05)] pb-20 md:pb-4">
              {formattedConversations.map((c) => (
                <ConversationItem 
                  key={c.partner_id} 
                  c={c} 
                  onClick={handleConversationClick} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}