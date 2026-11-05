"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Share2, Volume2, VolumeX, Eye, ShieldCheck, Check, Trophy, Sparkles } from "lucide-react";

interface AuctionHeaderProps {
  roomId: string;
  title: string;
  endsAt: number;
  now: number;
  viewerCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isEnded?: boolean;
  winnerName?: string;
  isMaxBidReached?: boolean;
  is3DMode?: boolean;
  onToggle3DMode?: () => void;
}

export default function AuctionHeader({
  roomId,
  title,
  endsAt,
  now,
  viewerCount,
  soundEnabled,
  onToggleSound,
  isEnded: isEndedProp,
  winnerName,
  isMaxBidReached = false,
  is3DMode = false,
  onToggle3DMode,
}: AuctionHeaderProps) {
  const [copied, setCopied] = useState(false);

  const remainingMs = Math.max(0, endsAt - now);
  const isEnded = isEndedProp !== undefined ? isEndedProp : remainingMs <= 0;

  // Định dạng thời gian MM:SS hoặc HH:MM:SS
  const formatCountdown = (ms: number) => {
    if (ms <= 0) return "00:00 - HẾT GIỜ";
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header 
      className="shrink-0 z-30 w-full backdrop-blur-md border-b px-3 sm:px-6 py-2 transition-colors shadow-xs"
      style={{
        backgroundColor: "rgba(var(--bg-surface), 0.9)",
        borderColor: "rgba(var(--border-main), 0.2)",
      }}
    >
      <div className="max-w-[1600px] w-full mx-auto flex items-center justify-between gap-2.5">
        {/* Nút quay lại & Mã phòng & LIVE/ENDED badge */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/auction"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5 text-xs font-bold transition-all cursor-pointer group"
            style={{ borderColor: "rgba(var(--border-main), 0.3)" }}
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Quay lại</span>
          </Link>

          {/* Badge LIVE / WINNER / ENDED */}
          <div className="flex items-center gap-1.5">
            {!isEnded ? (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-500 text-[10px] font-black tracking-widest uppercase animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                LIVE
              </span>
            ) : winnerName || isMaxBidReached ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 text-[10px] font-black tracking-wider uppercase">
                <Trophy className="w-2.5 h-2.5 text-amber-400" />
                WINNER
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-500/15 border border-gray-500/30 text-gray-400 text-[10px] font-black tracking-wider uppercase">
                ENDED
              </span>
            )}

            {/* Mã phòng */}
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 border border-white/5" style={{ color: "rgb(var(--text-muted))" }}>
              #{roomId.slice(0, 8).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Tiêu đề ngắn gọn ở giữa màn hình lớn */}
        <div className="hidden lg:flex items-center gap-2 max-w-lg min-w-0 truncate">
          <h1 className="text-xs sm:text-sm font-bold truncate" style={{ color: "rgb(var(--text-main))" }}>
            {title}
          </h1>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
            <ShieldCheck className="w-3 h-3" /> Xác thực
          </span>
        </div>

        {/* Đồng hồ đếm ngược & Tiện ích */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Trạng thái đếm ngược / Chốt người thắng */}
          {isEnded ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border bg-amber-500/15 border-amber-500/30 text-amber-500 font-bold text-xs font-mono shadow-xs">
              <Trophy className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
              <span className="truncate max-w-[150px] sm:max-w-[200px]">
                {winnerName ? `THẮNG: ${winnerName}` : isMaxBidReached ? "CHẠM GIÁ TỐI ĐA" : "ĐÃ KẾT THÚC"}
              </span>
            </div>
          ) : (
            <div 
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border shadow-inner font-mono font-black text-xs sm:text-sm tracking-wider ${
                remainingMs < 60000 
                  ? "bg-red-500/20 border-red-500 text-red-500 animate-bounce" 
                  : "bg-orange-500/10 border-orange-500/30 text-orange-500"
              }`}
            >
              <Clock className="w-3.5 h-3.5 animate-spin-slow" />
              <span>{formatCountdown(remainingMs)}</span>
            </div>
          )}

          {/* Nút chuyển đổi chế độ 3D Gaming Arena */}
          {onToggle3DMode && (
            <button
              type="button"
              onClick={onToggle3DMode}
              className={`px-2.5 py-1 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                is3DMode
                  ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-400 shadow-md shadow-orange-500/25"
                  : "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 text-orange-400"
              }`}
              title="Chuyển đổi góc nhìn 3D Cyber Arena"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span className="hidden sm:inline">{is3DMode ? "Chế độ Chuẩn" : "3D Arena"}</span>
            </button>
          )}

          {/* Số lượng người xem trực tiếp */}
          <div 
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-xl border text-xs font-bold"
            style={{ borderColor: "rgba(var(--border-main), 0.2)", color: "rgb(var(--text-muted))" }}
          >
            <Eye className="w-3.5 h-3.5 text-blue-400" />
            <span>{viewerCount}</span>
          </div>

          {/* Âm thanh */}
          <button
            type="button"
            onClick={onToggleSound}
            title={soundEnabled ? "Tắt âm thanh hiệu ứng" : "Bật âm thanh hiệu ứng"}
            className="p-1.5 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            style={{ borderColor: "rgba(var(--border-main), 0.2)" }}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-orange-500" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-gray-400" />
            )}
          </button>

          {/* Chia sẻ link phòng */}
          <button
            type="button"
            onClick={handleShare}
            title="Sao chép liên kết phòng"
            className="p-1.5 rounded-xl border hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer relative"
            style={{ borderColor: "rgba(var(--border-main), 0.2)" }}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Share2 className="w-3.5 h-3.5 text-gray-400 hover:text-orange-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
