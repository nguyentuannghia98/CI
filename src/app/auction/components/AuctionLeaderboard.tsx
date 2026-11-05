"use client";

import Link from "next/link";
import { Trophy, Crown, Medal, TrendingUp, Sparkles } from "lucide-react";

export interface BidRecord {
  id: string;
  bidder: {
    id: string;
    name: string;
    avatar: string;
    verified?: boolean;
    kycType?: string;
  };
  amount: number;
  placedAt: string;
}

interface AuctionLeaderboardProps {
  bids: BidRecord[];
  currentBid: number;
}

export default function AuctionLeaderboard({ bids, currentBid }: AuctionLeaderboardProps) {
  const formatMoney = (n: number) => n.toLocaleString("vi-VN") + "đ";

  // Sắp xếp các lượt bid từ cao xuống thấp
  const sortedBids = [...bids].sort((a, b) => b.amount - a.amount);

  return (
    <div 
      className="rounded-2xl border p-2.5 sm:p-3 flex flex-col h-full min-h-0 shadow-md transition-all overflow-hidden"
      style={{
        backgroundColor: "rgb(var(--bg-card))",
        borderColor: "rgba(var(--border-main), 0.2)",
      }}
    >
      {/* Header Leaderboard */}
      <div className="flex items-center justify-between pb-2 mb-1.5 border-b shrink-0" style={{ borderColor: "rgba(var(--border-main), 0.15)" }}>
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-lg bg-amber-500/10 text-amber-500">
            <Trophy className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-tight flex items-center gap-1" style={{ color: "rgb(var(--text-main))" }}>
              Bảng Xếp Hạng Top Bids
              <Sparkles className="w-3 h-3 text-amber-400" />
            </h3>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-lg">
          {sortedBids.length} Lượt bid
        </span>
      </div>

      {/* Danh sách xếp hạng (Cuộn nội bộ) */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
        {sortedBids.length === 0 ? (
          <div className="text-center py-8 text-xs" style={{ color: "rgb(var(--text-muted))" }}>
            Chưa có lượt trả giá nào. Hãy là người đầu tiên đặt giá!
          </div>
        ) : (
          sortedBids.map((bid, index) => {
            const rank = index + 1;
            const isTop1 = rank === 1;
            const isTop2 = rank === 2;
            const isTop3 = rank === 3;
            const isClickable = Boolean(bid.bidder.id && bid.bidder.id !== "me" && !bid.bidder.id.startsWith("guest_"));

            return (
              <div
                key={bid.id || index}
                className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                  isTop1
                    ? "bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border-amber-500/40 shadow-xs"
                    : "border-transparent bg-black/5 dark:bg-white/5 hover:border-white/10"
                }`}
              >
                {/* Thứ hạng & Người bid */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-4 flex items-center justify-center shrink-0">
                    {isTop1 ? (
                      <Crown className="w-4 h-4 text-amber-400" />
                    ) : isTop2 ? (
                      <Medal className="w-4 h-4 text-slate-300" />
                    ) : isTop3 ? (
                      <Medal className="w-4 h-4 text-amber-600" />
                    ) : (
                      <span className="text-xs font-mono font-bold opacity-40">#{rank}</span>
                    )}
                  </div>

                  {/* Avatar người bid - Click chuyển trang profile */}
                  {isClickable ? (
                    <Link
                      href={`/profile/${bid.bidder.id}`}
                      className="shrink-0 group/avatar"
                      title={`Xem trang cá nhân của ${bid.bidder.name}`}
                    >
                      <img
                        src={bid.bidder.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${bid.bidder.name}`}
                        alt={bid.bidder.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(bid.bidder.name || "user")}`;
                        }}
                        className="w-6 h-6 rounded-full object-cover border border-white/10 group-hover/avatar:border-orange-500 group-hover/avatar:scale-105 transition-all cursor-pointer"
                      />
                    </Link>
                  ) : (
                    <img
                      src={bid.bidder.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${bid.bidder.name}`}
                      alt={bid.bidder.name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(bid.bidder.name || "user")}`;
                      }}
                      className="w-6 h-6 rounded-full object-cover border border-white/10 shrink-0"
                    />
                  )}

                  {/* Tên người bid - Click chuyển trang profile */}
                  <div className="min-w-0">
                    {isClickable ? (
                      <Link
                        href={`/profile/${bid.bidder.id}`}
                        className="text-xs font-bold truncate max-w-[85px] sm:max-w-[110px] hover:text-orange-500 hover:underline transition-colors block cursor-pointer"
                        style={{ color: "rgb(var(--text-main))" }}
                        title={`Xem trang cá nhân của ${bid.bidder.name}`}
                      >
                        {bid.bidder.name}
                      </Link>
                    ) : (
                      <p className="text-xs font-bold truncate max-w-[85px] sm:max-w-[110px]" style={{ color: "rgb(var(--text-main))" }}>
                        {bid.bidder.name}
                      </p>
                    )}
                    <span className="text-[9px] block opacity-50">
                      {bid.placedAt}
                    </span>
                  </div>
                </div>

                {/* Số tiền */}
                <div className="text-right shrink-0">
                  <div className={`font-mono text-xs font-black ${isTop1 ? "text-amber-500" : "text-orange-500"}`}>
                    {formatMoney(bid.amount)}
                  </div>
                  {isTop1 && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-500 uppercase tracking-tighter">
                      <TrendingUp className="w-2.5 h-2.5" /> Dẫn đầu
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
