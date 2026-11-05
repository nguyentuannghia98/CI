"use client";

import { Swords } from "lucide-react";
import { ArenaRoom } from "../types";
import { RoomCard } from "./RoomCard";

interface RoomGridProps {
  rooms: ArenaRoom[];
  now: number;
  userVoucherCount: number;
  onJoin: (roomId: string) => void;
  onOpenDetail: (room: ArenaRoom) => void;
  onEnterRoom?: (room: ArenaRoom) => void;
  currentUserId?: string | null;
  joiningRoomId?: string | null;
}

export function RoomGrid({
  rooms,
  now,
  userVoucherCount,
  onJoin,
  onOpenDetail,
  onEnterRoom,
  currentUserId = null,
  joiningRoomId = null,
}: RoomGridProps) {
  if (rooms.length === 0) {
    return (
      <div
        className="text-center py-16 rounded-3xl border border-dashed p-8"
        style={{ borderColor: "rgba(var(--border-main), 0.2)" }}
      >
        <Swords size={48} className="mx-auto text-orange-500/40 mb-3" />
        <p className="font-bold text-base" style={{ color: "rgb(var(--text-main))" }}>
          Không có phòng Arena nào phù hợp
        </p>
        <p className="text-xs mt-1" style={{ color: "rgb(var(--text-muted))" }}>
          Thử đổi từ khóa tìm kiếm hoặc chọn bộ lọc khác xem sao nhé!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          now={now}
          userVoucherCount={userVoucherCount}
          onJoin={onJoin}
          onOpenDetail={onOpenDetail}
          onEnterRoom={onEnterRoom}
          currentUserId={currentUserId}
          joiningRoomId={joiningRoomId}
        />
      ))}
    </div>
  );
}