"use client";

import Link from "next/link";
import { Swords, Ticket, ShoppingBag, Plus } from "lucide-react";

export interface ArenaHeaderProps {
  voucherCount: number;
  onOpenCreateModal?: () => void;
}

export function ArenaHeader({ voucherCount, onOpenCreateModal }: ArenaHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20">
      {/* Tiêu đề & Giới thiệu */}
      <div className="flex items-center gap-4">
        <div className="p-4 rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/30 shrink-0">
          <Swords size={32} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold" style={{ color: "rgb(var(--text-main))" }}>
              Đấu Trường Arena
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20">
              Free Play
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: "rgb(var(--text-muted))" }}>
            Dùng Thẻ nhận được từ việc mua hàng để săn sản phẩm 0đ hoặc tự mở phòng sàn đấu của bạn!
          </p>
        </div>
      </div>

      {/* Kho Thẻ & Nút Tạo Phòng Sàn Đấu */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Kho Thẻ của User */}
        <div
          className="flex items-center gap-3 p-3 rounded-2xl border shadow-xs"
          style={{
            backgroundColor: "rgb(var(--bg-card))",
            borderColor: "rgba(var(--border-main), 0.2)",
          }}
        >
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
            <Ticket size={24} />
          </div>
          <div>
            <div className="text-[11px]" style={{ color: "rgb(var(--text-muted))" }}>
              Kho Thẻ khả dụng
            </div>
            <div className="text-lg font-black text-amber-500 font-mono">
              {voucherCount} Thẻ
            </div>
          </div>
          <Link
            href="/giao-thuong"
            className="ml-2 px-3 py-2 rounded-xl bg-orange-500/10 text-orange-500 text-xs font-bold hover:bg-orange-500 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
            title="Đến trang Giao Thương để mua hàng tích Thẻ"
          >
            <ShoppingBag size={14} /> Mua sắm tích thẻ
          </Link>
        </div>

        {/* Nút Tạo Phòng Sàn Đấu Nổi Bật */}
        {onOpenCreateModal && (
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <Plus size={18} />
            <span>Tạo Phòng Sàn Đấu</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default ArenaHeader;
