"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MessageSquare, Send, Zap, CheckCircle, Clock } from "lucide-react";

export interface ChatMessage {
  id: string;
  sender: {
    id?: string;
    name: string;
    avatar: string;
    verified?: boolean;
    isSeller?: boolean;
    isCurrentUser?: boolean;
  };
  content: string;
  timestamp: string;
  isSystemAlert?: boolean; // Báo động nhảy giá hệ thống
  bidAmount?: number;
}

interface AuctionLiveChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onSendReaction?: (emoji: string) => void;
  isEnded?: boolean;
}

export default function AuctionLiveChat({
  messages,
  onSendMessage,
  onSendReaction,
  isEnded = false,
}: AuctionLiveChatProps) {
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEnded || !inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const formatMoney = (n: number) => n.toLocaleString("vi-VN") + "đ";

  return (
    <div 
      className="rounded-2xl border p-2.5 sm:p-3 flex flex-col h-full min-h-0 shadow-md transition-all overflow-hidden"
      style={{
        backgroundColor: "rgb(var(--bg-card))",
        borderColor: "rgba(var(--border-main), 0.2)",
      }}
    >
      {/* Header chat */}
      <div className="flex items-center justify-between pb-2 mb-1.5 border-b shrink-0" style={{ borderColor: "rgba(var(--border-main), 0.15)" }}>
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-lg bg-orange-500/10 text-orange-500">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-wider" style={{ color: "rgb(var(--text-main))" }}>
            Trò Chuyện & Nhảy Giá
          </h3>
        </div>

        {/* Nút phản ứng nhanh hoặc nhãn Hết giờ */}
        {!isEnded ? (
          <div className="flex items-center gap-0.5">
            {["🔥", "🚀", "👏", "💎"].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onSendReaction ? onSendReaction(emoji) : onSendMessage(emoji)}
                className="text-xs p-1 hover:scale-125 transition-transform cursor-pointer"
                title={`Thả ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-500/10 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" /> Đã kết thúc
          </span>
        )}
      </div>

      {/* Danh sách tin nhắn (Cuộn) */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 text-xs custom-scrollbar">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-xs flex flex-col items-center justify-center gap-2" style={{ color: "rgb(var(--text-muted))" }}>
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
            <span>Chưa có bình luận nào. Hãy gửi lời chào đầu tiên!</span>
          </div>
        ) : (
          messages.map((msg) => {
            const isClickable = Boolean(msg.sender.id && !msg.sender.id.startsWith("guest_"));

            // Tin nhắn cảnh báo hệ thống nhảy giá
            if (msg.isSystemAlert) {
              return (
                <div
                  key={msg.id}
                  className="p-2 rounded-xl bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-transparent border border-orange-500/30 flex items-center justify-between gap-1.5 animate-in slide-in-from-left-2 duration-300"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="p-0.5 rounded bg-orange-500 text-white shrink-0">
                      <Zap className="w-3 h-3 fill-white" />
                    </div>
                    <span className="truncate font-medium text-orange-600 dark:text-orange-400 text-[11px]">
                      {isClickable ? (
                        <Link
                          href={`/profile/${msg.sender.id}`}
                          className="font-bold hover:underline hover:text-orange-500 transition-colors"
                          title={`Xem trang cá nhân của ${msg.sender.name}`}
                        >
                          {msg.sender.name}
                        </Link>
                      ) : (
                        <b>{msg.sender.name}</b>
                      )}{" "}
                      nâng giá!
                    </span>
                  </div>
                  {msg.bidAmount && (
                    <span className="font-mono font-black text-xs text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded-lg shrink-0">
                      {formatMoney(msg.bidAmount)}
                    </span>
                  )}
                </div>
              );
            }

            // Tin nhắn bình luận thông thường
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-1.5 ${msg.sender.isCurrentUser ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar người bình luận (Click để xem profile) */}
                {isClickable ? (
                  <Link
                    href={`/profile/${msg.sender.id}`}
                    className="shrink-0 mt-0.5 group/avatar"
                    title={`Xem trang cá nhân của ${msg.sender.name}`}
                  >
                    <img
                      src={msg.sender.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.sender.name}`}
                      alt={msg.sender.name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(msg.sender.name || "user")}`;
                      }}
                      className="w-5 h-5 rounded-full object-cover border border-white/10 group-hover/avatar:border-orange-500 group-hover/avatar:scale-105 transition-all cursor-pointer"
                    />
                  </Link>
                ) : (
                  <img
                    src={msg.sender.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.sender.name}`}
                    alt={msg.sender.name}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(msg.sender.name || "user")}`;
                    }}
                    className="w-5 h-5 rounded-full object-cover shrink-0 mt-0.5 border border-white/10"
                  />
                )}

                {/* Nội dung bình luận */}
                <div
                  className={`max-w-[78%] p-2 rounded-xl ${
                    msg.sender.isCurrentUser
                      ? "bg-orange-500 text-white rounded-tr-none"
                      : "border rounded-tl-none"
                  }`}
                  style={{
                    backgroundColor: msg.sender.isCurrentUser ? undefined : "rgba(var(--bg-surface), 0.7)",
                    borderColor: msg.sender.isCurrentUser ? undefined : "rgba(var(--border-main), 0.2)",
                    color: msg.sender.isCurrentUser ? undefined : "rgb(var(--text-main))",
                  }}
                >
                  {/* Tên người gửi (Click để xem profile nếu không phải currentUser) */}
                  {!msg.sender.isCurrentUser && (
                    <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                      {isClickable ? (
                        <Link
                          href={`/profile/${msg.sender.id}`}
                          className="font-bold text-[10px] text-orange-500 hover:underline hover:text-orange-400 transition-colors cursor-pointer"
                          title={`Xem trang cá nhân của ${msg.sender.name}`}
                        >
                          {msg.sender.name}
                        </Link>
                      ) : (
                        <span className="font-bold text-[10px] text-orange-500">{msg.sender.name}</span>
                      )}

                      {msg.sender.verified && (
                        <CheckCircle className="w-2.5 h-2.5 fill-blue-500 text-white dark:text-zinc-900 inline" />
                      )}
                      {msg.sender.isSeller && (
                        <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-500 font-bold">Chủ phòng</span>
                      )}
                    </div>
                  )}

                  <p className="leading-snug break-words text-[11px]">{msg.content}</p>
                  <span className="text-[8px] opacity-60 block text-right mt-0.5">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Form nhập chat */}
      <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-1.5 pt-2 border-t shrink-0" style={{ borderColor: "rgba(var(--border-main), 0.15)" }}>
        <input
          type="text"
          value={inputText}
          disabled={isEnded}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isEnded ? "Phiên đấu giá đã kết thúc (Đã dọn dẹp bình luận)" : "Bình luận trực tiếp..."}
          className="flex-1 h-8 px-3 rounded-xl border text-xs outline-none bg-transparent focus:border-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ borderColor: "rgba(var(--border-main), 0.3)", color: "rgb(var(--text-main))" }}
        />
        <button
          type="submit"
          disabled={isEnded || !inputText.trim()}
          className="h-8 w-8 rounded-xl bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0 flex items-center justify-center"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
