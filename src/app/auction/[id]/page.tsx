"use client";

import { useState, useEffect, use, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useUser } from "@/components/auth/store/AuthStore";
import AuctionHeader from "../components/AuctionHeader";
import AuctionProductMedia from "../components/AuctionProductMedia";
import AuctionParticipantsList, { Participant } from "../components/AuctionParticipantsList";
import AuctionLiveChat, { ChatMessage } from "../components/AuctionLiveChat";
import AuctionBiddingConsole from "../components/AuctionBiddingConsole";
import AuctionLeaderboard, { BidRecord } from "../components/AuctionLeaderboard";
import AuctionVictoryModal from "../components/AuctionVictoryModal";

// Dữ liệu mẫu chuẩn bị sẵn theo từng ID nếu chưa có trong DB
const SAMPLE_ROOMS: Record<string, any> = {
  "1": {
    title: "Bàn phím cơ Custom Keychron Q1 Pro Wireless",
    description: "Switch Tactile Baby Kangaroo, Keycap PBT Dyesub cao cấp. Full nhôm CNC nguyên khối, đã lube switch và cân wire cực êm. Còn bảo hành 6 tháng tại NexLoot Store.",
    imageUrl: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=1000&auto=format&fit=crop&q=80",
    startBid: 1000000,
    currentBid: 1200000,
    maxBid: 2500000,
    bidCount: 4,
    minStep: 50000,
    category: "Bàn phím cơ",
    condition: "Like New 99%",
    seller: { id: "demo-user-1", name: "Keychron Official", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=keychron", verified: true },
  },
  "2": {
    title: "Card đồ họa ASUS ROG Strix GeForce RTX 3080 10GB",
    description: "Bản 3 quạt tản nhiệt đỉnh cao, LED RGB Aura Sync. Nhiệt độ full load không quá 68 độ, đã thay thermal pad xịn và vệ sinh sạch sẽ, bao test 1 đổi 1 trong 30 ngày.",
    imageUrl: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=1000&auto=format&fit=crop&q=80",
    startBid: 3000000,
    currentBid: 3500000,
    maxBid: 6000000,
    bidCount: 9,
    minStep: 100000,
    category: "Card đồ họa (VGA)",
    condition: "Đã qua sử dụng (Đẹp)",
    seller: { id: "demo-user-2", name: "ROG Gaming Store", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=rogstrix", verified: true },
  },
  "3": {
    title: "Màn hình Gaming LG UltraGear 27 inch 2K 165Hz IPS",
    description: "Tấm nền Nano IPS 1ms G-Sync Compatible, độ phủ màu 98% DCI-P3 chuẩn đồ họa và gaming. Không một điểm chết, đầy đủ hộp và cáp DisplayPort chính hãng.",
    imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1000&auto=format&fit=crop&q=80",
    startBid: 2500000,
    currentBid: 2800000,
    maxBid: 4500000,
    bidCount: 6,
    minStep: 50000,
    category: "Màn hình Gaming",
    condition: "Nguyên seal 100%",
    seller: { id: "demo-user-3", name: "TechGear Pro", avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=techgear", verified: true },
  },
};

function formatRelativeTime(dateString: string): string {
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${Math.floor(diffHours / 24)} ngày trước`;
  } catch {
    return "Vừa xong";
  }
}

export default function LiveAuctionRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: roomId } = use(params);
  const supabase = createClient();
  const currentUser = useUser();

  const channelRef = useRef<RealtimeChannel | null>(null);
  const myPresenceRef = useRef<Participant | null>(null);

  // Thông tin phòng đấu giá
  const [roomData, setRoomData] = useState<any>(() => {
    return (
      SAMPLE_ROOMS[roomId] || {
        title: `Vật phẩm Gaming Độc Quyền #${roomId}`,
        description:
          "Phiên đấu giá trực tiếp phòng VIP. Sản phẩm đã qua kiểm định chất lượng, cam kết giao dịch an toàn qua NexLoot Escrow.",
        imageUrl: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=1000&auto=format&fit=crop&q=80",
        startBid: 500000,
        currentBid: 500000,
        maxBid: 2000000,
        bidCount: 0,
        minStep: 50000,
        category: "Thiết bị Gaming",
        condition: "Nguyên seal 100%",
      }
    );
  });

  const [now, setNow] = useState(() => Date.now());
  const [endsAt, setEndsAt] = useState(() => Date.now() + 1000 * 60 * 45); // Mặc định 45 phút
  
  // Trạng thái giá tối đa và kết thúc phiên đấu giá
  const isMaxBidReached = Boolean(roomData.maxBid && roomData.currentBid >= roomData.maxBid);
  const isEnded = (endsAt - now <= 0) || isMaxBidReached || Boolean(roomData.winner_id);

  const [viewerCount, setViewerCount] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [realUserProfile, setRealUserProfile] = useState<{ id: string; username: string; avatar_url?: string } | null>(null);

  // Chế độ hiển thị Media (Ảnh 2D / 3D Cyber Arena / Thông số)
  const [mediaTab, setMediaTab] = useState<"media" | "3d" | "specs">("media");

  // Modal vinh danh người chiến thắng
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [winner, setWinner] = useState<{ id?: string; name: string; avatar: string; verified?: boolean } | null>(null);
  const hasShownVictoryRef = useRef(false);

  // Danh sách người tham gia quản lý qua Supabase Realtime Presence
  const [participants, setParticipants] = useState<Participant[]>([]);

  // Tin nhắn Live Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "m1",
      sender: {
        name: "Hệ Thống NexLoot",
        avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=system",
        verified: true,
      },
      content: "Chào mừng bạn đến với phòng đấu giá trực tiếp! Chúc bạn săn deal thành công.",
      timestamp: "12:00",
    },
  ]);

  // Bảng xếp hạng Top Bids
  const [bids, setBids] = useState<BidRecord[]>([]);

  // 1. TẢI DỮ LIỆU PHÒNG & LỊCH SỬ ĐẶT GIÁ TỪ SUPABASE HOẶC SESSION
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(`auction_room_${roomId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setRoomData(parsed);
          if (parsed.endsAt) setEndsAt(parsed.endsAt);
        } catch {}
      }
    }

    // Đọc Supabase nếu ID dạng uuid
    const loadFromDB = async () => {
      try {
        let data: any = null;
        const { data: joinData, error: joinErr } = await (supabase as any)
          .from("auctions")
          .select("*, seller:users!created_by(id, username, avatar_url)")
          .eq("id", roomId)
          .single();

        if (!joinErr && joinData) {
          data = joinData;
        } else {
          const { data: singleData } = await (supabase as any)
            .from("auctions")
            .select("*")
            .eq("id", roomId)
            .single();

          if (singleData) {
            data = singleData;
            if (singleData.created_by) {
              const { data: userData } = await (supabase as any)
                .from("users")
                .select("id, username, avatar_url")
                .eq("id", singleData.created_by)
                .single();
              if (userData) {
                data.seller = userData;
              }
            }
          }
        }

        if (data) {
          const sellerObj = Array.isArray(data.seller) ? data.seller[0] : data.seller;
          const sellerId = sellerObj?.id || data.created_by;
          const sellerName =
            sellerObj?.username || (sellerId ? `Thành viên #${String(sellerId).slice(0, 5)}` : "Chủ phòng");
          const sellerAvatar =
            sellerObj?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${sellerId || roomId}`;

          let parsedCategory = "Thiết bị Gaming";
          let parsedCondition = "Nguyên seal 100%";
          let parsedMinStep = 50000;
          let parsedMaxBid: number | undefined = undefined;
          let cleanDescription = data.description || "";

          const catMatch = cleanDescription.match(/\[Danh mục:\s*([^\]]+)\]/);
          if (catMatch) {
            parsedCategory = catMatch[1];
            cleanDescription = cleanDescription.replace(catMatch[0], "").trim();
          }
          const condMatch = cleanDescription.match(/\[(?:Tình trạng:\s*)?([^\]]+)\]/);
          if (condMatch) {
            parsedCondition = condMatch[1];
            cleanDescription = cleanDescription.replace(condMatch[0], "").trim();
          }
          const stepMatch = cleanDescription.match(/\[Bước giá:\s*(\d+)\]/);
          if (stepMatch) {
            parsedMinStep = Number(stepMatch[1]);
            cleanDescription = cleanDescription.replace(stepMatch[0], "").trim();
          }
          const maxBidMatch = cleanDescription.match(/\[(?:Giá tối đa|Giá trần|Mua ngay):\s*(\d+)\]/);
          if (maxBidMatch) {
            parsedMaxBid = Number(maxBidMatch[1]);
            cleanDescription = cleanDescription.replace(maxBidMatch[0], "").trim();
          }

          setRoomData((prev: any) => ({
            ...prev,
            title: data.title,
            description: cleanDescription || prev.description,
            imageUrl: data.image_url || prev.imageUrl,
            currentBid: data.current_bid ?? prev.currentBid,
            startBid: data.start_bid ?? prev.startBid,
            bidCount: data.bid_count ?? prev.bidCount,
            category: parsedCategory || prev.category,
            condition: parsedCondition || prev.condition,
            minStep: parsedMinStep || prev.minStep,
            maxBid: parsedMaxBid ?? prev.maxBid,
            winner_id: data.winner_id ?? prev.winner_id,
            created_by: sellerId,
            seller: {
              id: sellerId,
              name: sellerName,
              avatar: sellerAvatar,
              verified: true,
            },
          }));
          if (data.ends_at) {
            setEndsAt(new Date(data.ends_at).getTime());
          }
        }

        // Tải lịch sử bids thực tế từ bảng auction_bids
        const { data: dbBids, error: bidsErr } = await (supabase as any)
          .from("auction_bids")
          .select("id, amount, created_at, user_id, user:users!user_id(id, username, avatar_url)")
          .eq("auction_id", roomId)
          .order("created_at", { ascending: false });

        if (!bidsErr && dbBids && dbBids.length > 0) {
          const mappedBids: BidRecord[] = dbBids.map((b: any) => ({
            id: b.id,
            bidder: {
              id: b.user?.id || b.user_id,
              name: b.user?.username || `Thành viên #${String(b.user_id).slice(0, 5)}`,
              avatar: b.user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${b.user_id}`,
              verified: true,
              kycType: "VNeID",
            },
            amount: b.amount,
            placedAt: formatRelativeTime(b.created_at),
          }));
          setBids(mappedBids);
        }

        // Tải bình luận thực tế từ bảng auction_comments (nếu phòng chưa hết hạn)
        const isAlreadyEnded = data?.ends_at && new Date(data.ends_at).getTime() <= Date.now();
        if (isAlreadyEnded) {
          // Phiên đã kết thúc -> gọi dọn dẹp và thông báo
          try {
            await (supabase as any).rpc("cleanup_auction_comments", { p_auction_id: roomId });
          } catch {}
          setChatMessages([
            {
              id: "m_ended",
              sender: {
                name: "Hệ Thống NexLoot",
                avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=system",
                verified: true,
              },
              content: "Phiên đấu giá đã kết thúc. Toàn bộ bình luận trực tiếp đã được tự động dọn dẹp theo quy định.",
              timestamp: "Hết giờ",
            },
          ]);
        } else {
          let commentsData: any[] | null = null;
          const { data: joinComm, error: joinErr } = await (supabase as any)
            .from("auction_comments")
            .select("*, user:users!user_id(id, username, avatar_url)")
            .eq("auction_id", roomId)
            .order("created_at", { ascending: true });

          if (!joinErr && joinComm) {
            commentsData = joinComm;
          } else {
            const { data: simpleComm } = await (supabase as any)
              .from("auction_comments")
              .select("*")
              .eq("auction_id", roomId)
              .order("created_at", { ascending: true });
            commentsData = simpleComm;
          }

          if (commentsData && commentsData.length > 0) {
            const mappedComments: ChatMessage[] = commentsData.map((c: any) => {
              const u = c.user;
              const senderId = u?.id || c.user_id;
              const senderName = u?.username || c.user_name || "Người dùng";
              const senderAvatar = u?.avatar_url || c.user_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${senderId || c.id}`;
              return {
                id: c.id,
                sender: {
                  id: senderId,
                  name: senderName,
                  avatar: senderAvatar,
                  verified: true,
                  isSeller: Boolean(c.is_seller),
                  isCurrentUser: Boolean(currentUser?.id && senderId === currentUser.id),
                },
                content: c.content,
                timestamp: new Date(c.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
              };
            });

            setChatMessages([
              {
                id: "m_welcome",
                sender: {
                  name: "Hệ Thống NexLoot",
                  avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=system",
                  verified: true,
                },
                content: "Chào mừng bạn đến với phòng đấu giá trực tiếp! Chúc bạn săn deal thành công.",
                timestamp: "Live",
              },
              ...mappedComments,
            ]);
          }
        }
      } catch {}
    };

    loadFromDB();
  }, [roomId, supabase]);

  // 2. SUPABASE REALTIME PRESENCE: AN TOÀN, TỰ ĐỘNG TRACK KHI SUBSCRIBED, KHÔNG THROW
  useEffect(() => {
    let isCancelled = false;

    // Xác định key duy nhất đại diện cho người dùng
    let presenceKey = currentUser?.id;
    if (!presenceKey) {
      if (typeof window !== "undefined") {
        let guestId = sessionStorage.getItem("auction_guest_presence_id");
        if (!guestId) {
          guestId = `guest_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
          sessionStorage.setItem("auction_guest_presence_id", guestId);
        }
        presenceKey = guestId;
      } else {
        presenceKey = `guest_${Date.now()}`;
      }
    }

    const initialName =
      currentUser?.user_metadata?.full_name ||
      currentUser?.user_metadata?.username ||
      currentUser?.email?.split("@")[0] ||
      (currentUser?.id ? "Thành viên đã KYC" : "Người xem (Khách)");

    const initialAvatar =
      currentUser?.user_metadata?.avatar_url ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${presenceKey}`;

    const initialKycType: "VNeID" | "Zalo" | "CCCD" =
      currentUser?.user_metadata?.kyc_type || "VNeID";

    const defaultPresence: Participant = {
      id: presenceKey,
      name: initialName,
      avatar: initialAvatar,
      kycType: initialKycType,
      isOnline: true,
      role: "Người tham gia",
      totalBids: 0,
      lastBidAmount: undefined,
      isCurrentUser: true,
    };
    myPresenceRef.current = defaultPresence;

    const channelName = `auction_room:${roomId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: presenceKey,
        },
      },
    });

    channelRef.current = channel;

    // Cập nhật danh sách người tham gia trực tuyến và đếm người xem từ presenceState
    const syncPresenceState = () => {
      if (isCancelled) return;
      const state = channel.presenceState<Participant>();
      const userMap = new Map<string, Participant>();

      Object.keys(state).forEach((key) => {
        const presences = state[key];
        if (presences && presences.length > 0) {
          const latest = presences[presences.length - 1];
          const dedupeKey = latest.id || key;
          userMap.set(dedupeKey, {
            ...latest,
            isOnline: true,
            isCurrentUser: latest.id === currentUser?.id || key === presenceKey,
          });
        }
      });

      const list = Array.from(userMap.values());

      // Sắp xếp: Ai đã đặt giá cao hơn lên trước, sau đó đến người đang theo dõi
      list.sort((a, b) => {
        const bidA = a.lastBidAmount || 0;
        const bidB = b.lastBidAmount || 0;
        if (bidA !== bidB) return bidB - bidA;
        return (b.totalBids || 0) - (a.totalBids || 0);
      });

      setParticipants(list);
      setViewerCount(list.length);
    };

    // Đăng ký các sự kiện Realtime đồng bộ ngay khi tạo channel
    channel
      .on("presence", { event: "sync" }, syncPresenceState)
      .on("presence", { event: "join" }, syncPresenceState)
      .on("presence", { event: "leave" }, syncPresenceState)
      .on("broadcast", { event: "new_bid" }, ({ payload }) => {
        if (!payload || payload.roomId !== roomId) return;
        const reachedMax = Boolean(payload.isHitMax || (roomData.maxBid && payload.amount >= roomData.maxBid));
        setRoomData((prev: any) => ({
          ...prev,
          currentBid: payload.amount,
          bidCount: (prev.bidCount || 0) + 1,
          winner_id: reachedMax ? (payload.bidRecord?.bidder?.id || prev.winner_id) : prev.winner_id,
        }));
        if (payload.bidRecord) {
          setBids((prev) => [payload.bidRecord, ...prev.filter((b) => b.id !== payload.bidRecord.id)]);
          if (reachedMax) {
            setWinner(payload.bidRecord.bidder);
            setShowVictoryModal(true);
          }
        }
        if (payload.chatMessage) {
          setChatMessages((prev) => [...prev, payload.chatMessage]);
        }
        playBidSound();
      })
      .on("broadcast", { event: "chat_message" }, ({ payload }) => {
        if (!payload || payload.roomId !== roomId) return;
        if (payload.message) {
          setChatMessages((prev) => {
            if (prev.some((m) => m.id === payload.message.id)) return prev;
            return [...prev, payload.message];
          });
        }
      })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "auction_comments", filter: `auction_id=eq.${roomId}` },
        (payload) => {
          const row = payload.new as any;
          if (!row) return;
          const newComment: ChatMessage = {
            id: row.id,
            sender: {
              name: row.user_name || "Người dùng",
              avatar: row.user_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${row.user_id || row.id}`,
              verified: true,
              isSeller: Boolean(row.is_seller),
              isCurrentUser: Boolean(currentUser?.id && row.user_id === currentUser.id),
            },
            content: row.content,
            timestamp: new Date(row.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          };

          setChatMessages((prev) => {
            if (prev.some((m) => m.id === newComment.id || (m.sender.name === newComment.sender.name && m.content === newComment.content && Math.abs(Date.now() - new Date(row.created_at).getTime()) < 3000))) {
              return prev;
            }
            return [...prev, newComment];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "auction_comments", filter: `auction_id=eq.${roomId}` },
        () => {
          setChatMessages([
            {
              id: "m_ended",
              sender: {
                name: "Hệ Thống NexLoot",
                avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=system",
                verified: true,
              },
              content: "Phiên đấu giá đã kết thúc. Toàn bộ bình luận trực tiếp đã được tự động dọn dẹp theo quy định.",
              timestamp: "Hết giờ",
            },
          ]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "auctions", filter: `id=eq.${roomId}` },
        (payload) => {
          const row = payload.new as any;
          if (row) {
            setRoomData((prev: any) => ({
              ...prev,
              currentBid: row.current_bid ?? prev.currentBid,
              bidCount: row.bid_count ?? prev.bidCount,
            }));
          }
        }
      )
      .subscribe(async (status) => {
        // CHỈ TRACK KHI TRẠNG THÁI CHANNEL ĐÃ LÀ SUBSCRIBED (Tránh lỗi push before joining)
        if (status === "SUBSCRIBED" && !isCancelled) {
          try {
            await channel.track(myPresenceRef.current || defaultPresence);
          } catch (err) {
            console.warn("Lỗi track Presence ban đầu:", err);
          }
        }
      });

    // Làm giàu dữ liệu profile thực tế từ DB nếu đã đăng nhập
    if (currentUser?.id) {
      (async () => {
        try {
          const { data: dbUser } = await (supabase as any)
            .from("users")
            .select("id, username, avatar_url, identity")
            .eq("id", currentUser.id)
            .maybeSingle();

          if (!isCancelled && dbUser) {
            setRealUserProfile({
              id: dbUser.id,
              username: dbUser.username || currentUser.user_metadata?.full_name || currentUser.user_metadata?.username || "Thành viên",
              avatar_url: dbUser.avatar_url || currentUser.user_metadata?.avatar_url,
            });
            const enriched: Participant = {
              ...myPresenceRef.current!,
              name: dbUser.username || myPresenceRef.current!.name,
              avatar: dbUser.avatar_url || myPresenceRef.current!.avatar,
              kycType: dbUser.identity ? "VNeID" : myPresenceRef.current!.kycType,
            };
            myPresenceRef.current = enriched;
            if ((channel as any).state === "joined") {
              await channel.track(enriched);
            }
          }
        } catch {}
      })();
    }

    // Dọn dẹp an toàn khi người dùng chuyển trang hoặc unmount
    return () => {
      isCancelled = true;
      try {
        // Supabase removeChannel tự động dọn dẹp Presence server-side an toàn
        supabase.removeChannel(channel);
      } catch {}
      channelRef.current = null;
    };
  }, [roomId, currentUser?.id, supabase]);

  // Cập nhật đồng hồ đếm ngược mỗi giây
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Âm thanh thông báo nhẹ nhàng (Web Audio API)
  const playBidSound = useCallback(() => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // Note D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // Note A5
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch {}
  }, [soundEnabled]);

  const isOwner = Boolean(
    currentUser?.id &&
      (currentUser.id === roomData?.seller?.id || currentUser.id === roomData?.created_by)
  );

  // Xử lý khi người dùng đặt giá (Bidding & Presence Track Update)
  const handlePlaceBid = async (amount: number) => {
    if (isOwner) {
      alert("Bạn là chủ phòng của phiên đấu giá này, không thể tự đấu giá món đồ của chính mình!");
      return;
    }
    if (isEnded) {
      alert("Phiên đấu giá đã kết thúc!");
      return;
    }

    const currentUserName =
      myPresenceRef.current?.name ||
      currentUser?.user_metadata?.full_name ||
      currentUser?.email?.split("@")[0] ||
      "Bạn (Đã KYC)";
    const currentUserAvatar =
      myPresenceRef.current?.avatar ||
      currentUser?.user_metadata?.avatar_url ||
      "https://api.dicebear.com/7.x/bottts/svg?seed=user-current";

    // Kẹp giá nếu có giá tối đa
    let finalAmount = amount;
    const isHitMax = Boolean(roomData.maxBid && finalAmount >= roomData.maxBid);
    if (roomData.maxBid && finalAmount > roomData.maxBid) {
      finalAmount = roomData.maxBid;
    }

    // 1. Cập nhật roomData
    setRoomData((prev: any) => ({
      ...prev,
      currentBid: finalAmount,
      bidCount: (prev.bidCount || 0) + 1,
      winner_id: isHitMax ? (currentUser?.id || "me") : prev.winner_id,
    }));

    // 2. Thêm vào bảng xếp hạng (Đưa lên Top 1)
    const newBidRecord: BidRecord = {
      id: `bid_${Date.now()}`,
      bidder: {
        id: currentUser?.id || "me",
        name: currentUserName,
        avatar: currentUserAvatar,
        verified: true,
        kycType: myPresenceRef.current?.kycType || "VNeID",
      },
      amount: finalAmount,
      placedAt: "Vừa xong",
    };
    setBids((prev) => [newBidRecord, ...prev]);

    // 3. Thêm tin nhắn hệ thống vào chat
    const alertMsg: ChatMessage = {
      id: `sys_${Date.now()}`,
      sender: {
        id: currentUser?.id,
        name: currentUserName,
        avatar: currentUserAvatar,
        verified: true,
        isCurrentUser: true,
      },
      content: isHitMax
        ? `🏆 ${currentUserName} ĐÃ ĐẶT MỨC GIÁ TỐI ĐA ${finalAmount.toLocaleString("vi-VN")}đ VÀ CHIẾN THẮNG PHIÊN ĐẤU GIÁ NÀY!`
        : `⚡ ${currentUserName} vừa nâng giá lên ${finalAmount.toLocaleString("vi-VN")}đ!`,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      isSystemAlert: true,
      bidAmount: finalAmount,
    };
    setChatMessages((prev) => [...prev, alertMsg]);

    // 4. Nếu đạt giá tối đa -> Bật Victory Modal ngay lập tức
    if (isHitMax) {
      setWinner(newBidRecord.bidder);
      setShowVictoryModal(true);
    }

    // 5. CẬP NHẬT PRESENCE TRACK ĐỒNG BỘ CHO TOÀN BỘ NGƯỜI XEM (Chuyển sang Top Bidder & hiển thị số tiền)
    const newTotalBids = (myPresenceRef.current?.totalBids || 0) + 1;
    const updatedPresence: Participant = {
      ...myPresenceRef.current!,
      lastBidAmount: finalAmount,
      totalBids: newTotalBids,
      role: isHitMax ? "Người thắng cuộc" : "Top Bidder",
    };
    myPresenceRef.current = updatedPresence;

    if (channelRef.current && (channelRef.current as any).state === "joined") {
      try {
        await channelRef.current.track(updatedPresence);
        channelRef.current.send({
          type: "broadcast",
          event: "new_bid",
          payload: {
            roomId,
            amount: finalAmount,
            bidRecord: newBidRecord,
            chatMessage: alertMsg,
            isHitMax,
          },
        });
      } catch (err) {
        console.warn("Lỗi gửi Realtime Presence/Broadcast:", err);
      }
    }

    // 6. Cập nhật state cục bộ cho danh sách người tham gia
    setParticipants((prev) => {
      const filtered = prev.filter((p) => p.id !== updatedPresence.id);
      return [updatedPresence, ...filtered].sort((a, b) => {
        const bidA = a.lastBidAmount || 0;
        const bidB = b.lastBidAmount || 0;
        if (bidA !== bidB) return bidB - bidA;
        return (b.totalBids || 0) - (a.totalBids || 0);
      });
    });

    // 7. Phát âm thanh
    playBidSound();

    // 8. Cập nhật Supabase nếu có DB
    try {
      if (isHitMax) {
        await (supabase as any)
          .from("auctions")
          .update({
            current_bid: finalAmount,
            winner_id: currentUser?.id || null,
            ends_at: new Date().toISOString(),
          })
          .eq("id", roomId);
      }
      await (supabase as any).rpc("place_bid", {
        p_auction_id: roomId,
        p_amount: finalAmount,
      });
    } catch {}
  };

  // Tự động bật modal vinh danh người chiến thắng khi hết giờ
  useEffect(() => {
    if (isEnded && !hasShownVictoryRef.current && bids.length > 0) {
      hasShownVictoryRef.current = true;
      const topWinner = winner || bids[0]?.bidder;
      if (topWinner) {
        setWinner(topWinner);
        setShowVictoryModal(true);
      }
    }
  }, [isEnded, bids, winner]);

  // Tự động dọn dẹp bình luận khi phiên kết thúc
  const hasCleanedUpRef = useRef(false);

  useEffect(() => {
    if (isEnded && !hasCleanedUpRef.current) {
      hasCleanedUpRef.current = true;
      const performCleanup = async () => {
        try {
          await (supabase as any).rpc("cleanup_auction_comments", { p_auction_id: roomId });
        } catch {
          try {
            await (supabase as any).from("auction_comments").delete().eq("auction_id", roomId);
          } catch {}
        }
      };
      performCleanup();
    }
  }, [isEnded, roomId, supabase]);

  // Gửi tin nhắn chat thông thường - Lưu Supabase & Phát Realtime
  const handleSendMessage = async (text: string) => {
    if (isEnded || !text.trim()) return;

    const currentUserId = currentUser?.id || null;
    const currentUserName =
      realUserProfile?.username ||
      currentUser?.user_metadata?.full_name ||
      currentUser?.user_metadata?.username ||
      currentUser?.email?.split("@")[0] ||
      myPresenceRef.current?.name ||
      "Người dùng";
    const currentUserAvatar =
      realUserProfile?.avatar_url ||
      currentUser?.user_metadata?.avatar_url ||
      myPresenceRef.current?.avatar ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUserId || "guest"}`;
    const isSeller = Boolean(
      currentUserId &&
      roomData?.created_by &&
      String(currentUserId) === String(roomData.created_by)
    );

    const tempId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newMsg: ChatMessage = {
      id: tempId,
      sender: {
        id: currentUserId || undefined,
        name: currentUserName,
        avatar: currentUserAvatar,
        verified: true,
        isSeller,
        isCurrentUser: true,
      },
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, newMsg]);

    // 1. Broadcast ngay lập tức cho các thành viên đang online
    if (channelRef.current && (channelRef.current as any).state === "joined") {
      channelRef.current.send({
        type: "broadcast",
        event: "chat_message",
        payload: {
          roomId,
          message: {
            ...newMsg,
            sender: { ...newMsg.sender, isCurrentUser: false },
          },
        },
      });
    }

    // 2. Lưu vào bảng auction_comments trên Supabase
    try {
      await (supabase as any).from("auction_comments").insert({
        auction_id: roomId,
        user_id: currentUserId,
        user_name: currentUserName,
        user_avatar: currentUserAvatar,
        content: text.trim(),
        is_seller: isSeller,
      });
    } catch (err) {
      console.warn("Lỗi lưu bình luận lên Supabase:", err);
    }
  };

  const currentHighestBidder = bids.length > 0 ? bids[0].bidder : undefined;

  return (
    <div 
      className="w-full min-h-screen lg:min-h-0 lg:h-[calc(100vh-64px)] lg:max-h-[calc(100vh-64px)] flex flex-col overflow-y-auto lg:overflow-hidden transition-colors pb-12 lg:pb-0" 
      style={{ backgroundColor: "rgb(var(--bg-surface))" }}
    >
      {/* 1. Header trên cùng (Gọn gàng ~48px) */}
      <AuctionHeader
        roomId={roomId}
        title={roomData.title}
        endsAt={endsAt}
        now={now}
        viewerCount={viewerCount}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        isEnded={isEnded}
        winnerName={winner?.name || currentHighestBidder?.name}
        isMaxBidReached={isMaxBidReached}
        is3DMode={mediaTab === "3d"}
        onToggle3DMode={() => setMediaTab((prev) => (prev === "3d" ? "media" : "3d"))}
      />

      {/* Nội dung chính phòng đấu giá - Vừa vặn 100% Viewport, No Vertical Scroll trên Desktop */}
      <main className="w-full flex-1 min-h-0 max-w-[1600px] mx-auto p-2 sm:p-3 lg:p-3.5 flex flex-col overflow-hidden">
        {/* Lưới 3 cột Desktop */}
        <div className="w-full flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-3 overflow-y-auto lg:overflow-hidden">
          
          {/* CỘT 1 (BÊN TRÁI): Main Stage - Media & Giá dẫn đầu + Bàn phím đè giá (6/12 cột) */}
          <section className="lg:col-span-6 xl:col-span-6 2xl:col-span-6 flex flex-col gap-2.5 h-full min-h-0 overflow-hidden">
            {/* Khối Media & Giá (Tự động co giãn chiếm phần lớn không gian cột trái) */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <AuctionProductMedia
                title={roomData.title}
                description={roomData.description}
                imageUrl={roomData.imageUrl}
                currentBid={roomData.currentBid}
                startBid={roomData.startBid}
                bidCount={roomData.bidCount}
                minStep={roomData.minStep}
                maxBid={roomData.maxBid}
                category={roomData.category}
                condition={roomData.condition}
                highestBidder={currentHighestBidder}
                seller={roomData.seller}
                isEnded={isEnded}
                isMaxBidReached={isMaxBidReached}
                onPlaceBid={handlePlaceBid}
                activeTab={mediaTab}
                onTabChange={setMediaTab}
              />
            </div>

            {/* Bàn phím đè giá nhanh (Cố định phía dưới Media) */}
            <div className="shrink-0">
              <AuctionBiddingConsole
                currentBid={roomData.currentBid}
                minStep={roomData.minStep}
                maxBid={roomData.maxBid}
                isEnded={isEnded}
                isOwner={isOwner}
                onPlaceBid={handlePlaceBid}
              />
            </div>
          </section>

          {/* CỘT 2 (GIỮA): Bảng xếp hạng Top Bids & Danh sách người tham gia KYC (3/12 cột) */}
          <section className="lg:col-span-3 xl:col-span-3 2xl:col-span-3 flex flex-col gap-2.5 h-full min-h-0 overflow-hidden">
            {/* Nửa trên: Bảng xếp hạng Top Bids */}
            <div className="h-[280px] lg:h-1/2 min-h-0 overflow-hidden">
              <AuctionLeaderboard
                bids={bids}
                currentBid={roomData.currentBid}
              />
            </div>

            {/* Nửa dưới: Danh sách người tham gia KYC Presence */}
            <div className="h-[280px] lg:h-1/2 min-h-0 overflow-hidden">
              <AuctionParticipantsList
                participants={participants}
                viewerCount={viewerCount}
              />
            </div>
          </section>

          {/* CỘT 3 (BÊN PHẢI CÙNG): Trò chuyện & Nhảy giá trực tiếp (3/12 cột, Full Height) */}
          <section className="lg:col-span-3 xl:col-span-3 2xl:col-span-3 h-[420px] lg:h-full min-h-0 overflow-hidden">
            <AuctionLiveChat
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              onSendReaction={(emoji) => handleSendMessage(emoji)}
              isEnded={isEnded}
            />
          </section>

        </div>
      </main>

      {/* Modal vinh danh người chiến thắng */}
      <AuctionVictoryModal
        isOpen={showVictoryModal}
        onClose={() => setShowVictoryModal(false)}
        winner={winner || currentHighestBidder || null}
        auctionTitle={roomData.title}
        winningAmount={roomData.currentBid}
        isMaxBidReached={isMaxBidReached}
      />
    </div>
  );
}
