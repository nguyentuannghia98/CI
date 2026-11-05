"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Bell, BellOff, ArrowLeft, Globe } from "lucide-react"; 
import { createClient } from "@/lib/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Database } from "@/types/supabase";
import { useProductStore } from "@/lib/Zustard/store/useProductStore";
import { parseDbDate } from "@/lib/datetime";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

interface NewsMenuProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  setActivePanel: (panel: string | null) => void;
}

const formatNotifyTime = (dateStr: string) => {
  const date = parseDbDate(dateStr);
  if (!date) return "";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function NewsMenu({ open, setOpen, setActivePanel }: NewsMenuProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedNotify, setSelectedNotify] = useState<Notification | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  
  const openDetail = useProductStore((state) => state.openDetail);
  const supabase = createClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    setMounted(true);
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getUser();
  }, [supabase]);

  // --- LOGIC GIỮ NGUYÊN TRANG CHỦ ---
  useEffect(() => {
    if (open) {
      document.documentElement.style.scrollbarGutter = "stable";
    } else {
      setSelectedNotify(null);
    }
  }, [open]);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", currentUserId],
    queryFn: async () => {
      let query = supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (currentUserId) {
        query = query.or(`user_id.eq.${currentUserId},user_id.is.null`);
      } else {
        query = query.is("user_id", null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Notification[];
    },
    enabled: mounted,
  });

  const handleSelectNotify = async (n: Notification) => {
    if (!n.read) {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", n.id);
      
      if (!error) {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      }
    }

    // --- XỬ LÝ MỞ MODAL SẢN PHẨM KHI CLICK VÀO THÔNG BÁO BÌNH LUẬN ---
    if (n.product_id) {
      setOpen(false);
      setActivePanel(null);

      const commentId = (n.data as { comment_id?: string } | null)?.comment_id;
      openDetail(n.product_id, commentId);
      return;
    }

    // Chỉ hiện modal chi tiết cho các thông báo KHÔNG có sản phẩm (ví dụ thông báo hệ thống)
    setSelectedNotify(n);
  };

  useEffect(() => {
    if (!mounted) return;

    const channelName = `notifications-${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase.channel(channelName)
      .on(
        "postgres_changes", 
        { event: "INSERT", schema: "public", table: "notifications" }, 
        (payload) => {
          const newNoti = payload.new as Notification;
          const targetUserId = currentUserIdRef.current;
          if (!newNoti.user_id || newNoti.user_id === targetUserId) {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mounted, queryClient, supabase]);

  const handleClose = () => {
    setOpen(false);
    setActivePanel(null);
  };

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Panel thông báo - ĐÃ CHỈNH DÍNH SÁT SIDEBAR VÀ NHỎ XINH */}
      <div 
        className={`
          fixed inset-y-0 left-0 z-[999999] w-full
          md:inset-auto md:top-[5.5rem] 
          md:left-[16rem] md:w-[20rem] md:max-h-[70vh]
          border shadow-2xl md:rounded-r-[24px] md:rounded-l-none overflow-hidden
          transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] transform
          ${open ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none"}
        `}
        style={{ 
          backgroundColor: 'rgb(var(--bg-card))', 
          borderColor: 'rgba(var(--border-main), 0.1)',
          borderLeft: 'none' // Bỏ viền trái để liền mạch với Sidebar
        }}
      >
        <div 
          className="flex items-center justify-between p-4 border-b sticky top-0 z-10"
          style={{ backgroundColor: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-main), 0.1)' }}
        >
          <h2 className="text-lg font-bold uppercase tracking-tight" style={{ color: 'rgb(var(--text-main))' }}>
            Thông báo
          </h2>
          <button 
            onClick={handleClose} 
            aria-label="Đóng thông báo"
            className="p-2.5 hover:bg-orange-500/10 rounded-full transition-colors"
            style={{ color: 'rgb(var(--text-muted))' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(100vh-8rem)] md:max-h-[calc(70vh-4rem)]">
          {notifications.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="p-4 rounded-full bg-orange-500/5">
                <BellOff size={32} strokeWidth={1.5} className="text-orange-500/40" />
              </div>
              <p className="font-bold text-[12px] uppercase tracking-widest text-center" style={{ color: 'rgb(var(--text-muted))' }}>
                Trống
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-500/10">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleSelectNotify(n)}
                  className={`p-4 hover:bg-orange-500/5 cursor-pointer transition-all relative group ${!n.read ? "bg-orange-500/[0.02]" : ""}`}
                >
                  {!n.read && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                  )}
                  <div className="flex gap-3">
                    <div className={`p-2 h-fit rounded-xl transition-transform group-hover:scale-110 ${!n.user_id ? "bg-blue-500/10 text-blue-500" : "bg-orange-500/10 text-orange-500"}`}>
                      {!n.user_id ? <Globe size={16} strokeWidth={2.5} /> : <Bell size={16} strokeWidth={2.5} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-[13px] line-clamp-1 font-bold uppercase ${!n.read ? "text-orange-500" : ""}`} style={{ color: n.read ? 'rgb(var(--text-main))' : undefined }}>
                          {n.title}
                        </p>
                      </div>
                      <p className="text-[12px] leading-snug line-clamp-2" style={{ color: 'rgb(var(--text-muted))' }}>
                        {n.body}
                      </p>
                      <p className="text-[9px] mt-2 font-bold opacity-50 uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
                        {formatNotifyTime(n.created_at || "")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal chi tiết thông báo */}
      {selectedNotify && (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="w-full max-w-sm rounded-[28px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border"
            style={{ backgroundColor: 'rgb(var(--bg-card))', borderColor: 'rgba(var(--border-main), 0.1)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: 'rgba(var(--border-main), 0.1)' }}
            >
              <button 
                onClick={() => setSelectedNotify(null)}
                className="flex items-center gap-1.5 transition-colors hover:text-orange-500"
                style={{ color: 'rgb(var(--text-muted))' }}
              >
                <ArrowLeft size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Back</span>
              </button>
              <button 
                onClick={() => setSelectedNotify(null)} 
                aria-label="Quay lại danh sách thông báo"
                className="p-2.5 hover:bg-orange-500/10 rounded-full transition-colors"
                style={{ color: 'rgb(var(--text-muted))' }}
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-8">
              <div className={`w-12 h-12 rounded-[16px] flex items-center justify-center mb-6 shadow-lg ${!selectedNotify.user_id ? "bg-blue-500/10 text-blue-500" : "bg-orange-500/10 text-orange-500"}`}>
                {!selectedNotify.user_id ? <Globe size={24} strokeWidth={2.5} /> : <Bell size={24} strokeWidth={2.5} />}
              </div>
              <h3 className="text-xl font-black mb-3 leading-tight uppercase tracking-tight" style={{ color: 'rgb(var(--text-main))' }}>
                {selectedNotify.title}
              </h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'rgb(var(--text-muted))' }}>
                {selectedNotify.body}
              </p>
              <div 
                className="mt-8 pt-4 border-t flex justify-between items-center text-[9px] font-bold uppercase tracking-widest"
                style={{ borderColor: 'rgba(var(--border-main), 0.1)', color: 'rgb(var(--text-muted))' }}
              >
                <span className="px-2 py-0.5 rounded-full bg-orange-500/5">
                  {selectedNotify.user_id ? "Personal" : "System"}
                </span>
                <span className="opacity-60">
                  {formatNotifyTime(selectedNotify.created_at || "")}
                </span>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 -z-10" onClick={() => setSelectedNotify(null)} />
        </div>
      )}
    </>,
    document.body
  );
}