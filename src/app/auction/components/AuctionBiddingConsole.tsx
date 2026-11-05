"use client";

import { useState } from "react";
import { Gavel, Plus, AlertCircle, Sparkles, ShieldCheck, ShieldAlert, Trophy, Zap } from "lucide-react";

interface AuctionBiddingConsoleProps {
  currentBid: number;
  minStep: number;
  maxBid?: number;
  isEnded: boolean;
  isOwner?: boolean;
  onPlaceBid: (amount: number) => Promise<boolean | void>;
}

export default function AuctionBiddingConsole({
  currentBid,
  minStep,
  maxBid,
  isEnded,
  isOwner = false,
  onPlaceBid,
}: AuctionBiddingConsoleProps) {
  const [customBid, setCustomBid] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const minValidBid = maxBid ? Math.min(maxBid, currentBid + minStep) : currentBid + minStep;
  const isMaxReached = Boolean(maxBid && currentBid >= maxBid);
  const isActionDisabled = isEnded || isMaxReached || isSubmitting || isOwner;
  const formatMoney = (n: number) => n.toLocaleString("vi-VN") + "đ";

  // Đè giá nhanh bằng nút cộng
  const handleQuickAdd = async (increment: number) => {
    if (isActionDisabled) return;
    setErrorMessage(null);
    let targetAmount = currentBid + increment;
    if (maxBid && targetAmount > maxBid) {
      targetAmount = maxBid;
    }
    await executeBid(targetAmount);
  };

  // Trả giá theo ô input
  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isActionDisabled) return;
    setErrorMessage(null);

    let numericVal = Number(customBid.replace(/\D/g, ""));
    if (!numericVal || numericVal < minValidBid) {
      setErrorMessage(`Giá đặt phải tối thiểu là ${formatMoney(minValidBid)}`);
      return;
    }

    if (maxBid && numericVal > maxBid) {
      numericVal = maxBid;
    }

    await executeBid(numericVal);
    setCustomBid("");
  };

  const executeBid = async (amount: number) => {
    if (isOwner) {
      setErrorMessage("Bạn là chủ phòng, không thể tự đấu giá món đồ của chính mình.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onPlaceBid(amount);
    } catch (err: any) {
      setErrorMessage(err?.message || "Có lỗi khi đặt giá, vui lòng thử lại");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="rounded-2xl border p-2.5 sm:p-3 flex flex-col gap-2 shadow-md transition-all shrink-0"
      style={{
        backgroundColor: "rgb(var(--bg-card))",
        borderColor: "rgba(var(--border-main), 0.2)",
      }}
    >
      {/* Tiêu đề thanh đè giá & Giá tối thiểu */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-orange-500 flex items-center gap-1.5">
          <Gavel className="w-3.5 h-3.5" /> Bảng Điều Khiển Trả Giá
        </span>
        <span className="text-[11px] font-bold" style={{ color: "rgb(var(--text-muted))" }}>
          {isMaxReached ? (
            <span className="text-amber-500 font-bold">ĐÃ ĐẠT GIÁ TỐI ĐA</span>
          ) : (
            <>Giá hợp lệ tiếp: <b className="text-orange-500 font-mono">{formatMoney(minValidBid)}</b></>
          )}
        </span>
      </div>

      {/* Cảnh báo chủ phòng nếu có */}
      {isOwner && (
        <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[11px] font-semibold flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>Bạn là chủ phòng của phiên đấu giá này (không thể tự đấu giá món đồ của mình).</span>
        </div>
      )}

      {/* Thông báo lỗi */}
      {errorMessage && (
        <div className="p-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-[11px] flex items-center gap-1.5 animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* NÚT THẮNG NGAY / ĐẠT GIÁ TỐI ĐA (Nếu có thiết lập maxBid và chưa chạm trần) */}
      {maxBid && currentBid < maxBid && !isEnded && !isOwner && (
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => executeBid(maxBid)}
          className="w-full py-1.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white shadow-md shadow-amber-500/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer group"
          title={`Đặt mức giá ${formatMoney(maxBid)} để giành chiến thắng ngay lập tức`}
        >
          <Trophy className="w-3.5 h-3.5 text-white group-hover:scale-125 transition-transform animate-bounce" />
          <span>ĐẶT GIÁ TỐI ĐA (THẮNG NGAY): {formatMoney(maxBid)}</span>
        </button>
      )}

      {/* Dãy nút đè giá nhanh (+50k, +100k, +200k, +500k) */}
      <div className="grid grid-cols-4 gap-1.5">
        {[50000, 100000, 200000, 500000].map((step) => {
          const wouldExceedMax = Boolean(maxBid && currentBid + step > maxBid);
          const disabled = isActionDisabled;
          return (
            <button
              key={step}
              type="button"
              disabled={disabled}
              onClick={() => handleQuickAdd(step)}
              className={`py-1.5 px-1 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-0.5 cursor-pointer active:scale-95 ${
                disabled
                  ? "opacity-40 cursor-not-allowed bg-black/5 dark:bg-white/5 border-transparent"
                  : wouldExceedMax
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                  : "hover:border-orange-500 hover:bg-orange-500/10 hover:text-orange-500"
              }`}
              style={{
                borderColor: wouldExceedMax ? undefined : "rgba(var(--border-main), 0.2)",
                backgroundColor: wouldExceedMax ? undefined : "rgba(var(--bg-surface), 0.5)",
                color: wouldExceedMax ? undefined : "rgb(var(--text-main))",
              }}
            >
              <Plus className="w-3 h-3 text-orange-500" />
              <span>+{step >= 1000000 ? `${step / 1000000}tr` : `${step / 1000}k`}</span>
            </button>
          );
        })}
      </div>

      {/* Nhập giá tự do & Nút Đè Giá */}
      <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={customBid}
            disabled={isActionDisabled}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              if (!val) {
                setCustomBid("");
                return;
              }
              const num = Number(val);
              if (maxBid && num > maxBid) {
                setCustomBid(maxBid.toLocaleString("vi-VN"));
              } else {
                setCustomBid(num.toLocaleString("vi-VN"));
              }
            }}
            placeholder={
              maxBid 
                ? `Nhập số tiền (tối đa ${formatMoney(maxBid)})...` 
                : `Nhập số tiền (tối thiểu ${formatMoney(minValidBid)})...`
            }
            className="w-full h-8 sm:h-9 px-3 rounded-xl border text-xs font-mono font-bold transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:opacity-50"
            style={{
              borderColor: "rgba(var(--border-main), 0.25)",
              backgroundColor: "rgba(var(--bg-surface), 0.6)",
              color: "rgb(var(--text-main))",
            }}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none opacity-40">
            đ
          </span>
        </div>

        <button
          type="submit"
          disabled={isActionDisabled}
          className={`h-8 sm:h-9 px-4 sm:px-6 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer ${
            isActionDisabled
              ? "opacity-50 cursor-not-allowed bg-gray-600"
              : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 shadow-orange-500/20"
          }`}
        >
          <Gavel className="w-3.5 h-3.5" />
          <span>{isSubmitting ? "Đang gửi..." : "Đè Giá"}</span>
        </button>
      </form>
    </div>
  );
}
