"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Gavel, Clock, TrendingUp, Info, Loader2, Plus, Radio, Sparkles, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useUser } from "@/components/auth/store/AuthStore";
import CreateAuctionModal from "./components/CreateAuctionModal";

export interface AuctionSeller {
  id?: string;
  name: string;
  avatar?: string | null;
  verified?: boolean;
}

export interface AuctionItem {
  id: string;
  title: string;
  description: string;
  currentBid: number;
  bidCount: number;
  endsAt: number; // timestamp (ms)
  imageUrl?: string;
  seller?: AuctionSeller;
}

const formatMoney = (n: number) => n.toLocaleString("vi-VN") + "đ";

const formatRemaining = (ms: number) => {
  if (ms <= 0) return "Đã kết thúc";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const createInitialItems = (): AuctionItem[] => {
  const now = Date.now();
  return [
    {
      id: "1",
      title: "Bàn phím cơ Custom Keychron Q1 Pro Wireless",
      description: "Switch tactile, keycap PBT, full nhôm CNC nguyên khối, còn bảo hành 6 tháng.",
      currentBid: 1200000,
      bidCount: 4,
      endsAt: now + 1000 * 60 * 60 * 2,
      seller: {
        id: "demo-user-1",
        name: "Keychron Official",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=keychron",
        verified: true,
      },
    },
    {
      id: "2",
      title: "Card đồ họa ASUS ROG Strix RTX 3080 10GB",
      description: "Bản 3 quạt tản nhiệt, hoạt động tốt, đã vệ sinh và thay keo tản nhiệt xịn.",
      currentBid: 3500000,
      bidCount: 9,
      endsAt: now + 1000 * 60 * 45,
      seller: {
        id: "demo-user-2",
        name: "ROG Gaming Store",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=rogstrix",
        verified: true,
      },
    },
    {
      id: "3",
      title: "Màn hình Gaming LG UltraGear 27 inch 165Hz IPS",
      description: "Tấm nền Nano IPS 1ms, không điểm chết, đầy đủ phụ kiện và hộp chính hãng.",
      currentBid: 2800000,
      bidCount: 6,
      endsAt: now + 1000 * 60 * 60 * 5,
      seller: {
        id: "demo-user-3",
        name: "TechGear Pro",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=techgear",
        verified: true,
      },
    },
  ];
};

type Mode = "loading" | "live" | "demo";

interface DBAuction {
  id: string;
  title: string;
  description: string | null;
  image_url?: string | null;
  current_bid: number | null;
  bid_count: number | null;
  ends_at: string;
  created_by?: string | null;
  seller?: {
    id: string;
    username: string | null;
    avatar_url: string | null;
    full_name?: string | null;
  } | {
    id: string;
    username: string | null;
    avatar_url: string | null;
    full_name?: string | null;
  }[] | null;
}

export default function Auction() {
  const router = useRouter();
  const supabase = createClient();
  const currentUser = useUser();

  const [items, setItems] = useState<AuctionItem[]>(createInitialItems);
  const [mode, setMode] = useState<Mode>("loading");
  const [now, setNow] = useState(() => Date.now());
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Tải phiên đấu giá thật; nếu không có DB hoặc dữ liệu rỗng thì dùng dữ liệu mẫu.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // 1. Thử query join users từ Supabase thông qua created_by
        let rawData: any[] | null = null;
        let fetchError: any = null;

        const { data: joinData, error: joinErr } = await (supabase as unknown as SupabaseClient)
          .from("auctions")
          .select(`
            id,
            title,
            description,
            image_url,
            current_bid,
            bid_count,
            ends_at,
            created_by,
            seller:users!created_by (
              id,
              username,
              avatar_url
            )
          `)
          .order("created_at", { ascending: false });

        if (!joinErr && joinData) {
          rawData = joinData;
        } else {
          // 2. Fallback: Nếu quan hệ FK không có alias hoặc tên khác, query auctions và lấy users riêng
          const { data: simpleData, error: simpleErr } = await (supabase as unknown as SupabaseClient)
            .from("auctions")
            .select("id, title, description, image_url, current_bid, bid_count, ends_at, created_by")
            .order("created_at", { ascending: false });

          if (simpleErr || !simpleData) {
            fetchError = simpleErr || joinErr;
          } else {
            const creatorIds = Array.from(
              new Set(simpleData.map((r: any) => r.created_by).filter(Boolean))
            );

            const userMap: Record<string, { id: string; username: string | null; avatar_url: string | null }> = {};
            if (creatorIds.length > 0) {
              try {
                const { data: usersData } = await (supabase as unknown as SupabaseClient)
                  .from("users")
                  .select("id, username, avatar_url")
                  .in("id", creatorIds);

                if (usersData) {
                  usersData.forEach((u: any) => {
                    userMap[u.id] = u;
                  });
                }
              } catch (e) {
                console.error("Lỗi lấy thông tin users cho auctions:", e);
              }
            }

            rawData = simpleData.map((r: any) => ({
              ...r,
              seller: r.created_by ? userMap[r.created_by] : null,
            }));
          }
        }

        if (cancelled) return;

        if (fetchError || !rawData || rawData.length === 0) {
          // Lỗi DB hoặc chưa có bài post đấu giá nào -> Hiện bản Demo
          setMode("demo");
          setItems(createInitialItems());
          return;
        }

        setItems(
          rawData.map((r: any) => {
            const sellerObj = Array.isArray(r.seller) ? r.seller[0] : r.seller;
            const sellerId = sellerObj?.id || r.created_by || undefined;
            const sellerName = sellerObj?.username || sellerObj?.full_name || (sellerId ? `Thành viên #${String(sellerId).slice(0, 5)}` : "Người tạo phòng");
            const sellerAvatar = sellerObj?.avatar_url || (sellerId ? `https://api.dicebear.com/7.x/bottts/svg?seed=${sellerId}` : `https://api.dicebear.com/7.x/bottts/svg?seed=${r.id}`);

            return {
              id: r.id,
              title: r.title,
              description: r.description || "",
              imageUrl: r.image_url || undefined,
              currentBid: r.current_bid ?? 0,
              bidCount: r.bid_count ?? 0,
              endsAt: new Date(r.ends_at).getTime(),
              seller: {
                id: sellerId,
                name: sellerName,
                avatar: sellerAvatar,
                verified: true,
              },
            };
          })
        );
        setMode("live");
      } catch {
        if (!cancelled) {
          setMode("demo");
          setItems(createInitialItems());
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // Realtime
  useEffect(() => {
    if (mode !== "live") return;
    const channel = supabase
      .channel("auctions-live")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "auctions" },
        (payload) => {
          const row = payload.new as DBAuction;
          setItems((prev) =>
            prev.map((i) =>
              i.id === row.id
                ? { ...i, currentBid: row.current_bid ?? i.currentBid, bidCount: row.bid_count ?? i.bidCount }
                : i
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mode, supabase]);

  // Cập nhật đồng hồ đếm ngược
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleBid = useCallback(
    async (item: AuctionItem) => {
      const value = Number((inputs[item.id] || "").replace(/\D/g, ""));
      const minBid = item.currentBid + 10000;

      if (item.endsAt - Date.now() <= 0) {
        setErrors((prev) => ({ ...prev, [item.id]: "Phiên đấu giá đã kết thúc" }));
        return;
      }
      if (!value || value < minBid) {
        setErrors((prev) => ({ ...prev, [item.id]: `Giá tối thiểu là ${formatMoney(minBid)}` }));
        return;
      }

      if (mode !== "live") {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, currentBid: value, bidCount: i.bidCount + 1 } : i))
        );
        setInputs((prev) => ({ ...prev, [item.id]: "" }));
        setErrors((prev) => ({ ...prev, [item.id]: "" }));
        return;
      }

      // Kiểm tra xem người dùng có phải là chủ phòng không
      if (currentUser?.id && (item.seller?.id === currentUser.id || (item as any).created_by === currentUser.id)) {
        setErrors((prev) => ({ ...prev, [item.id]: "Bạn là chủ phòng, không thể tự đặt giá món đồ của chính mình!" }));
        return;
      }

      if (!currentUser) {
        setErrors((prev) => ({ ...prev, [item.id]: "Bạn cần đăng nhập để đặt giá" }));
        return;
      }

      const { data, error } = await (supabase as unknown as SupabaseClient).rpc("place_bid", {
        p_auction_id: item.id,
        p_amount: value,
      });

      if (error) {
        const msg = error.message || "";
        const friendly = msg.includes("BID_TOO_LOW")
          ? `Giá tối thiểu là ${formatMoney(minBid)}`
          : msg.includes("AUCTION_ENDED")
            ? "Phiên đấu giá đã kết thúc"
            : msg.includes("CANNOT_BID_OWN_AUCTION")
              ? "Bạn là chủ phòng, không thể tự đặt giá món đồ của chính mình!"
            : msg.includes("UNAUTHENTICATED")
              ? "Bạn cần đăng nhập để đặt giá"
              : "Không đặt được giá, vui lòng thử lại";
        setErrors((prev) => ({ ...prev, [item.id]: friendly }));
        return;
      }

      const updated = data as DBAuction;
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, currentBid: updated?.current_bid ?? value, bidCount: updated?.bid_count ?? i.bidCount + 1 }
            : i
        )
      );
      setInputs((prev) => ({ ...prev, [item.id]: "" }));
      setErrors((prev) => ({ ...prev, [item.id]: "" }));
    },
    [inputs, mode, currentUser, supabase]
  );

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header trang danh sách có Nút Tạo Phòng Đấu Giá Nổi Bật */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
            <Gavel size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight" style={{ color: "rgb(var(--text-main))" }}>
              Đấu Giá Trực Tuyến
            </h1>
            <p className="text-sm" style={{ color: "rgb(var(--text-muted))" }}>
              Săn vật phẩm độc quyền hoặc mở phòng đấu giá của chính bạn
            </p>
          </div>
        </div>

        {/* Nút Tạo Phòng Đấu Giá Nổi Bật */}
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Plus size={18} />
          <span>Tạo Phòng Đấu Giá</span>
        </button>
      </div>

      {/* BANNER NỔI BẬT: NHÀ HÁT ĐẤU GIÁ HOÀNG GIA // MYSTERY DROP 3D */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-purple-900/20 p-5 sm:p-7 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 group">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            CHẾ ĐỘ MỚI: NHÀ HÁT ĐẤU GIÁ 3D
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            Hội Trường Đấu Giá Hoàng Gia // Mystery Drop
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Hóa thân thành Avatar 3D ngồi trong khán phòng nhà hát sang trọng! NPC Quản gia bưng khay nhung đỏ unbox vật phẩm bí ẩn do Sàn tài trợ. Dơ cao bảng trả giá bằng Xu và thả biểu tượng cảm xúc cùng khán giả thời gian thực!
          </p>
        </div>

        <Link
          href="/auction/mystery-3d"
          className="relative z-10 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-black font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-orange-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4 fill-black" />
          <span>VÀO HỘI TRƯỜNG 3D NGAY</span>
        </Link>
      </div>

      {/* Thông báo chế độ Demo */}
      {mode === "demo" && (
        <div
          className="mb-6 flex items-start gap-2 rounded-2xl border p-3.5 text-xs"
          style={{ borderColor: "rgba(var(--border-main), 0.3)", color: "rgb(var(--text-muted))" }}
        >
          <Info size={16} className="mt-0.5 shrink-0 text-orange-400" />
          <span>
            Chế độ <b>LIVE DEMO</b>: hiển thị các phòng đấu giá trực tiếp thời gian thực. Bấm vào bất kỳ phòng nào để trải nghiệm phòng đấu giá LIVE tương tác đầy đủ tính năng!
          </span>
        </div>
      )}

      {/* Hiệu ứng Đang tải */}
      {mode === "loading" ? (
        <div className="flex items-center justify-center py-20 text-orange-500 gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm font-medium">Đang tải danh sách đấu giá...</span>
        </div>
      ) : (
        /* Danh sách Card Đấu Giá - Co giãn linh hoạt từ 1 đến 4 cột */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => {
            const remaining = item.endsAt - now;
            const ended = remaining <= 0;

            return (
              <div
                key={item.id}
                className="rounded-[24px] border p-4 flex flex-col gap-3.5 transition-all duration-300 hover:shadow-xl hover:border-orange-500/40 group"
                style={{
                  backgroundColor: "rgb(var(--bg-card))",
                  borderColor: "rgba(var(--border-main), 0.2)",
                }}
              >
                {/* Thumbnail có link sang phòng live */}
                <Link
                  href={`/auction/${item.id}`}
                  className="relative aspect-video rounded-2xl bg-gradient-to-br from-orange-400 to-amber-200 flex items-center justify-center overflow-hidden cursor-pointer"
                >
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Gavel size={40} className="text-white/80 group-hover:scale-110 transition-transform duration-300" />
                  )}
                  
                  {/* Badge LIVE góc */}
                  <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/90 text-white text-[10px] font-black tracking-wider uppercase backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    LIVE
                  </span>
                </Link>

                {/* Thông tin người tạo phòng đấu giá (Avatar + Tên + Link Profile) */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t" style={{ borderColor: "rgba(var(--border-main), 0.12)" }}>
                  {item.seller?.id ? (
                    <Link
                      href={`/profile/${item.seller.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="group/seller inline-flex items-center gap-2.5 min-w-0 hover:opacity-85 transition-opacity cursor-pointer"
                      title={`Xem trang cá nhân của ${item.seller.name}`}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={item.seller.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.seller.id}`}
                          alt={item.seller.name}
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(item.seller?.name || item.id)}`;
                          }}
                          className="w-7 h-7 rounded-full object-cover border border-orange-500/30 group-hover/seller:border-orange-500 transition-colors shadow-xs"
                        />
                        {item.seller.verified && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white dark:border-zinc-900" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-medium block uppercase tracking-wider leading-none" style={{ color: "rgb(var(--text-muted))" }}>
                          Chủ phòng
                        </span>
                        <span className="text-xs font-semibold truncate block group-hover/seller:text-orange-500 group-hover/seller:underline transition-colors mt-0.5" style={{ color: "rgb(var(--text-main))" }}>
                          {item.seller.name}
                        </span>
                      </div>
                    </Link>
                  ) : (
                    <div className="inline-flex items-center gap-2.5 min-w-0">
                      <img
                        src={item.seller?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.id}`}
                        alt={item.seller?.name || "Chủ phòng"}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(item.seller?.name || item.id)}`;
                        }}
                        className="w-7 h-7 rounded-full object-cover border border-orange-500/20 shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] font-medium block uppercase tracking-wider leading-none" style={{ color: "rgb(var(--text-muted))" }}>
                          Chủ phòng
                        </span>
                        <span className="text-xs font-semibold truncate block" style={{ color: "rgb(var(--text-main))" }}>
                          {item.seller?.name || "Người tạo phòng"}
                        </span>
                      </div>
                    </div>
                  )}

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-orange-500/10 text-orange-500 border border-orange-500/20 shrink-0">
                    <Sparkles className="w-2.5 h-2.5" /> Host
                  </span>
                </div>

                <div className="space-y-1">
                  <Link
                    href={`/auction/${item.id}`}
                    className="font-bold text-lg hover:text-orange-500 transition-colors line-clamp-1 block"
                    style={{ color: "rgb(var(--text-main))" }}
                  >
                    {item.title}
                  </Link>
                  <p className="text-sm line-clamp-2" style={{ color: "rgb(var(--text-muted))" }}>
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 font-bold text-orange-500 font-mono text-base">
                    <TrendingUp size={16} />
                    {formatMoney(item.currentBid)}
                  </div>
                  <span style={{ color: "rgb(var(--text-muted))" }}>{item.bidCount} lượt đặt</span>
                </div>

                <div
                  className={`flex items-center gap-2 text-sm font-medium ${ended ? "text-red-500" : ""}`}
                  style={{ color: ended ? undefined : "rgb(var(--text-main))" }}
                >
                  <Clock size={16} />
                  {formatRemaining(remaining)}
                </div>

                {/* Nút Vào Phòng Đấu Giá LIVE */}
                <Link
                  href={`/auction/${item.id}`}
                  className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-orange-500/10 hover:bg-orange-500 hover:text-white text-orange-500 text-xs font-black uppercase tracking-wider transition-all border border-orange-500/20 active:scale-95 cursor-pointer"
                >
                  <Radio className="w-3.5 h-3.5 text-red-500 group-hover:text-white animate-pulse" />
                  <span>Vào Phòng Đấu Giá LIVE</span>
                </Link>

                {/* Khung đặt giá nhanh tại card */}
                <div className="space-y-2 mt-auto pt-2 border-t" style={{ borderColor: "rgba(var(--border-main), 0.15)" }}>
                  {currentUser?.id && (item.seller?.id === currentUser.id || (item as any).created_by === currentUser.id) ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-semibold">
                      <ShieldAlert size={15} className="shrink-0" />
                      <span>Bạn là chủ phòng của phiên đấu giá này</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          aria-label={`Giá đặt cho ${item.title}`}
                          value={inputs[item.id] || ""}
                          onChange={(e) => setInputs((prev) => ({ ...prev, [item.id]: e.target.value }))}
                          disabled={ended}
                          placeholder="Nhập giá nhanh"
                          className="flex-1 min-w-0 px-3 py-2 rounded-xl border outline-none text-xs bg-transparent disabled:opacity-50"
                          style={{
                            borderColor: "rgba(var(--border-main), 0.3)",
                            color: "rgb(var(--text-main))",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleBid(item)}
                          disabled={ended}
                          className="px-3.5 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
                        >
                          Đặt giá
                        </button>
                      </div>
                      {errors[item.id] && <p className="text-xs text-red-500">{errors[item.id]}</p>}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tạo Phòng Đấu Giá */}
      <CreateAuctionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newRoomId) => {
          setIsCreateModalOpen(false);
          router.push(`/auction/${newRoomId}`);
        }}
      />
    </div>
  );
}
