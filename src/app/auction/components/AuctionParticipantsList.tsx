"use client";

import Link from "next/link";
import { Users, ShieldCheck, Eye } from "lucide-react";

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  kycType: "VNeID" | "Zalo" | "CCCD";
  isOnline: boolean;
  role?: string;
  totalBids?: number;
  lastBidAmount?: number;
  isCurrentUser?: boolean;
}

interface AuctionParticipantsListProps {
  participants: Participant[];
  viewerCount: number;
}

export default function AuctionParticipantsList({
  participants,
  viewerCount,
}: AuctionParticipantsListProps) {
  const formatMoney = (n: number) => n.toLocaleString("vi-VN") + "đ";

  return (
    <div 
      className="rounded-2xl border p-2.5 sm:p-3 flex flex-col h-full min-h-0 shadow-md transition-all overflow-hidden"
      style={{
        backgroundColor: "rgb(var(--bg-card))",
        borderColor: "rgba(var(--border-main), 0.2)",
      }}
    >
      {/* Tiêu đề & Thống kê */}
      <div className="flex items-center justify-between pb-2 mb-1.5 border-b shrink-0" style={{ borderColor: "rgba(var(--border-main), 0.15)" }}>
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-lg bg-orange-500/10 text-orange-500">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-tight flex items-center gap-1" style={{ color: "rgb(var(--text-main))" }}>
              Người Đang Tham Gia
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
          </div>
        </div>

        {/* Tổng view từ Supabase Presence */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-bold">
          <Eye className="w-3 h-3" />
          <span>{viewerCount} Live</span>
        </div>
      </div>

      {/* Cam kết KYC an toàn */}
      <div className="mb-2 p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 shrink-0">
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">Tài khoản đặt giá đã định danh KYC</span>
      </div>

      {/* Danh sách người tham gia (Cuộn nội bộ) */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
        {participants.length === 0 ? (
          <div className="text-center py-8 text-xs flex flex-col items-center justify-center gap-1.5" style={{ color: "rgb(var(--text-muted))" }}>
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
            <span>Đang kết nối Realtime Presence...</span>
          </div>
        ) : (
          participants.map((p, idx) => {
            const isRealUser = Boolean(p.id && !p.id.startsWith("guest_") && !p.id.startsWith("p_"));
            return (
              <div
                key={p.id || idx}
                className={`flex items-center justify-between p-1.5 sm:p-2 rounded-xl border transition-all ${
                  p.isCurrentUser ? "ring-1 ring-orange-500/30 bg-orange-500/5" : ""
                }`}
                style={{
                  backgroundColor: p.isCurrentUser ? undefined : "rgba(var(--bg-surface), 0.5)",
                  borderColor: p.isCurrentUser ? "rgba(249, 115, 22, 0.4)" : "rgba(var(--border-main), 0.15)",
                }}
              >
                {/* Avatar & Tên */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative shrink-0">
                    {isRealUser ? (
                      <Link
                        href={`/profile/${p.id}`}
                        className="block group/avatar"
                        title={`Xem trang cá nhân của ${p.name}`}
                      >
                        <img
                          src={p.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.id || idx}`}
                          alt={p.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(p.name || "user")}`;
                          }}
                          className="w-7 h-7 rounded-full object-cover border border-white/10 group-hover/avatar:border-orange-500 group-hover/avatar:scale-105 transition-all cursor-pointer"
                        />
                      </Link>
                    ) : (
                      <img
                        src={p.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.id || idx}`}
                        alt={p.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(p.name || "user")}`;
                        }}
                        className="w-7 h-7 rounded-full object-cover border border-white/10"
                      />
                    )}
                    {/* Chấm Online Realtime */}
                    {p.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-zinc-900 pointer-events-none" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      {isRealUser ? (
                        <Link
                          href={`/profile/${p.id}`}
                          className="text-xs font-bold truncate max-w-[85px] sm:max-w-[100px] hover:text-orange-500 hover:underline transition-colors block cursor-pointer"
                          style={{ color: "rgb(var(--text-main))" }}
                          title={`Xem trang cá nhân của ${p.name}`}
                        >
                          {p.name}
                        </Link>
                      ) : (
                        <span className="text-xs font-bold truncate max-w-[85px] sm:max-w-[100px]" style={{ color: "rgb(var(--text-main))" }}>
                          {p.name}
                        </span>
                      )}
                      {p.isCurrentUser && (
                        <span className="text-[9px] font-bold text-orange-500 bg-orange-500/10 px-1 rounded shrink-0">
                          Bạn
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[9px] text-muted opacity-60">
                      <ShieldCheck className="w-2.5 h-2.5 text-blue-500" />
                      <span>{p.kycType}</span>
                    </div>
                  </div>
                </div>

                {/* Trạng thái đặt giá */}
                <div className="text-right shrink-0">
                  {p.lastBidAmount ? (
                    <div>
                      <span className="text-xs font-mono font-bold text-orange-500">
                        {formatMoney(p.lastBidAmount)}
                      </span>
                      {p.totalBids && p.totalBids > 0 && (
                        <span className="block text-[9px] opacity-60">
                          {p.totalBids} lần đặt
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] opacity-50 px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5">
                      Đang xem
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
