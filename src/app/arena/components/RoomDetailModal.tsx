"use client";

import Link from "next/link";
import { X, Users, ShieldCheck, Sparkles, ExternalLink } from "lucide-react";
import { ArenaRoom } from "../types";

interface RoomDetailModalProps {
  room: ArenaRoom | null;
  onClose: () => void;
}

export function RoomDetailModal({ room, onClose }: RoomDetailModalProps) {
  if (!room) return null;

  const creatorId = room.creator?.id;
  const creatorName = room.creator?.name || room.storeName || "Chủ sàn đấu";
  const creatorAvatar =
    room.creator?.avatar ||
    (creatorId
      ? `https://api.dicebear.com/7.x/bottts/svg?seed=${creatorId}`
      : `https://api.dicebear.com/7.x/bottts/svg?seed=${room.id}`);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="w-full max-w-lg rounded-3xl border p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200"
        style={{ backgroundColor: "rgb(var(--bg-card))", borderColor: "rgba(var(--border-main), 0.2)" }}
      >
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "rgba(var(--border-main), 0.15)" }}>
          <div>
            <h3 className="font-bold text-base" style={{ color: "rgb(var(--text-main))" }}>Chi tiết phòng Arena</h3>
            <p className="text-xs text-orange-500 font-medium">{room.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-orange-500/10 text-muted-foreground transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Thông tin Người Tạo Phòng / Chủ Sàn Đấu */}
        <div
          className="flex items-center justify-between p-3.5 rounded-2xl border"
          style={{
            backgroundColor: "rgba(var(--bg-surface), 0.6)",
            borderColor: "rgba(var(--border-main), 0.2)",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {creatorId ? (
              <Link
                href={`/profile/${creatorId}`}
                className="group/creator flex items-center gap-3 min-w-0 hover:opacity-85 transition-opacity cursor-pointer"
                title={`Xem trang cá nhân của ${creatorName}`}
              >
                <div className="relative shrink-0">
                  <img
                    src={creatorAvatar}
                    alt={creatorName}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(creatorName)}`;
                    }}
                    className="w-11 h-11 rounded-full object-cover border-2 border-orange-500/40 group-hover/creator:border-orange-500 transition-colors shadow-sm"
                  />
                  {room.creator?.verified && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-zinc-900" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-orange-500 flex items-center gap-1">
                      <Sparkles size={10} /> Chủ phòng sàn đấu
                    </span>
                  </div>
                  <span
                    className="font-bold text-sm block truncate group-hover/creator:text-orange-500 group-hover/creator:underline transition-colors mt-0.5"
                    style={{ color: "rgb(var(--text-main))" }}
                  >
                    {creatorName}
                  </span>
                  <span className="text-[11px] block text-muted-foreground truncate">
                    Cửa hàng: {room.storeName}
                  </span>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={creatorAvatar}
                  alt={creatorName}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(creatorName)}`;
                  }}
                  className="w-11 h-11 rounded-full object-cover border-2 border-orange-500/20 shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-orange-500 block">
                    Chủ phòng sàn đấu
                  </span>
                  <span className="font-bold text-sm block truncate" style={{ color: "rgb(var(--text-main))" }}>
                    {creatorName}
                  </span>
                  <span className="text-[11px] block text-muted-foreground truncate">
                    Cửa hàng: {room.storeName}
                  </span>
                </div>
              </div>
            )}
          </div>

          {creatorId && (
            <Link
              href={`/profile/${creatorId}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white border border-orange-500/20 transition-all cursor-pointer shrink-0 ml-2"
            >
              <span>Hồ sơ</span>
              <ExternalLink size={12} />
            </Link>
          )}
        </div>

        {/* Cam kết hệ thống */}
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs flex items-center gap-2">
          <ShieldCheck size={18} className="shrink-0" />
          <span>Nếu không đủ {room.maxParticipants} người khi hết thời gian, 100% Thẻ sẽ tự động hoàn về kho!</span>
        </div>

        {/* Danh sách người tham gia */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold mb-2" style={{ color: "rgb(var(--text-main))" }}>
            <span className="flex items-center gap-1"><Users size={14} /> Người chơi đã tham gia</span>
            <span className="text-orange-500">{room.currentParticipants.length}/{room.maxParticipants}</span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {room.currentParticipants.length === 0 ? (
              <p className="text-xs text-center py-8 text-muted-foreground">Chưa có ai tham gia. Hãy là người đầu tiên!</p>
            ) : (
              room.currentParticipants.map((p, idx) => (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-orange-500/5 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-muted-foreground w-5 text-center">#{idx + 1}</span>
                    {p.avatar.length > 2 ? (
                      <img src={p.avatar} alt={p.name} className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-500 font-bold flex items-center justify-center text-[10px]">
                        {p.avatar}
                      </span>
                    )}
                    <span className="font-semibold" style={{ color: "rgb(var(--text-main))" }}>{p.name}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(p.joinedAt).toLocaleTimeString("vi-VN")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-orange-500 text-white font-bold text-xs hover:bg-orange-600 transition-colors cursor-pointer"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
