"use client";

import { useState } from "react";
import {
  X,
  Swords,
  Sparkles,
  Image as ImageIcon,
  Clock,
  DollarSign,
  Users,
  Ticket,
  Store,
  AlertCircle,
  LogIn,
} from "lucide-react";
import { useUser } from "@/components/auth/store/AuthStore";
import { useAuthModalStore } from "@/components/auth/store/useAuthModalStore";
import type { ArenaRoom } from "../types";

interface CreateArenaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newRoom: ArenaRoom) => void;
}

const SAMPLE_IMAGES = [
  {
    label: "Tai nghe Sony WH-1000XM5",
    url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
  },
  {
    label: "Bàn phím cơ Custom Mod007",
    url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
  },
  {
    label: "Chuột Gaming Logitech G Pro",
    url: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=80",
  },
  {
    label: "Mô hình Gundam RX-78-2",
    url: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80",
  },
];

export function CreateArenaModal({ isOpen, onClose, onSuccess }: CreateArenaModalProps) {
  const currentUser = useUser();
  const authModal = useAuthModalStore();

  const [title, setTitle] = useState("");
  const [storeName, setStoreName] = useState(
    currentUser?.user_metadata?.username || currentUser?.email?.split("@")[0] || ""
  );
  const [imageUrl, setImageUrl] = useState(SAMPLE_IMAGES[0].url);
  const [productValue, setProductValue] = useState("1500000");
  const [voucherCost, setVoucherCost] = useState("10000");
  const [maxParticipants, setMaxParticipants] = useState("5");
  const [durationMinutes, setDurationMinutes] = useState("45");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentUser) {
      setError("Vui lòng đăng nhập để mở phòng sàn đấu của bạn!");
      authModal.openLogin();
      return;
    }

    const numericValue = Number(productValue.replace(/\D/g, ""));
    const numericCost = Number(voucherCost.replace(/\D/g, "")) || 10000;
    const numericMax = Number(maxParticipants) || 5;

    if (!title.trim()) {
      setError("Vui lòng nhập tên phòng / tên vật phẩm đấu trường");
      return;
    }
    if (!numericValue || numericValue < 10000) {
      setError("Giá trị sản phẩm tối thiểu là 10.000đ");
      return;
    }
    if (numericMax < 2) {
      setError("Số người chơi tối thiểu là 2");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/arena/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          productImage: imageUrl,
          productValue: numericValue,
          voucherCost: numericCost,
          maxParticipants: numericMax,
          durationMinutes: Number(durationMinutes) || 45,
          storeName: storeName.trim() || currentUser.user_metadata?.username || "NexLoot Store",
          userId: currentUser.id,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể tạo phòng sàn đấu");
      }

      setIsLoading(false);
      onSuccess(data.room);
    } catch (err: any) {
      console.error("Lỗi tạo phòng:", err);
      setIsLoading(false);
      setError(err.message || "Đã xảy ra lỗi khi tạo phòng");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border p-6 sm:p-8 shadow-2xl transition-all custom-scrollbar"
        style={{
          backgroundColor: "rgb(var(--bg-card))",
          borderColor: "rgba(var(--border-main), 0.25)",
        }}
      >
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-muted transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Tiêu đề Modal */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-lg shadow-orange-500/20">
            <Swords size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: "rgb(var(--text-main))" }}>
              Tạo Phòng Sàn Đấu Mới
            </h2>
            <p className="text-xs" style={{ color: "rgb(var(--text-muted))" }}>
              Mở sàn đấu săn sản phẩm 0đ cho cộng đồng người chơi
            </p>
          </div>
        </div>

        {/* Cảnh báo chưa đăng nhập */}
        {!currentUser && (
          <div className="mb-5 flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>Bạn cần đăng nhập để tạo phòng và mời người chơi tham gia.</span>
            </div>
            <button
              type="button"
              onClick={() => authModal.openLogin()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 transition-colors shrink-0 cursor-pointer"
            >
              <LogIn size={13} />
              Đăng nhập
            </button>
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-center gap-2 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tên phòng / Tên sản phẩm */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "rgb(var(--text-main))" }}>
              Tên phòng / Tên sản phẩm <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Tai nghe Bluetooth Sony WH-1000XM5 hoặc Bàn phím cơ..."
              className="w-full px-4 py-3 rounded-2xl border bg-transparent text-sm outline-none focus:border-orange-500 transition-colors"
              style={{ borderColor: "rgba(var(--border-main), 0.3)", color: "rgb(var(--text-main))" }}
            />
          </div>

          {/* Tên Shop / Tên người tổ chức */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: "rgb(var(--text-main))" }}>
              <Store size={14} className="text-orange-500" /> Tên Shop / Tên người mở phòng
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="VD: TechZone Official Store hoặc Tên hiển thị của bạn"
              className="w-full px-4 py-3 rounded-2xl border bg-transparent text-sm outline-none focus:border-orange-500 transition-colors"
              style={{ borderColor: "rgba(var(--border-main), 0.3)", color: "rgb(var(--text-main))" }}
            />
          </div>

          {/* Chọn ảnh sản phẩm mẫu hoặc dán link */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: "rgb(var(--text-main))" }}>
              <ImageIcon size={14} className="text-orange-500" /> Ảnh sản phẩm sàn đấu
            </label>
            
            {/* Ảnh đang chọn preview */}
            <div className="relative aspect-video rounded-2xl overflow-hidden border mb-3 bg-black/10 flex items-center justify-center" style={{ borderColor: "rgba(var(--border-main), 0.2)" }}>
              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>

            {/* Presets */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              {SAMPLE_IMAGES.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setImageUrl(sample.url)}
                  className={`p-2 rounded-xl border text-xs font-semibold text-left truncate transition-all cursor-pointer ${
                    imageUrl === sample.url
                      ? "border-orange-500 bg-orange-500/10 text-orange-500"
                      : "border-border/30 hover:border-orange-500/40"
                  }`}
                  style={{ color: imageUrl === sample.url ? undefined : "rgb(var(--text-main))" }}
                >
                  {sample.label}
                </button>
              ))}
            </div>

            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Hoặc dán URL ảnh trực tiếp (https://...)"
              className="w-full px-4 py-2.5 rounded-xl border bg-transparent text-xs outline-none focus:border-orange-500 transition-colors"
              style={{ borderColor: "rgba(var(--border-main), 0.3)", color: "rgb(var(--text-main))" }}
            />
          </div>

          {/* Giá trị sản phẩm & Phí Voucher */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: "rgb(var(--text-main))" }}>
                <DollarSign size={14} className="text-orange-500" /> Trị giá sản phẩm (đ)
              </label>
              <input
                type="text"
                required
                value={Number(productValue.replace(/\D/g, "")).toLocaleString("vi-VN")}
                onChange={(e) => setProductValue(e.target.value.replace(/\D/g, ""))}
                placeholder="1.500.000"
                className="w-full px-4 py-3 rounded-2xl border bg-transparent text-sm font-mono font-bold outline-none focus:border-orange-500 transition-colors"
                style={{ borderColor: "rgba(var(--border-main), 0.3)", color: "rgb(var(--text-main))" }}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: "rgb(var(--text-main))" }}>
                <Ticket size={14} className="text-orange-500" /> Phí Thẻ (~đ)
              </label>
              <input
                type="text"
                required
                value={Number(voucherCost.replace(/\D/g, "")).toLocaleString("vi-VN")}
                onChange={(e) => setVoucherCost(e.target.value.replace(/\D/g, ""))}
                placeholder="10.000"
                className="w-full px-4 py-3 rounded-2xl border bg-transparent text-sm font-mono font-bold outline-none focus:border-orange-500 transition-colors"
                style={{ borderColor: "rgba(var(--border-main), 0.3)", color: "rgb(var(--text-main))" }}
              />
            </div>
          </div>

          {/* Số người chơi tối đa & Thời gian đếm ngược */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: "rgb(var(--text-main))" }}>
                <Users size={14} className="text-orange-500" /> Số người chơi cần đủ
              </label>
              <select
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border bg-transparent text-sm font-bold outline-none focus:border-orange-500 transition-colors cursor-pointer"
                style={{ borderColor: "rgba(var(--border-main), 0.3)", color: "rgb(var(--text-main))" }}
              >
                <option value="5" className="bg-zinc-900 text-white">5 người (Test nhanh)</option>
                <option value="10" className="bg-zinc-900 text-white">10 người</option>
                <option value="20" className="bg-zinc-900 text-white">20 người</option>
                <option value="50" className="bg-zinc-900 text-white">50 người</option>
                <option value="100" className="bg-zinc-900 text-white">100 người</option>
                <option value="150" className="bg-zinc-900 text-white">150 người</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: "rgb(var(--text-main))" }}>
                <Clock size={14} className="text-orange-500" /> Thời gian chờ (phút)
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border bg-transparent text-sm font-bold outline-none focus:border-orange-500 transition-colors cursor-pointer"
                style={{ borderColor: "rgba(var(--border-main), 0.3)", color: "rgb(var(--text-main))" }}
              >
                <option value="15" className="bg-zinc-900 text-white">15 phút</option>
                <option value="30" className="bg-zinc-900 text-white">30 phút</option>
                <option value="45" className="bg-zinc-900 text-white">45 phút</option>
                <option value="60" className="bg-zinc-900 text-white">60 phút (1 giờ)</option>
                <option value="120" className="bg-zinc-900 text-white">120 phút (2 giờ)</option>
              </select>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3 rounded-2xl border font-bold text-xs uppercase tracking-wider hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
              style={{ borderColor: "rgba(var(--border-main), 0.3)", color: "rgb(var(--text-main))" }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/25 hover:scale-102 active:scale-98 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {isLoading ? (
                "Đang tạo phòng..."
              ) : (
                <>
                  <Sparkles size={16} /> Mở Sàn Đấu Ngay
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
