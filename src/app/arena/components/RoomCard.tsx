"use client";

import Link from "next/link";
import { Users, Clock, Ticket, Trophy, Sparkles } from "lucide-react";
import { ArenaRoom } from "../types";

interface RoomCardProps {
  room: ArenaRoom;
  now: number;
  userVoucherCount: number;
  onJoin: (roomId: string) => void;
  onOpenDetail: (room: ArenaRoom) => void;
  onEnterRoom?: (room: ArenaRoom) => void;
  currentUserId?: string | null;
  joiningRoomId?: string | null;
}

export function RoomCard({
  room,
  now,
  userVoucherCount,
  onJoin,
  onOpenDetail,
  onEnterRoom,
  currentUserId = null,
  joiningRoomId = null,
}: RoomCardProps) {
  const currentCount = room.currentParticipants.length;
  const progressPercent = Math.min(100, Math.round((currentCount / room.maxParticipants) * 100));
  const remainingTime = room.expiresAt - now;
  const isExpired = remainingTime <= 0;
  const isFull = currentCount >= room.maxParticipants;
  const isJoined = !!currentUserId && room.currentParticipants.some((p) => p.id === currentUserId);
  const isJoining = joiningRoomId === room.id;
  const isCompleted = room.status === "COMPLETED";
  const isCancelled = room.status === "CANCELLED";

  const creatorId = room.creator?.id;
  const creatorName = room.creator?.name || room.storeName || "Chủ sàn đấu";
  const creatorAvatar =
    room.creator?.avatar ||
    (creatorId
      ? `https://api.dicebear.com/7.x/bottts/svg?seed=${creatorId}`
      : `https://api.dicebear.com/7.x/bottts/svg?seed=${room.id}`);

  // Format đếm ngược
  const formatTime = (ms: number) => {
    if (ms <= 0) return "Hết giờ";
    const m = Math.floor(ms / (1000 * 60));
    const s = Math.floor((ms % (1000 * 60)) / 1000);
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  // Nút chính: đã ở trong phòng thì cho vào lại phòng, chưa thì cho tham gia
  const canJoin = !isJoining && !isCompleted && !isCancelled && !isExpired && !isFull && userVoucherCount > 0;
  const mainButtonDisabled = isJoined ? false : !canJoin;

  const handleMainClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isJoined) {
      (onEnterRoom ?? onOpenDetail)(room);
      return;
    }
    onJoin(room.id);
  };

  return (
    <div
      className="rounded-3xl border p-5 flex flex-col justify-between gap-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden group"
      style={{
        backgroundColor: "rgb(var(--bg-card))",
        borderColor: isFull ? "rgba(234, 179, 8, 0.4)" : "rgba(var(--border-main), 0.18)",
      }}
    >
      {/* Banner & Trạng thái phòng */}
      <div className="space-y-3">
        <div className="relative aspect-[16/9] rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 flex items-center justify-center overflow-hidden border border-orange-500/10">
          {room.productImage ? (
            <img
              src={room.productImage}
              alt={room.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <Trophy size={48} className="text-orange-500/60 group-hover:scale-110 transition-transform duration-300" />
          )}

          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-black/60 text-white backdrop-blur-md border border-white/10">
            Shop: {room.storeName}
          </span>
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-orange-500 text-white shadow-sm">
            Trị giá: {room.productValue.toLocaleString("vi-VN")}đ
          </span>
        </div>

        {/* Thông tin người tạo phòng / Chủ sàn đấu */}
        <div
          className="flex items-center justify-between gap-2 pt-1 border-t"
          style={{ borderColor: "rgba(var(--border-main), 0.12)" }}
        >
          {creatorId ? (
            <Link
              href={`/profile/${creatorId}`}
              onClick={(e) => e.stopPropagation()}
              className="group/creator inline-flex items-center gap-2.5 min-w-0 hover:opacity-85 transition-opacity cursor-pointer"
              title={`Xem trang cá nhân của ${creatorName}`}
            >
              <div className="relative shrink-0">
                <img
                  src={creatorAvatar}
                  alt={creatorName}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(creatorName)}`;
                  }}
                  className="w-7 h-7 rounded-full object-cover border border-orange-500/30 group-hover/creator:border-orange-500 transition-colors shadow-xs"
                />
                {room.creator?.verified && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white dark:border-zinc-900" />
                )}
              </div>
              <div className="min-w-0">
                <span
                  className="text-[10px] font-medium block uppercase tracking-wider leading-none"
                  style={{ color: "rgb(var(--text-muted))" }}
                >
                  Chủ phòng
                </span>
                <span
                  className="text-xs font-semibold truncate block group-hover/creator:text-orange-500 group-hover/creator:underline transition-colors mt-0.5"
                  style={{ color: "rgb(var(--text-main))" }}
                >
                  {creatorName}
                </span>
              </div>
            </Link>
          ) : (
            <div className="inline-flex items-center gap-2.5 min-w-0">
              <img
                src={creatorAvatar}
                alt={creatorName}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(creatorName)}`;
                }}
                className="w-7 h-7 rounded-full object-cover border border-orange-500/20 shrink-0"
              />
              <div className="min-w-0">
                <span
                  className="text-[10px] font-medium block uppercase tracking-wider leading-none"
                  style={{ color: "rgb(var(--text-muted))" }}
                >
                  Chủ phòng
                </span>
                <span className="text-xs font-semibold truncate block" style={{ color: "rgb(var(--text-main))" }}>
                  {creatorName}
                </span>
              </div>
            </div>
          )}

          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-orange-500/10 text-orange-500 border border-orange-500/20 shrink-0">
            <Sparkles className="w-2.5 h-2.5" /> Host
          </span>
        </div>

        <div>
          <h3 className="font-bold text-base line-clamp-1" style={{ color: "rgb(var(--text-main))" }}>
            {room.title}
          </h3>
          <p className="text-xs text-orange-500 font-semibold mt-0.5">
            Phí tham gia: 1 Thẻ (~{room.voucherCost.toLocaleString("vi-VN")}đ)
          </p>
        </div>
      </div>

      {/* Tiến trình đủ người & Đếm ngược */}
      <div className="space-y-2 bg-orange-500/5 p-3 rounded-2xl border border-orange-500/10">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="flex items-center gap-1" style={{ color: "rgb(var(--text-main))" }}>
            <Users size={14} className="text-orange-500" /> Tiến độ phòng:
          </span>
          <span className="text-orange-500 font-bold">
            {currentCount}/{room.maxParticipants} người
          </span>
        </div>

        {/* Thanh Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-orange-500/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] pt-1" style={{ color: "rgb(var(--text-muted))" }}>
          <span className="flex items-center gap-1">
            <Clock size={12} /> Còn lại:
          </span>
          <span className="font-mono font-bold text-red-500">{formatTime(remainingTime)}</span>
        </div>
      </div>

      {/* Nút thao tác */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(room);
          }}
          className="px-3 py-2.5 rounded-xl border border-border/30 text-xs font-bold hover:bg-orange-500/10 transition-all cursor-pointer"
        >
          Chi tiết
        </button>

        <button
          type="button"
          onClick={handleMainClick}
          disabled={mainButtonDisabled}
          className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white font-bold text-xs hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {isJoining ? (
            "Đang vào phòng..."
          ) : isJoined ? (
            <>
              <Users size={15} /> Vào phòng chơi
            </>
          ) : isCompleted ? (
            "Đã có người thắng"
          ) : isCancelled || isExpired ? (
            "Phòng đã hủy"
          ) : isFull ? (
            "Phòng đã đầy"
          ) : userVoucherCount <= 0 ? (
            "Hết Thẻ"
          ) : (
            <>
              <Ticket size={15} /> Dùng 1 Thẻ Chơi
            </>
          )}
        </button>
      </div>
    </div>
  );
}
