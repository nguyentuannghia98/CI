"use client";

import Link from "next/link";
import { Trophy, Sparkles, CheckCircle2, ShieldCheck, X, ArrowRight, Gavel } from "lucide-react";

interface AuctionVictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  winner: {
    id?: string;
    name: string;
    avatar: string;
    verified?: boolean;
  } | null;
  auctionTitle: string;
  winningAmount: number;
  isMaxBidReached?: boolean;
}

export default function AuctionVictoryModal({
  isOpen,
  onClose,
  winner,
  auctionTitle,
  winningAmount,
  isMaxBidReached = false,
}: AuctionVictoryModalProps) {
  if (!isOpen || !winner) return null;

  const isClickable = Boolean(winner.id && winner.id !== "me" && !winner.id.startsWith("guest_"));

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-md rounded-3xl border p-6 sm:p-7 text-center shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden"
        style={{
          backgroundColor: "rgb(var(--bg-card))",
          borderColor: "rgba(245, 158, 11, 0.4)",
          color: "rgb(var(--text-main))",
        }}
      >
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-gray-400 hover:text-orange-500"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Biểu tượng Cup chiến thắng với hiệu ứng tỏa sáng */}
        <div className="relative mx-auto w-20 h-20 mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-amber-500/20 animate-ping opacity-75" />
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 flex items-center justify-center text-white shadow-xl shadow-amber-500/30">
            <Trophy className="w-10 h-10 animate-bounce" />
          </div>
        </div>

        {/* Huy hiệu kết thúc */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-500 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          {isMaxBidReached ? "CHẠM MỨC GIÁ TỐI ĐA — CHIẾN THẮNG!" : "PHIÊN ĐẤU GIÁ KẾT THÚC"}
        </div>

        {/* Tiêu đề sản phẩm */}
        <h3 className="text-base sm:text-lg font-black line-clamp-2 px-2 mb-4" style={{ color: "rgb(var(--text-main))" }}>
          {auctionTitle}
        </h3>

        {/* Khung tôn vinh người chiến thắng */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 mb-4 space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 block">
            👑 Người chiến thắng chung cuộc
          </span>

          <div className="flex items-center justify-center gap-3">
            {isClickable ? (
              <Link 
                href={`/profile/${winner.id}`}
                className="group/winner flex items-center gap-2.5 hover:opacity-90 transition-opacity"
                title={`Xem trang cá nhân của ${winner.name}`}
              >
                <img
                  src={winner.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${winner.name}`}
                  alt={winner.name}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(winner.name)}`;
                  }}
                  className="w-10 h-10 rounded-full object-cover border-2 border-amber-500 group-hover/winner:scale-105 transition-transform"
                />
                <div className="text-left">
                  <div className="text-sm font-black flex items-center gap-1 group-hover/winner:text-amber-500 transition-colors" style={{ color: "rgb(var(--text-main))" }}>
                    <span>{winner.name}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  </div>
                  <span className="text-[10px] text-muted opacity-70">Thành viên xác thực</span>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-2.5">
                <img
                  src={winner.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${winner.name}`}
                  alt={winner.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-amber-500"
                />
                <div className="text-left">
                  <div className="text-sm font-black flex items-center gap-1" style={{ color: "rgb(var(--text-main))" }}>
                    <span>{winner.name}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  </div>
                  <span className="text-[10px] text-muted opacity-70">Thành viên xác thực</span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-xs">
            <span className="text-muted opacity-75">Mức giá thắng cuộc:</span>
            <span className="font-mono text-base font-black text-amber-500">
              {winningAmount.toLocaleString("vi-VN")}đ
            </span>
          </div>
        </div>

        {/* Cam kết Escrow và bảo hộ sàn */}
        <div className="text-left p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-white/10 text-xs space-y-1 mb-5" style={{ color: "rgb(var(--text-muted))" }}>
          <div className="font-bold flex items-center gap-1.5 text-emerald-500">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> Giao dịch bảo đảm NexLoot Escrow:
          </div>
          <p className="text-[11px] leading-relaxed">
            Hệ thống đã chốt kết quả và khóa phiên. Người mua và người bán vui lòng kiểm tra hộp tin nhắn để hoàn tất quy trình giao nhận hàng an toàn.
          </p>
        </div>

        {/* Nút hành động */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border font-bold text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            style={{ borderColor: "rgba(var(--border-main), 0.3)" }}
          >
            Đóng bảng
          </button>
          {isClickable && (
            <Link
              href={`/profile/${winner.id}`}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-amber-500/25 hover:from-amber-600 hover:to-orange-600 transition-all cursor-pointer"
            >
              <span>Trang người thắng</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

