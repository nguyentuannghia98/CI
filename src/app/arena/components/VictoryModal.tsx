"use client";

import { Trophy, Sparkles, PackageCheck, X } from "lucide-react";
import { ArenaRoom, Participant } from "../types";

interface VictoryModalProps {
  room: ArenaRoom | null;
  winner: Participant | null;
  onClose: () => void;
}

export function VictoryModal({ room, winner, onClose }: VictoryModalProps) {
  if (!room || !winner) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div
        className="w-full max-w-md rounded-3xl border p-6 text-center space-y-5 shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden"
        style={{
          backgroundColor: "rgb(var(--bg-card))",
          borderColor: "rgba(249, 115, 22, 0.4)",
        }}
      >
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-orange-500/10 text-muted-foreground"
        >
          <X size={18} />
        </button>

        {/* Icon Cúp */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-xl shadow-orange-500/30 animate-bounce">
          <Trophy size={40} />
        </div>

        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20">
            <Sparkles size={12} /> Đã tìm ra người may mắn!
          </span>
          <h3 className="text-xl font-black mt-2" style={{ color: "rgb(var(--text-main))" }}>
            {room.title}
          </h3>
        </div>

        {/* Thẻ người thắng */}
        <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 space-y-1">
          <div className="text-xs text-muted-foreground">Người chiến thắng phòng:</div>
          <div className="text-lg font-black text-orange-500 flex items-center justify-center gap-2">
            <span className="w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
              {winner.avatar}
            </span>
            {winner.name}
          </div>
        </div>

        {/* Hướng dẫn nhận hàng */}
        <div className="text-left p-3.5 rounded-2xl bg-card border text-xs space-y-2" style={{ borderColor: "rgba(var(--border-main), 0.15)" }}>
          <div className="font-bold flex items-center gap-1.5 text-emerald-500">
            <PackageCheck size={16} /> Thông báo nhận sản phẩm:
          </div>
          <p className="leading-relaxed" style={{ color: "rgb(var(--text-muted))" }}>
            Hệ thống đã tự động gửi **Email xác nhận** tới người thắng cuộc và Shop <strong style={{ color: "rgb(var(--text-main))" }}>{room.storeName}</strong>. 
            Hai bên sẽ chủ động liên hệ để thương lượng phương thức ship hoặc nhận trực tiếp.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs hover:opacity-90 shadow-lg shadow-orange-500/25 transition-all"
        >
          Tuyệt vời, Đóng thông báo
        </button>
      </div>
    </div>
  );
}