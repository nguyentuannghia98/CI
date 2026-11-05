"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, ShieldCheck, Tag, Award, RotateCw, Image as ImageIcon, FileText, CheckCircle2, Trophy, Sparkles } from "lucide-react";
import Auction3DArena from "./Auction3DArena";

interface AuctionProductMediaProps {
  title: string;
  description: string;
  imageUrl: string;
  currentBid: number;
  startBid: number;
  bidCount: number;
  minStep: number;
  maxBid?: number;
  category?: string;
  condition?: string;
  isEnded?: boolean;
  isMaxBidReached?: boolean;
  onPlaceBid?: (amount: number) => void;
  activeTab?: "media" | "3d" | "specs";
  onTabChange?: (tab: "media" | "3d" | "specs") => void;
  highestBidder?: {
    id?: string;
    name: string;
    verified?: boolean;
    avatar: string;
  };
  seller?: {
    id?: string;
    name: string;
    verified?: boolean;
    avatar: string;
  };
}

export default function AuctionProductMedia({
  title,
  description,
  imageUrl,
  currentBid,
  startBid,
  bidCount,
  minStep,
  maxBid,
  category = "Thiết bị Gaming",
  condition = "Nguyên seal 100%",
  isEnded = false,
  isMaxBidReached = false,
  onPlaceBid,
  activeTab: controlledTab,
  onTabChange,
  highestBidder,
  seller = {
    name: "NexLoot Verified Trader",
    verified: true,
    avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=seller-verified",
  },
}: AuctionProductMediaProps) {
  const [internalTab, setInternalTab] = useState<"media" | "3d" | "specs">("media");
  const activeTab = controlledTab !== undefined ? controlledTab : internalTab;
  const setTab = (t: "media" | "3d" | "specs") => {
    setInternalTab(t);
    onTabChange?.(t);
  };

  const formatMoney = (n: number) => n.toLocaleString("vi-VN") + "đ";

  return (
    <div 
      className="rounded-2xl border p-2.5 sm:p-3 flex flex-col gap-2.5 shadow-md transition-all h-full min-h-0 overflow-hidden"
      style={{
        backgroundColor: "rgb(var(--bg-card))",
        borderColor: "rgba(var(--border-main), 0.2)",
      }}
    >
      {/* 1. KHUNG ẢNH SẢN PHẨM / ĐẤU TRƯỜNG 3D CYBER ARENA */}
      <div className="relative w-full flex-1 min-h-[160px] rounded-xl overflow-hidden bg-black/40 border border-white/10 group select-none flex items-center justify-center">
        {/* Badge góc trái (chỉ hiện khi ở tab media hoặc specs) */}
        {activeTab !== "3d" && (
          <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-1.5 pointer-events-none">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-wider">
              <Award className="w-3 h-3 text-amber-400" /> ĐẤU GIÁ
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/80 backdrop-blur-md text-white text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3" /> {condition}
            </span>
          </div>
        )}

        {/* Tab 1: Chi tiết ảnh 2D thông thường */}
        {activeTab === "media" && (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
          />
        )}

        {/* Tab 2: ĐẤU TRƯỜNG THREE.JS 3D CYBER ARENA */}
        {activeTab === "3d" && (
          <div className="w-full h-full">
            <Auction3DArena
              title={title}
              imageUrl={imageUrl}
              currentBid={currentBid}
              startBid={startBid}
              maxBid={maxBid}
              minStep={minStep}
              category={category}
              condition={condition}
              highestBidder={highestBidder}
              seller={seller}
              isEnded={isEnded}
              isMaxBidReached={isMaxBidReached}
              onPlaceBid={onPlaceBid}
              onClose3D={() => setTab("media")}
            />
          </div>
        )}

        {/* Tab 3: Thông số kỹ thuật */}
        {activeTab === "specs" && (
          <div className="w-full h-full p-3 overflow-y-auto text-xs space-y-2 bg-zinc-900/95 text-zinc-200 custom-scrollbar">
            <h4 className="font-bold text-xs text-orange-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Thông Số & Cam Kết Kiểm Định
            </h4>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                <span className="text-zinc-400 block text-[10px]">Danh mục:</span>
                <span className="font-bold truncate block">{category}</span>
              </div>
              <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                <span className="text-zinc-400 block text-[10px]">Tình trạng:</span>
                <span className="font-bold text-emerald-400 truncate block">{condition}</span>
              </div>
              <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                <span className="text-zinc-400 block text-[10px]">Kiểm định:</span>
                <span className="font-bold text-blue-400 truncate block">NexLoot Certified</span>
              </div>
              <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                <span className="text-zinc-400 block text-[10px]">Bảo hành sàn:</span>
                <span className="font-bold truncate block">30 ngày đổi trả</span>
              </div>
            </div>
            <p className="text-[10px] text-zinc-400 leading-tight pt-1 line-clamp-3">
              {description || "Sản phẩm được bảo đảm nguồn gốc chính hãng từ thành viên KYC. Hệ thống bảo vệ giao dịch NexLoot Escrow."}
            </p>
          </div>
        )}

        {/* Thanh chọn Tab góc dưới phải (ẩn khi đang ở tab 3d vì 3d có thanh công cụ riêng) */}
        {activeTab !== "3d" && (
          <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 p-0.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/20">
            <button
              type="button"
              onClick={() => setTab("media")}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === "media" ? "bg-orange-500 text-white shadow-xs" : "text-white/70 hover:text-white"
              }`}
            >
              <ImageIcon className="w-3 h-3" /> Chi tiết
            </button>
            <button
              type="button"
              onClick={() => setTab("3d")}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/40 text-amber-300 hover:text-white`}
              title="Khám phá sàn đấu 3D Gaming Arena"
            >
              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" /> 3D Arena
            </button>
            <button
              type="button"
              onClick={() => setTab("specs")}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                activeTab === "specs" ? "bg-orange-500 text-white shadow-xs" : "text-white/70 hover:text-white"
              }`}
            >
              <FileText className="w-3 h-3" /> Thông số
            </button>
          </div>
        )}
      </div>

      {/* 2. THÔNG TIN SẢN PHẨM & MỨC GIÁ DẪN ĐẦU (Ở DƯỚI) */}
      <div className="shrink-0 w-full flex flex-col gap-2">
        {/* Hàng 1: Danh mục + Tiêu đề & Chủ phòng */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-wider shrink-0">
              <Tag className="w-3 h-3" /> {category}
            </span>
            <h2 className="text-sm sm:text-base font-black tracking-tight truncate" style={{ color: "rgb(var(--text-main))" }}>
              {title}
            </h2>
          </div>

          {/* Chủ phòng */}
          {seller?.id ? (
            <Link
              href={`/profile/${seller.id}`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border hover:border-orange-500/50 hover:bg-orange-500/5 transition-all cursor-pointer text-xs shrink-0"
              style={{ borderColor: "rgba(var(--border-main), 0.2)", backgroundColor: "rgba(var(--bg-surface), 0.5)" }}
              title={`Xem trang cá nhân ${seller.name}`}
            >
              <img
                src={seller.avatar}
                alt={seller.name}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seller.name)}`;
                }}
                className="w-5 h-5 rounded-full object-cover border border-orange-500/30"
              />
              <span className="text-[11px] font-bold truncate max-w-[100px]" style={{ color: "rgb(var(--text-main))" }}>
                {seller.name}
              </span>
              {seller.verified && <ShieldCheck className="w-3 h-3 text-blue-500 shrink-0" />}
            </Link>
          ) : (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs shrink-0"
              style={{ borderColor: "rgba(var(--border-main), 0.2)", backgroundColor: "rgba(var(--bg-surface), 0.5)" }}
            >
              <img
                src={seller?.avatar}
                alt={seller?.name || "Chủ phòng"}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seller?.name || "seller")}`;
                }}
                className="w-5 h-5 rounded-full object-cover border border-orange-500/30"
              />
              <span className="text-[11px] font-bold truncate max-w-[100px]" style={{ color: "rgb(var(--text-main))" }}>
                {seller?.name}
              </span>
              {seller?.verified && <ShieldCheck className="w-3 h-3 text-blue-500 shrink-0" />}
            </div>
          )}
        </div>

        {/* Hàng 2: Khung Mức Giá Dẫn Đầu Hiện Tại */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-transparent border border-orange-500/30 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-orange-500">
                <TrendingUp className="w-3 h-3 animate-bounce" /> MỨC GIÁ DẪN ĐẦU
              </div>
              <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600 drop-shadow-sm font-mono tracking-tight leading-none mt-0.5">
                {formatMoney(currentBid)}
              </div>
              {highestBidder ? (
                <div className="flex items-center gap-1 text-[11px] mt-1" style={{ color: "rgb(var(--text-muted))" }}>
                  <span>Dẫn đầu:</span>
                  {highestBidder.id && highestBidder.id !== "me" && !highestBidder.id.startsWith("guest_") ? (
                    <Link
                      href={`/profile/${highestBidder.id}`}
                      className="text-orange-500 font-bold truncate max-w-[140px] hover:underline cursor-pointer"
                      title={`Xem trang cá nhân ${highestBidder.name}`}
                    >
                      {highestBidder.name}
                    </Link>
                  ) : (
                    <b className="text-orange-500 truncate max-w-[140px]">{highestBidder.name}</b>
                  )}
                  {highestBidder.verified && <ShieldCheck className="w-3 h-3 text-blue-500 shrink-0 inline" />}
                </div>
              ) : (
                <div className="text-[11px] opacity-60 mt-0.5">Chưa có ai đặt giá</div>
              )}
            </div>

            <div className="flex flex-col items-end justify-between gap-0.5 text-right shrink-0">
              <span className="inline-flex items-center gap-1 text-[10px] text-orange-500 font-bold bg-orange-500/10 px-2 py-0.5 rounded-md">
                🔥 {bidCount} lượt trả giá
              </span>
              <div className="text-[10px] sm:text-[11px] space-y-0.5" style={{ color: "rgb(var(--text-muted))" }}>
                <div>Khởi điểm: <b>{formatMoney(startBid)}</b></div>
                <div>Bước giá: <b>+{formatMoney(minStep)}</b></div>
                {maxBid && (
                  <div className="text-amber-500 font-black flex items-center justify-end gap-1">
                    <Trophy className="w-3 h-3" />
                    <span>Giá trần: <b>{formatMoney(maxBid)}</b></span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Thanh tiến độ chạm Giá tối đa (Thắng ngay) */}
          {maxBid && (
            <div className="pt-1.5 border-t border-orange-500/15 w-full">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="font-semibold text-amber-500 flex items-center gap-1">
                  <Trophy className="w-3 h-3" /> Tiến độ chạm Giá Tối Đa (Thắng Ngay):
                </span>
                <span className="font-mono font-bold text-amber-500">
                  {Math.min(100, Math.round((currentBid / maxBid) * 100))}% ({formatMoney(maxBid)})
                </span>
              </div>
              <div className="w-full h-1.5 bg-black/20 dark:bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 transition-all duration-500 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, (currentBid / maxBid) * 100))}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Hàng 3: Mô tả vật phẩm (Compact) */}
        {description && (
          <div 
            className="text-[11px] leading-relaxed p-1.5 sm:p-2 rounded-xl border line-clamp-1 hover:line-clamp-none transition-all cursor-pointer"
            style={{ 
              backgroundColor: "rgba(var(--bg-surface), 0.4)", 
              borderColor: "rgba(var(--border-main), 0.15)", 
              color: "rgb(var(--text-muted))" 
            }}
            title="Mô tả sản phẩm"
          >
            <p className="font-medium truncate">{description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
