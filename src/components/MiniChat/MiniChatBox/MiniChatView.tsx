"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Send, X } from "lucide-react";
import type { Message, User } from "@/components/MiniChat/MiniChatBox/type/types";
import { parseDbDate } from "@/lib/datetime";

type Props = {
  partner: User | null;
  messages: Message[];
  currentUserId: string | null;
  newMessage: string;
  setNewMessage: (v: string) => void;
  onSend: (content: string) => Promise<void>;
  onClose: () => void;
  index?: number;
  loading?: boolean;
};

const formatDateLabel = (dateStr: string) => {
  const d = parseDbDate(dateStr);
  if (!d) return "";
  const now = new Date();
  const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = (nowDate - dDate) / (1000 * 60 * 60 * 24);

  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return d.toLocaleDateString("vi-VN", { weekday: "long" });
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

export default function MiniChatView({
  partner,
  messages = [],
  currentUserId,
  newMessage,
  setNewMessage,
  onSend,
  onClose,
  index = 0,
  loading,
}: Props) {
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages]);

  const avatarSrc = !avatarError && partner?.avatar_url ? partner.avatar_url : "/default-avatar.png";

  return (
    <div
      className="fixed bottom-20 md:bottom-4 right-3 sm:right-[var(--chat-offset)] w-[calc(100vw-1.5rem)] sm:w-80 h-[400px] sm:h-[420px] shadow-2xl rounded-t-xl flex flex-col z-[999999] border border-current/10 backdrop-blur-xl"
      style={{
        // Trên mobile chỉ có 1 khung hiển thị (căn phải). Từ sm trở lên mới xếp
        // cạnh nhau theo offset để tránh tràn ngang trên màn hình nhỏ.
        "--chat-offset": `${4 + index * 330}px`,
        backgroundColor: 'inherit', // Lấy màu nền của trang web
        color: 'inherit'           // Lấy màu chữ của trang web
      } as React.CSSProperties}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-current/10 rounded-t-xl bg-inherit">
        {partner ? (
          <Link href={`/profile/${partner.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="relative w-8 h-8">
              <Image
                src={avatarSrc}
                fill
                sizes="32px"
                alt="avatar"
                className="rounded-full object-cover border border-current/10"
                onError={() => setAvatarError(true)}
              />
            </div>
            <span className="font-normal text-sm truncate max-w-[150px] text-inherit">
              {partner.username}
            </span>
          </Link>
        ) : (
          <div className="flex items-center gap-2 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-current/10" />
            <div className="h-3 w-20 bg-current/10 rounded" />
          </div>
        )}

        <button onClick={onClose} aria-label="Đóng trò chuyện" className="p-2 hover:bg-current/10 rounded-full transition-colors opacity-60 hover:opacity-100 cursor-pointer">
          <X size={18} />
        </button>
      </div>

      {/* BODY */}
      <div ref={bodyRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scroll-smooth bg-inherit/50">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length > 0 ? (
          messages.map((msg, idx) => {
            const isMe = msg.sender_id === currentUserId;
            const msgDate = msg.created_at ? parseDbDate(msg.created_at) : null;
            const prevMsgDate = idx > 0 && messages[idx - 1].created_at ? parseDbDate(messages[idx - 1].created_at!) : null;
            const showDateLabel = isMounted && msgDate && (idx === 0 || !prevMsgDate || msgDate.toDateString() !== prevMsgDate.toDateString());

            let localTime = "--:--";
            if (isMounted && msg.created_at) {
              const dateObj = parseDbDate(msg.created_at);
              if (dateObj) {
                localTime = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
              }
            }

            return (
              <React.Fragment key={msg.id ?? idx}>
                {showDateLabel && msg.created_at && (
                  <div className="flex justify-center my-4">
                    <span className="bg-current/5 text-current/50 text-[10px] px-2 py-0.5 rounded-md font-normal uppercase border border-current/5">
                      {formatDateLabel(msg.created_at)}
                    </span>
                  </div>
                )}

                <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  <div
                    className={`px-3 py-2 rounded-2xl max-w-[85%] text-[13px] leading-relaxed shadow-sm border ${
                      isMe 
                        ? "bg-current/5 border-current/10 text-inherit rounded-br-none" 
                        : "bg-blue-500 text-white border-transparent rounded-bl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[9px] opacity-40 mt-1 px-1">{localTime}</span>
                </div>
              </React.Fragment>
            );
          })
        ) : (
          <div className="text-center py-10 text-xs opacity-40 font-light">Chưa có tin nhắn nào</div>
        )}
      </div>

      {/* INPUT */}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const content = newMessage.trim();
          if (!content || !partner) return;
          setNewMessage(""); 
          await onSend(content);
        }}
        className="p-3 bg-inherit border-t border-current/10"
      >
        <div className="relative flex items-center">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={partner ? "Nhập tin nhắn..." : "Đang kết nối..."}
            className="w-full pl-4 pr-10 py-2 text-sm bg-current/5 border border-current/10 rounded-2xl focus:ring-1 focus:ring-blue-500/50 focus:bg-current/[0.08] transition-all outline-none text-inherit placeholder:opacity-30 font-normal"
            disabled={!partner}
          />
          <button
            type="submit"
            className={`absolute right-2 p-1.5 rounded-full transition-colors cursor-pointer ${
              newMessage.trim() ? "text-blue-500 hover:bg-blue-500/10" : "opacity-20 cursor-default"
            }`}
            disabled={!partner || !newMessage.trim()}
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}