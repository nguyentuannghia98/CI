"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, User, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/components/auth/store/AuthStore";
import { parseDbDate } from "@/lib/datetime";

interface Feedback {
  id: string;
  user_name: string | null;
  content: string;
  user_id: string | null;
  created_at: string;
}

type FeedbackInsert = Omit<Feedback, "id" | "created_at">;

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

export default function LiveFeedback() {
  const supabase = createClient();
  const currentUser = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [newFeedback, setNewFeedback] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Chỉ kết nối Supabase và Realtime channel khi người dùng chủ động mở hộp thoại
    if (!isOpen) return;

    let isMounted = true;
    const fetchFeedbacks = async () => {
      const { data, error } = await supabase
        .from("feedbacks")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(50);
      if (isMounted && data) setFeedbacks(data as Feedback[]);
      if (error) console.error("Lỗi lấy dữ liệu:", error.message);
    };
    fetchFeedbacks();

    const channel = supabase
      .channel(`live_feedbacks_channel_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "feedbacks" }, (payload) => {
        const newItem = payload.new as Feedback;
        setFeedbacks((prev) => [...prev, newItem]);
      })
      .subscribe();

    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, [isOpen, supabase]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [feedbacks, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeedback.trim()) return;
    const contentToSend = newFeedback;
    setNewFeedback("");
    // Gắn danh tính thật của người gửi (trước đây hard-code "Khách"/null).
    const displayName =
      currentUser?.user_metadata?.username ||
      currentUser?.user_metadata?.full_name ||
      currentUser?.email?.split("@")[0] ||
      "Khách";
    const { error } = await supabase.from("feedbacks").insert([{
      user_name: displayName,
      content: contentToSend,
      user_id: currentUser?.id ?? null,
    } as FeedbackInsert]);
    if (error) {
      console.error("Lỗi gửi feedback:", error.message);
      setNewFeedback(contentToSend);
    }
  };

  return (
    <div className="fixed right-4 bottom-24 sm:right-6 md:bottom-6 z-[9999] flex flex-col items-end pointer-events-none font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="pointer-events-auto mb-4 w-[calc(100vw-2rem)] max-w-[350px] h-[450px] rounded-3xl shadow-2xl border overflow-hidden flex flex-col transition-colors duration-300"
            style={{ 
              backgroundColor: 'rgb(var(--bg-card))',
              borderColor: 'rgba(var(--border-main), 0.5)'
            }}
          >
            {/* Header */}
            <div 
              className="p-4 border-b flex items-center justify-between"
              style={{ borderColor: 'rgba(var(--border-main), 0.3)' }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <h3 
                  className="font-normal text-xs uppercase tracking-wider"
                  style={{ color: 'rgb(var(--text-main))' }}
                >
                  Phản hồi trực tiếp
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              >
                <X size={18} style={{ color: 'rgb(var(--text-muted))' }} />
              </button>
            </div>

            {/* Chat Content */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-none transition-colors duration-300"
              style={{ backgroundColor: 'rgba(var(--bg-surface), 0.5)' }}
            >
              {feedbacks.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-xs font-normal italic" style={{ color: 'rgb(var(--text-muted))' }}>
                    Hãy là người đầu tiên góp ý nhé!
                  </p>
                </div>
              )}
              {feedbacks.map((item, idx) => {
                const currentDate = parseDbDate(item.created_at)?.toDateString() ?? "";
                const prevDate = idx > 0 ? parseDbDate(feedbacks[idx - 1].created_at)?.toDateString() ?? null : null;
                const showDateLabel = currentDate !== prevDate;

                return (
                  <React.Fragment key={item.id}>
                    {showDateLabel && (
                      <div className="flex justify-center my-4">
                        <span 
                          className="text-[10px] px-2 py-0.5 rounded-md font-normal uppercase tracking-wider shadow-sm"
                          style={{ 
                            backgroundColor: 'rgb(var(--bg-card))', 
                            color: 'rgb(var(--text-muted))',
                            border: '1px solid rgba(var(--border-main), 0.2)'
                          }}
                        >
                          {formatDateLabel(item.created_at)}
                        </span>
                      </div>
                    )}
                    
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-start gap-3">
                        <div 
                          className="h-8 w-8 rounded-full shadow-sm border flex items-center justify-center shrink-0"
                          style={{ 
                            backgroundColor: 'rgb(var(--bg-card))',
                            borderColor: 'rgba(var(--border-main), 0.5)'
                          }}
                        >
                          <User size={14} style={{ color: 'rgb(var(--text-muted))' }} />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-xs font-normal" style={{ color: 'rgb(var(--text-main))' }}>
                              {item.user_name || "Ẩn danh"}
                            </span>
                            <span className="text-[10px] font-normal" style={{ color: 'rgb(var(--text-muted))' }}>
                              {parseDbDate(item.created_at)?.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false
                              }) ?? ""}
                            </span>
                          </div>
                          <div className="mt-0.5">
                            <p className="text-sm font-normal leading-relaxed break-words" style={{ color: 'rgb(var(--text-main))' }}>
                              {item.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Input Form */}
            <div 
              className="p-4 border-t transition-colors duration-300"
              style={{ 
                backgroundColor: 'rgb(var(--bg-card))',
                borderColor: 'rgba(var(--border-main), 0.3)'
              }}
            >
              <form onSubmit={handleSendMessage} className="relative">
                <input
                  type="text"
                  autoFocus
                  value={newFeedback}
                  onChange={(e) => setNewFeedback(e.target.value)}
                  placeholder="Gửi ý kiến của bạn..."
                  className="w-full border rounded-2xl py-3 pl-4 pr-12 text-sm font-normal focus:outline-none transition-all shadow-inner bg-transparent"
                  style={{ 
                    borderColor: 'rgb(var(--border-main))',
                    color: 'rgb(var(--text-main))'
                  }}
                />
                <button
                  type="submit"
                  disabled={!newFeedback.trim()}
                  className="absolute right-1.5 top-1.5 bottom-1.5 w-9 flex items-center justify-center rounded-xl disabled:opacity-30 transition-all cursor-pointer disabled:cursor-not-allowed"
                  style={{ 
                    backgroundColor: 'rgba(var(--text-main), 0.1)',
                    color: 'rgb(var(--text-main))'
                  }}
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto flex items-center gap-2 h-12 rounded-full shadow-xl transition-all border backdrop-blur-sm px-5 cursor-pointer"
        style={{ 
          backgroundColor: 'rgb(var(--bg-card))',
          color: 'rgb(var(--text-main))',
          borderColor: 'rgba(var(--border-main), 0.3)',
          width: isOpen ? "48px" : "auto",
          padding: isOpen ? "0" : "",
          justifyContent: isOpen ? "center" : "flex-start"
        }}
      >
        {isOpen ? (
          <X size={20} />
        ) : (
          <>
            <MessageSquare size={18} className="animate-pulse" />
            <span className="text-base font-normal uppercase tracking-tight">Gửi phản hồi</span>
          </>
        )}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span 
              className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2"
              style={{ borderColor: 'rgb(var(--bg-card))' }}
            ></span>
          </span>
        )}
      </motion.button>
    </div>
  );
}