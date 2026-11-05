"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { Puzzle, Trophy, Timer, Loader2, LogOut, Users, AlertCircle, CheckCircle2, XCircle, Clock, Sparkles, Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/components/auth/store/AuthStore";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ArenaHeader } from "./components/ArenaHeader";
import { ArenaFilter } from "./components/ArenaFilter";
import { RoomGrid } from "./components/RoomGrid";
import { RoomDetailModal } from "./components/RoomDetailModal";
import { VictoryModal } from "./components/VictoryModal";
import { CreateArenaModal } from "./components/CreateArenaModal";
import { JigsawGame } from "./components/JigsawGame";
import Swal, { showForfeitAlert, showLeaveRoomAlert } from "@/lib/swal";
import type { ArenaRoom, Participant } from "./types";
import { MOCK_ROOMS } from "./mockData";

const ROOM_POLL_INTERVAL = 4000;

// CHẾ ĐỘ TEST: vào phòng chờ đúng X giây là tự bắt đầu game, không cần đủ người.
// Mặc định BẬT. Khi chạy thật, đặt biến môi trường NEXT_PUBLIC_ARENA_TEST=false để tắt.
const TEST_MODE = process.env.NEXT_PUBLIC_ARENA_TEST !== "false";
const TEST_WAIT_SECONDS = 10;

const CATEGORIES = ["Tất cả", "Công nghệ", "Thời trang", "Phụ kiện"];

export default function ArenaPage() {
  const supabase = createClient();
  // Nguồn sự thật duy nhất cho trạng thái đăng nhập (đã xử lý init + onAuthStateChange).
  const authUser = useUser();

  const [rooms, setRooms] = useState<ArenaRoom[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [userVoucherCount, setUserVoucherCount] = useState(0);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "WAITING" | "FULL" | "CANCELLED">("ALL");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");

  const [detailRoom, setDetailRoom] = useState<ArenaRoom | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [victoryData, setVictoryData] = useState<{ room: ArenaRoom; winner: Participant } | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);

  // TRẠNG THÁI PHÒNG CHỜ & GAME
  const [activeRoom, setActiveRoom] = useState<ArenaRoom | null>(null);
  const [isInsideRoom, setIsInsideRoom] = useState(false);
  const [gameStage, setGameStage] = useState<"WAITING" | "STARTING" | "PLAYING" | "FINISHED">("WAITING");
  const [waitStartedAt, setWaitStartedAt] = useState<number | null>(null);

  // MẢNH GHÉP THẦN TỐC GAME STATE
  const [startCountdown, setStartCountdown] = useState(3);
  const [jigsawResult, setJigsawResult] = useState<{
    timeSeconds: number;
    rank: number;
    isWinner: boolean;
    score: number;
  } | null>(null);

  // Lấy thông tin user từ AuthStore (reactive: cập nhật cả khi đăng nhập/đăng xuất
  // trong lúc đang ở trang — trước đây chỉ gọi getUser() một lần nên "0 Vé" bị kẹt).
  useEffect(() => {
    if (authUser) {
      setCurrentUser({
        id: authUser.id,
        name: authUser.user_metadata?.username || authUser.email?.split("@")[0] || "Người chơi",
      });
    } else {
      setCurrentUser(null);
      setUserVoucherCount(0);
    }
  }, [authUser]);

  // Cập nhật đếm ngược mỗi giây
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ĐỌC PHÒNG THẬT TỪ SUPABASE (arena_rooms + arena_participants + users)
  // Dùng "as any" vì các bảng arena_* chưa có trong file type đã generate
  const loadRooms = useCallback(async (): Promise<ArenaRoom[]> => {
    const db = supabase as unknown as SupabaseClient;

    const { data: roomRows, error } = await db
      .from("arena_rooms")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !roomRows || roomRows.length === 0) {
      if (error) console.error("Lỗi tải phòng Arena:", error?.message);
      setRooms(MOCK_ROOMS);
      return MOCK_ROOMS;
    }

    const roomIds: string[] = roomRows.map((r) => r.id);

    let participantRows: { room_id: string; user_id: string; joined_at?: string }[] = [];
    if (roomIds.length > 0) {
      const { data } = await db
        .from("arena_participants")
        .select("room_id, user_id, joined_at")
        .in("room_id", roomIds);
      participantRows = data ?? [];
    }

    // Gom tất cả User ID: người tham gia + người tạo phòng
    const participantUserIds: string[] = participantRows.map((p) => p.user_id as string);
    const creatorUserIds: string[] = roomRows
      .map((r: any) => r.created_by || r.user_id || r.creator_id || r.owner_id || r.seller_id)
      .filter(Boolean);

    const allUserIds = Array.from(new Set([...participantUserIds, ...creatorUserIds]));

    const usersMap: Record<string, { id: string; username: string | null; avatar_url: string | null }> = {};
    const storeNameToUserMap: Record<string, { id: string; username: string | null; avatar_url: string | null }> = {};

    if (allUserIds.length > 0) {
      try {
        const { data: userRows } = await db
          .from("users")
          .select("id, username, avatar_url")
          .in("id", allUserIds);

        (userRows ?? []).forEach((u: any) => {
          usersMap[u.id] = u;
          if (u.username) {
            storeNameToUserMap[u.username.toLowerCase()] = u;
          }
        });
      } catch (err) {
        console.error("Lỗi query users:", err);
      }
    }

    // Nếu có store_name chưa được match theo ID, thử tìm trong users theo username
    const unmatchedStoreNames = Array.from(
      new Set(
        roomRows
          .map((r: any) => r.store_name)
          .filter((name: any) => name && !storeNameToUserMap[name.toLowerCase()])
      )
    );

    if (unmatchedStoreNames.length > 0) {
      try {
        const { data: storeUsers } = await db
          .from("users")
          .select("id, username, avatar_url")
          .in("username", unmatchedStoreNames);

        (storeUsers ?? []).forEach((u: any) => {
          usersMap[u.id] = u;
          if (u.username) {
            storeNameToUserMap[u.username.toLowerCase()] = u;
          }
        });
      } catch (err) {
        console.error("Lỗi query users theo store_name:", err);
      }
    }

    const mapped: ArenaRoom[] = roomRows.map((row) => {
      const participants: Participant[] = participantRows
        .filter((p) => p.room_id === row.id)
        .map((p) => {
          const userObj = usersMap[p.user_id];
          const name = userObj?.username || "Người chơi";
          return {
            id: p.user_id,
            name,
            avatar: userObj?.avatar_url || name.charAt(0).toUpperCase(),
            joinedAt: p.joined_at ? new Date(p.joined_at).getTime() : Date.now(),
          };
        });

      // Xác định thông tin người tạo phòng
      const creatorIdFromRow = row.created_by || row.user_id || row.creator_id || row.owner_id || row.seller_id;
      const matchedUser =
        (creatorIdFromRow && usersMap[creatorIdFromRow]) ||
        (row.store_name && storeNameToUserMap[row.store_name.toLowerCase()]);

      const creatorId = matchedUser?.id || creatorIdFromRow || undefined;
      const creatorName = matchedUser?.username || row.store_name || "Chủ sàn đấu";
      const creatorAvatar =
        matchedUser?.avatar_url ||
        (creatorId
          ? `https://api.dicebear.com/7.x/bottts/svg?seed=${creatorId}`
          : `https://api.dicebear.com/7.x/bottts/svg?seed=${row.id}`);

      return {
        id: row.id,
        title: row.title,
        productImage: row.product_image ?? "",
        productValue: row.product_value,
        voucherCost: row.voucher_cost,
        maxParticipants: row.max_participants,
        currentParticipants: participants,
        status: row.status,
        expiresAt: new Date(row.expires_at).getTime(),
        winner: row.winner_id ? participants.find((p) => p.id === row.winner_id) : undefined,
        storeName: row.store_name,
        creator: {
          id: creatorId,
          name: creatorName,
          avatar: creatorAvatar,
          verified: true,
        },
      } as ArenaRoom;
    });

    setRooms((prev) => {
      const newRoomIds = new Set(mapped.map((r) => r.id));
      const recentLocal = prev.filter((r) => !newRoomIds.has(r.id) && r.expiresAt > Date.now());
      return [...recentLocal, ...mapped];
    });
    return mapped;
  }, [supabase]);

  // Đếm số voucher chưa dùng của user
  const loadVoucherCount = useCallback(
    async (userId: string) => {
      const { count } = await (supabase as unknown as SupabaseClient)
        .from("user_vouchers")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_used", false);
      setUserVoucherCount(count ?? 0);
    },
    [supabase]
  );

  // Tải phòng lần đầu + tự làm mới định kỳ (polling)
  useEffect(() => {
    loadRooms();
    const poll = setInterval(loadRooms, ROOM_POLL_INTERVAL);
    return () => clearInterval(poll);
  }, [loadRooms]);

  // Tải voucher khi biết user
  useEffect(() => {
    if (currentUser) loadVoucherCount(currentUser.id);
  }, [currentUser, loadVoucherCount]);

  // Xử lý khi hoàn thành game Mảnh Ghép Thần Tốc
  const handleJigsawFinish = useCallback(
    (result: { timeSeconds: number; rank: number; isWinner: boolean; score: number }) => {
      setJigsawResult(result);
      setGameStage("FINISHED");
      if (result.isWinner && activeRoom && currentUser) {
        setVictoryData({
          room: activeRoom,
          winner: {
            id: currentUser.id,
            name: currentUser.name,
            avatar: currentUser.name.charAt(0).toUpperCase(),
            joinedAt: Date.now(),
          },
        });
      }
    },
    [activeRoom, currentUser]
  );

  // VÀO LẠI PHÒNG ĐÃ THAM GIA (không trừ voucher) -> mở phòng chờ / game
  const handleEnterRoom = useCallback((room: ArenaRoom) => {
    setActiveRoom(room);
    setIsInsideRoom(true);
    setGameStage("WAITING");
  }, []);

  // BẤM DÙNG VOUCHER -> GỌI RPC join_arena_room (trừ voucher + thêm vào phòng, atomic) -> ĐẨY VÀO PHÒNG CHỜ
  const handleJoin = useCallback(
    async (roomId: string) => {
      if (!currentUser) {
        Swal.fire({
          title: "Yêu Cầu Đăng Nhập",
          text: "Bạn cần đăng nhập tài khoản NexLoot để tham gia đấu trường Arena.",
          icon: "warning",
          iconColor: "#f59e0b",
          confirmButtonText: "Đã Hiểu",
          confirmButtonColor: "#f97316",
          background: "#0f172a",
          color: "#f8fafc",
          customClass: {
            popup: "rounded-3xl border border-slate-700 shadow-2xl",
            confirmButton: "px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider",
          },
        });
        return;
      }
      if (userVoucherCount <= 0) {
        Swal.fire({
          title: "Kho Thẻ Của Bạn Đã Hết!",
          html: `
            <p class="text-sm text-slate-300">Mỗi trận đấu sàn đấu cần <strong>1 Thẻ tham gia</strong>.</p>
            <p class="text-xs text-amber-400 mt-2 font-medium">Bạn có thể mua sắm sản phẩm tại Giao Thương để được tích lũy thêm Thẻ hoàn toàn miễn phí!</p>
          `,
          icon: "info",
          iconColor: "#f97316",
          confirmButtonText: "Đã Hiểu",
          confirmButtonColor: "#f97316",
          background: "#0f172a",
          color: "#f8fafc",
          customClass: {
            popup: "rounded-3xl border border-slate-700 shadow-2xl",
            confirmButton: "px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider",
          },
        });
        return;
      }
      if (joiningRoomId) return;

      setJoiningRoomId(roomId);
      try {
        const { data, error } = await (supabase as unknown as SupabaseClient).rpc("join_arena_room", { p_room_id: roomId });

        if (error) {
          Swal.fire({
            title: "Không Thể Tham Gia",
            text: error.message,
            icon: "error",
            confirmButtonText: "Đóng",
            confirmButtonColor: "#e11d48",
            background: "#0f172a",
            color: "#f8fafc",
            customClass: {
              popup: "rounded-3xl border border-rose-500/40 shadow-2xl",
              confirmButton: "px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider",
            },
          });
          return;
        }

        if (!data?.success) {
          Swal.fire({
            title: "Thông Báo Phòng",
            text: data?.error || "Phòng có thể đã đầy hoặc đã hết hạn.",
            icon: "warning",
            confirmButtonText: "Đóng",
            confirmButtonColor: "#f97316",
            background: "#0f172a",
            color: "#f8fafc",
            customClass: {
              popup: "rounded-3xl border border-slate-700 shadow-2xl",
              confirmButton: "px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider",
            },
          });
          await loadRooms();
          return;
        }

        const [list] = await Promise.all([loadRooms(), loadVoucherCount(currentUser.id)]);
        const target = list.find((r) => r.id === roomId);

        if (target) {
          setActiveRoom(target);
          setIsInsideRoom(true); // MỞ MODAL PHÒNG CHỜ NGAY LẬP TỨC
          setGameStage("WAITING");
        }
      } finally {
        setJoiningRoomId(null);
      }
    },
    [currentUser, userVoucherCount, joiningRoomId, supabase, loadRooms, loadVoucherCount]
  );

  // Xử lý khi tạo phòng sàn đấu thành công
  const handleCreateSuccess = useCallback((newRoom: ArenaRoom) => {
    setIsCreateModalOpen(false);
    setRooms((prev) => [newRoom, ...prev.filter((r) => r.id !== newRoom.id)]);
    setActiveRoom(newRoom);
    setIsInsideRoom(true);
    setGameStage("WAITING");
  }, []);

  // Ghi lại thời điểm bắt đầu chờ trong phòng (dùng cho chế độ test), reset khi rời phòng
  useEffect(() => {
    if (isInsideRoom && gameStage === "WAITING") {
      setWaitStartedAt((prev) => prev ?? Date.now());
    } else if (!isInsideRoom) {
      setWaitStartedAt(null);
    }
  }, [isInsideRoom, gameStage]);

  // CHẾ ĐỘ TEST: chờ đủ TEST_WAIT_SECONDS giây là tự vào game, không cần đủ người
  useEffect(() => {
    if (!TEST_MODE || !isInsideRoom || gameStage !== "WAITING" || waitStartedAt === null) return;

    if (now - waitStartedAt >= TEST_WAIT_SECONDS * 1000) {
      setGameStage("STARTING");
    }
  }, [now, isInsideRoom, gameStage, waitStartedAt]);

  // Cập nhật real-time phòng chờ & Tự động kích hoạt khi đủ người
  useEffect(() => {
    if (activeRoom) {
      const currentInList = rooms.find((r) => r.id === activeRoom.id);
      if (currentInList) {
        setActiveRoom(currentInList);

        if (currentInList.currentParticipants.length >= currentInList.maxParticipants && gameStage === "WAITING") {
          setGameStage("STARTING");
        }
      }
    }
  }, [rooms, activeRoom, gameStage]);

  // Tự động out phòng khi hết giờ đếm ngược phòng chờ mà không đủ người (tắt trong chế độ test)
  useEffect(() => {
    if (TEST_MODE) return;
    if (isInsideRoom && activeRoom && gameStage === "WAITING") {
      const remainingMs = activeRoom.expiresAt - now;

      if (remainingMs <= 0 && activeRoom.currentParticipants.length < activeRoom.maxParticipants) {
        setIsInsideRoom(false);
        setActiveRoom(null);
        Swal.fire({
          title: "Phòng Chưa Đủ Người",
          text: "Phòng đã hết thời gian chờ và chưa đủ số lượng người chơi theo quy định. 100% Thẻ tham gia của bạn đã được hệ thống tự động hoàn lại vào kho thẻ!",
          icon: "info",
          confirmButtonText: "Xác Nhận",
          confirmButtonColor: "#f97316",
          background: "#0f172a",
          color: "#f8fafc",
          customClass: {
            popup: "rounded-3xl border border-slate-700 shadow-2xl",
            confirmButton: "px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider",
          },
        });
      }
    }
  }, [now, isInsideRoom, activeRoom, gameStage]);

  // Đếm ngược 3 giây chuyển từ STARTING -> PLAYING cho game Mảnh Ghép Thần Tốc
  useEffect(() => {
    if (gameStage === "STARTING") {
      setStartCountdown(3);
      const interval = setInterval(() => {
        setStartCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setGameStage("PLAYING");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameStage]);

  const filteredRooms = useMemo(() => {
    // Phòng còn WAITING nhưng đã quá hạn thì hiển thị là đã hủy (DB chưa có cron cập nhật)
    let list: ArenaRoom[] = rooms.map((r) =>
      r.status === "WAITING" && r.expiresAt - now <= 0 ? { ...r, status: "CANCELLED" as const } : r
    );
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((r) => r.title.toLowerCase().includes(q) || r.storeName.toLowerCase().includes(q));
    }
    if (statusFilter !== "ALL") {
      list = list.filter((r) => r.status === statusFilter);
    }
    return list;
  }, [rooms, searchQuery, statusFilter, now]);

  // Số giây còn lại trước khi tự vào game (chế độ test)
  const testCountdown =
    waitStartedAt === null
      ? TEST_WAIT_SECONDS
      : Math.max(0, TEST_WAIT_SECONDS - Math.floor((now - waitStartedAt) / 1000));

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <ArenaHeader voucherCount={userVoucherCount} onOpenCreateModal={() => setIsCreateModalOpen(true)} />

      <ArenaFilter
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={CATEGORIES}
      />

      <RoomGrid
        rooms={filteredRooms}
        now={now}
        userVoucherCount={userVoucherCount}
        onJoin={handleJoin}
        onOpenDetail={setDetailRoom}
        onEnterRoom={handleEnterRoom}
        currentUserId={currentUser?.id ?? null}
        joiningRoomId={joiningRoomId}
      />

      {/* --- MODAL PHÒNG CHỜ (WAITING ROOM) & GAME MẢNH GHÉP THẦN TỐC --- */}
      {isInsideRoom && activeRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900/95 border border-slate-700/80 w-full max-w-4xl max-h-[94vh] overflow-y-auto rounded-3xl p-5 sm:p-6 shadow-2xl relative text-white space-y-5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            
            {/* Header Màn hình Phòng Chờ & Thi đấu (Không còn nút X đóng tự ý, tuân thủ luồng trận đấu) */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  <Puzzle size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-orange-400">
                      Sàn Đấu Mảnh Ghép
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Jigsaw Battle
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white truncate max-w-sm sm:max-w-md">{activeRoom.title}</h3>
                  <p className="text-xs text-slate-400">Cửa hàng: {activeRoom.storeName} • Trị giá: {activeRoom.productValue.toLocaleString("vi-VN")}đ</p>
                </div>
              </div>

              {activeRoom.creator && (
                <div className="hidden sm:flex items-center gap-2.5 bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-slate-700">
                  {activeRoom.creator.id ? (
                    <Link
                      href={`/profile/${activeRoom.creator.id}`}
                      className="group/creator flex items-center gap-2 hover:opacity-80 transition-opacity"
                      title={`Xem trang cá nhân của ${activeRoom.creator.name}`}
                    >
                      <img
                        src={activeRoom.creator.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(activeRoom.creator?.name || "arena")}`}
                        alt={activeRoom.creator.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(activeRoom.creator?.name || "arena")}`;
                        }}
                        className="w-7 h-7 rounded-full object-cover border border-orange-500/40 group-hover/creator:border-orange-500 transition-colors"
                      />
                      <div className="text-left text-xs">
                        <span className="text-[10px] block text-slate-400 leading-none">Chủ phòng</span>
                        <span className="font-bold text-orange-400 group-hover/creator:underline truncate max-w-[120px] block">
                          {activeRoom.creator.name}
                        </span>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-center gap-2">
                      <img
                        src={activeRoom.creator.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(activeRoom.creator?.name || "arena")}`}
                        alt={activeRoom.creator.name}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(activeRoom.creator?.name || "arena")}`;
                        }}
                        className="w-7 h-7 rounded-full object-cover border border-orange-500/40"
                      />
                      <div className="text-left text-xs">
                        <span className="text-[10px] block text-slate-400 leading-none">Chủ phòng</span>
                        <span className="font-bold text-slate-200 truncate max-w-[120px] block">
                          {activeRoom.creator.name}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* BƯỚC 1: TRẠNG THÁI PHÒNG CHỜ ĐỦ NGƯỜI */}
            {gameStage === "WAITING" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/50 flex items-center gap-3">
                    <Clock className="w-8 h-8 text-amber-400 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">
                        {TEST_MODE ? "Tự bắt đầu sau" : "Hết hạn phòng sau"}
                      </p>
                      <p className="text-lg font-bold text-amber-400">
                        {TEST_MODE
                          ? `${testCountdown} giây`
                          : `${Math.max(0, Math.ceil((activeRoom.expiresAt - now) / 1000))} giây`}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/50 flex items-center gap-3">
                    <Users className="w-8 h-8 text-orange-400 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">Số lượng tham gia</p>
                      <p className="text-lg font-bold text-orange-400">
                        {activeRoom.currentParticipants.length} / {activeRoom.maxParticipants} người
                      </p>
                    </div>
                  </div>
                </div>

                {/* Danh sách người chơi trong phòng chờ */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Users size={16} /> Danh sách người chơi trong phòng:
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {activeRoom.currentParticipants.map((p) => {
                      const hasAvatarUrl = Boolean(p.avatar && p.avatar.trim() !== "" && (p.avatar.startsWith("http") || p.avatar.startsWith("/")));
                      return (
                        <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden">
                          <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-orange-500/40 bg-orange-500 flex items-center justify-center">
                            {hasAvatarUrl && p.avatar ? (
                              <img
                                src={p.avatar}
                                alt={p.name}
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(p.name)}`;
                                }}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="font-bold text-sm text-white">
                                {p.name?.charAt(0).toUpperCase() || "U"}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-medium truncate" title={p.name}>{p.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-3 text-xs text-amber-300">
                  <Sparkles className="w-5 h-5 shrink-0 text-amber-400" />
                  <span>
                    <strong>Thể lệ "Mảnh ghép thần tốc":</strong> Hệ thống lấy chính hình ảnh món hàng giải thưởng của Shop cắt ra thành các mảnh xáo trộn. 15 người chơi cùng đua nhau kéo ghép ảnh hoàn chỉnh. Ai xong nhanh nhất sẽ giành chiến thắng nhận sản phẩm 0đ!
                  </span>
                </div>

                {/* Nút Rời phòng chờ (dành cho người chơi muốn hủy chờ trước khi trận đấu bắt đầu) */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-[11px] text-slate-400">
                    Trận đấu sẽ bắt đầu khi đủ 15 người chơi.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      showLeaveRoomAlert(activeRoom.title).then((result) => {
                        if (result.isConfirmed) {
                          setIsInsideRoom(false);
                          setActiveRoom(null);
                        }
                      });
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-600/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95"
                    title="Rời khỏi phòng chờ"
                  >
                    <LogOut size={14} />
                    <span>Rời Phòng Chờ</span>
                  </button>
                </div>
              </div>
            )}

            {/* BƯỚC 2: CHUẨN BỊ BẮT ĐẦU -> ĐẾM NGƯỢC 3... 2... 1 */}
            {gameStage === "STARTING" && (
              <div className="py-10 text-center space-y-5">
                <div className="relative mx-auto w-28 h-28 rounded-3xl overflow-hidden border-4 border-orange-500 shadow-2xl shadow-orange-500/30">
                  <img
                    src={activeRoom.productImage || "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80"}
                    alt={activeRoom.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center font-black text-5xl text-amber-400 font-mono animate-bounce">
                    {startCountdown > 0 ? startCountdown : "GO!"}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30 inline-flex items-center gap-1.5">
                    <Flame size={14} className="text-orange-500" /> Sẵn sàng thi đấu!
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">
                    Mảnh Ghép Thần Tốc Đang Bắt Đầu!
                  </h3>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto">
                    Hệ thống đang xáo trộn hình ảnh sản phẩm <strong>{activeRoom.title}</strong>. 15 người chơi đua nhau kéo ghép hoàn chỉnh bức tranh!
                  </p>
                </div>
              </div>
            )}

            {/* BƯỚC 3: MÀN HÌNH CHƠI GAME MẢNH GHÉP THẦN TỐC */}
            {gameStage === "PLAYING" && (
              <JigsawGame
                room={activeRoom}
                currentUser={currentUser}
                onFinish={handleJigsawFinish}
                onQuit={() => {
                  setIsInsideRoom(false);
                  setActiveRoom(null);
                  setGameStage("WAITING");
                  Swal.fire({
                    title: "Đã Bỏ Cuộc",
                    text: "Bạn đã rời khỏi trận đấu. Thẻ tham gia không được hoàn lại theo quy định.",
                    icon: "info",
                    iconColor: "#f43f5e",
                    timer: 2500,
                    showConfirmButton: false,
                    background: "#0f172a",
                    color: "#f8fafc",
                    customClass: {
                      container: "!z-[999999]",
                      popup: "rounded-3xl border border-rose-500/30 shadow-2xl",
                      title: "text-white font-bold text-lg",
                    },
                  });
                }}
              />
            )}

            {/* BƯỚC 4: KẾT THÚC TRẬN ĐẤU */}
            {gameStage === "FINISHED" && (
              <div className="py-8 text-center space-y-4">
                <Trophy size={56} className="mx-auto text-amber-400 animate-bounce" />
                <h2 className="text-2xl font-black text-white">
                  {jigsawResult?.isWinner ? "🏆 BẠN LÀ QUÁN QUÂN THẦN TỐC!" : "Hoàn Thành Trận Đấu!"}
                </h2>
                <p className="text-slate-300 text-sm max-w-md mx-auto">
                  {jigsawResult?.isWinner
                    ? `Bạn đã xuất sắc về đích đầu tiên trong ${jigsawResult?.timeSeconds}s và đoạt giải thưởng của Shop ${activeRoom.storeName}!`
                    : `Bạn đã hoàn thành ở vị trí #${jigsawResult?.rank || 2} trong ${jigsawResult?.timeSeconds || 30}s.`}
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const finishedRoom = activeRoom;
                      const isWinner = jigsawResult?.isWinner;
                      setIsInsideRoom(false);
                      setActiveRoom(null);
                      setGameStage("WAITING");
                      // Nếu thắng hoặc phòng có người thắng -> hiện modal vinh danh
                      if (isWinner && finishedRoom && currentUser) {
                        setVictoryData({
                          room: finishedRoom,
                          winner: {
                            id: currentUser.id,
                            name: currentUser.name,
                            avatar: currentUser.name.charAt(0).toUpperCase(),
                            joinedAt: Date.now(),
                          },
                        });
                      } else if (finishedRoom?.winner) {
                        setVictoryData({ room: finishedRoom, winner: finishedRoom.winner });
                      }
                    }}
                    className="px-8 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 font-bold text-white transition-all cursor-pointer shadow-lg shadow-orange-500/25"
                  >
                    XÁC NHẬN RỜI PHÒNG
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      <CreateArenaModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <RoomDetailModal room={detailRoom} onClose={() => setDetailRoom(null)} />

      <VictoryModal
        room={victoryData?.room ?? null}
        winner={victoryData?.winner ?? null}
        onClose={() => setVictoryData(null)}
      />
    </div>
  );
}