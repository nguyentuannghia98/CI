"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Sparkles, 
  Clock, 
  Coins, 
  Trophy, 
  Zap, 
  Eye, 
  Volume2, 
  VolumeX, 
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Hand,
  LogOut,
  Users,
  ChevronDown,
  ExternalLink,
  X
} from "lucide-react";
import Theater3DScene, { CameraViewMode, StagePhase, MysteryItem } from "./components/Theater3DScene";
import { theaterAudio } from "./components/theaterAudio";
import { useUser } from "@/components/auth/store/AuthStore";

// DANH SÁCH VẬT PHẨM HỘP MÙ DO SÀN TỰ XUẤT QUỸ TÀI TRỢ
const MYSTERY_POOL: MysteryItem[] = [
  {
    id: "item_1",
    name: "Bàn Phím Cơ Custom Keychron Q1 Pro Full Nhôm",
    category: "Bàn phím cơ Gaming",
    estimatedValue: 4200000,
    startBid: 500000,
    imageUrl: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&auto=format&fit=crop&q=80",
    description: "Switch Tactile Baby Kangaroo cao cấp, keycap PBT Doubleshot, mạch xuôi hotswap nguyên bản.",
  },
  {
    id: "item_2",
    name: "Card Đồ Họa ASUS ROG Strix GeForce RTX 4080 OC",
    category: "Linh kiện PC Gaming",
    estimatedValue: 28500000,
    startBid: 5000000,
    imageUrl: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&auto=format&fit=crop&q=80",
    description: "Hàng tài trợ chính hãng ASUS ROG, tản nhiệt buồng hơi MaxContact siêu mát, nguyên seal 100%.",
  },
  {
    id: "item_3",
    name: "Tai Nghe Gaming Không Dây Bang & Olufsen Beoplay Portal",
    category: "Âm thanh Gaming VIP",
    estimatedValue: 8900000,
    startBid: 1200000,
    imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&auto=format&fit=crop&q=80",
    description: "Âm thanh vòm Dolby Atmos for Headphones, chống ồn chủ động ANC thế hệ mới.",
  },
];

export default function MysteryAuction3DPage() {
  const router = useRouter();
  const currentUser = useUser();

  // Modal Điều khoản vận hành (Terms of Engagement)
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsAgreedCheckbox, setTermsAgreedCheckbox] = useState(false);

  // Điểm ảo ví người dùng (Demo 100.000 Điểm / 15.000.000 Xu NexLoot)
  const [walletPoints, setWalletPoints] = useState(15000000);

  // Trạng thái phiên & vật phẩm
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const currentItem = MYSTERY_POOL[currentItemIndex];

  const [phase, setPhase] = useState<StagePhase>("BIDDING");
  const [countdown, setCountdown] = useState(25);
  const [currentBid, setCurrentBid] = useState(currentItem.startBid);
  const [highestBidder, setHighestBidder] = useState("Hệ thống Sàn");
  const [isUserLeader, setIsUserLeader] = useState(false);
  const [bidTrigger, setBidTrigger] = useState(0);
  const [cameraMode, setCameraMode] = useState<CameraViewMode>("overview");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [emojiEffect, setEmojiEffect] = useState<{ type: string; timestamp: number } | null>(null);

  // Ô nhập số tiền đấu giá tuỳ ý (Custom Bid Amount Input)
  const [bidAmountInput, setBidAmountInput] = useState<number>(currentItem.startBid + 50000);

  // 4 Luồng sự kiện người chơi & người điều phối
  const [isLeaving, setIsLeaving] = useState(false);
  const [lastBidAmount, setLastBidAmount] = useState(currentItem.startBid);
  const [calloutStep, setCalloutStep] = useState(1);

  // Menu mini người tham gia
  const [showParticipantsMenu, setShowParticipantsMenu] = useState(false);

  const myDisplayName = currentUser?.user_metadata?.full_name || currentUser?.email?.split("@")[0] || "Bạn (Tôi)";
  const myUserId = currentUser?.id || "my_profile";

  const participants = [
    {
      id: myUserId,
      name: myDisplayName,
      role: "user",
      roleTag: "⭐ Bạn",
      avatar: currentUser?.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
      status: isUserLeader ? "Đang dẫn đầu giá" : "Đã vào phòng",
      statusColor: isUserLeader ? "text-amber-400" : "text-emerald-400",
      isSelf: true,
    },
    {
      id: "host_nexloot",
      name: "Người Điều Phối",
      role: "host",
      roleTag: "👑 Sàn NexLoot",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&auto=format&fit=crop&q=80",
      status: "Điều hành phiên đấu",
      statusColor: "text-amber-300",
      isSelf: false,
    },
    {
      id: "usr_quangminh",
      name: "QuangMinh_Pro",
      role: "audience",
      roleTag: "👑 VIP Leader",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80",
      status: highestBidder === "QuangMinh_Pro" ? "Đang dẫn đầu" : "Hàng 2 - Ghế VIP",
      statusColor: "text-blue-400",
      isSelf: false,
    },
    {
      id: "usr_thanhhang",
      name: "ThanhHang_Tech",
      role: "audience",
      roleTag: "⚡ Săn Deal",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
      status: "Hàng 1 - Ghế A1",
      statusColor: "text-emerald-400",
      isSelf: false,
    },
    {
      id: "usr_hoangnam",
      name: "HoangNam_VIP",
      role: "audience",
      roleTag: "💎 Kim Cương",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
      status: "Hàng 1 - Ghế A2",
      statusColor: "text-purple-400",
      isSelf: false,
    },
    {
      id: "usr_tuananh",
      name: "TuanAnh_Gaming",
      role: "audience",
      roleTag: "🎮 Gamer",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
      status: "Hàng 3 - Ghế C1",
      statusColor: "text-orange-400",
      isSelf: false,
    },
    {
      id: "usr_maianh",
      name: "MaiAnh_Audio",
      role: "audience",
      roleTag: "🎧 Audiophile",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&auto=format&fit=crop&q=80",
      status: "Hàng 3 - Ghế C2",
      statusColor: "text-pink-400",
      isSelf: false,
    },
    {
      id: "usr_duchuy",
      name: "DucHuy_CustomKey",
      role: "audience",
      roleTag: "⌨️ Key Custom",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
      status: "Hàng 4 - Ghế D1",
      statusColor: "text-teal-400",
      isSelf: false,
    },
  ];

  const handleOpenProfile = (id: string) => {
    router.push(`/profile/${id}`);
  };

  // Feed tin tức hoạt động phòng đấu giá
  const [feedMessages, setFeedMessages] = useState<string[]>([
    "🏛️ Chào mừng bạn bước vào Phòng Đấu Giá Hoàng Gia!",
    "🚪 Cửa hậu trường mở: Nhân vật của bạn đang tiến vào và ổn định chỗ ngồi.",
    "📋 Cam kết 100% người dùng thật - Khán phòng không có bot/người ảo.",
  ]);

  // Cập nhật giá trị gợi ý khi mức giá dẫn đầu thay đổi
  useEffect(() => {
    setBidAmountInput(currentBid + 50000);
  }, [currentBid]);

  // VÒNG ĐỜI GAMEPLAY FLOW (ĐẾM NGƯỢC -> GÕ BÚA CHỐT GIÁ)
  useEffect(() => {
    if (!termsAccepted) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (phase === "BIDDING") {
            setPhase("ENDED");
            setCalloutStep(0);
            setFeedMessages((f) => [
              `🏆 GÕ BÚA CHỐT GIÁ! Chúc mừng ${highestBidder} đã chiến thắng vật phẩm ${currentItem.name}!`,
              ...f.slice(0, 5),
            ]);
            return 10;
          } else if (phase === "ENDED") {
            // Chu kỳ sang món đồ tiếp theo
            setCurrentItemIndex((prevIdx) => (prevIdx + 1) % MYSTERY_POOL.length);
            const nextItem = MYSTERY_POOL[(currentItemIndex + 1) % MYSTERY_POOL.length];
            setCurrentBid(nextItem.startBid);
            setLastBidAmount(nextItem.startBid);
            setBidAmountInput(nextItem.startBid + 50000);
            setIsUserLeader(false);
            setHighestBidder("Hệ thống Sàn");
            setCalloutStep(1);
            setPhase("BIDDING");
            setFeedMessages((f) => [
              "🔄 Bắt đầu phiên đấu giá vật phẩm tiếp theo của sàn...",
              ...f.slice(0, 5),
            ]);
            return 30;
          }
        }

        // Scripted NPC Callouts trong phase BIDDING
        if (phase === "BIDDING") {
          if (prev === 12) {
            setCalloutStep(2);
            setFeedMessages((f) => [
              `⚡ Người điều phối chỉ tay: "${(currentBid / 1000).toLocaleString("vi-VN")}k lần 2...!"`,
              ...f.slice(0, 5),
            ]);
          } else if (prev === 4) {
            setCalloutStep(3);
            setFeedMessages((f) => [
              `⚡ Người điều phối chuẩn bị gõ búa: "${(currentBid / 1000).toLocaleString("vi-VN")}k lần 3... SẮP CHỐT!"`,
              ...f.slice(0, 5),
            ]);
          }
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [termsAccepted, phase, currentItemIndex, currentItem, highestBidder, currentBid]);

  // HÀM XỬ LÝ ĐẶT GIÁ VỚI SỐ TIỀN TUỲ Ý (SUBMIT BID)
  const handleBidSubmit = (amountToBid?: number) => {
    if (phase !== "BIDDING") return;

    const targetAmount = amountToBid ?? bidAmountInput;

    if (isNaN(targetAmount) || targetAmount <= currentBid) {
      alert(`Mức giá đặt phải cao hơn mức giá dẫn đầu hiện tại (${currentBid.toLocaleString("vi-VN")} Xu)!`);
      return;
    }

    if (walletPoints < targetAmount) {
      alert("Số dư Điểm trong ví không đủ để tham gia dơ bảng mức giá này!");
      return;
    }

    const userName = currentUser?.user_metadata?.full_name || currentUser?.email?.split("@")[0] || "Tên_User";
    setCurrentBid(targetAmount);
    setLastBidAmount(targetAmount);
    setHighestBidder(userName);
    setIsUserLeader(true);
    setBidTrigger(Date.now());
    setCalloutStep(1);
    setCountdown(18);

    setFeedMessages((f) => [
      `✋ Bạn vừa vươn vai dơ cao bảng đấu giá: ${(targetAmount / 1000).toLocaleString("vi-VN")}k (${targetAmount.toLocaleString("vi-VN")} Xu)!`,
      ...f.slice(0, 5),
    ]);
  };

  // Nút cộng nhanh mức giá
  const handleQuickAdd = (increment: number) => {
    setBidAmountInput((prev) => Math.max(currentBid + increment, prev + increment));
  };

  // GIAI ĐOẠN 4: RÚT LUI CHỦ ĐỘNG (LEAVE ROOM TRIGGER)
  const handleExitHall = () => {
    if (isLeaving) {
      router.push("/auction");
      return;
    }
    setIsLeaving(true);
    setFeedMessages((f) => [
      "🚪 Nhân vật của bạn đang đứng dậy và bước ra cửa hậu trường...",
      ...f.slice(0, 5),
    ]);
  };

  const handleLeaveComplete = () => {
    router.push("/auction");
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      theaterAudio.enabled = !prev;
      return !prev;
    });
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#101217] text-white flex flex-col select-none font-sans">
      {/* =========================================================================
          3. MODAL ĐIỀU KHOẢN VẬN HÀNH (TERMS OF ENGAGEMENT MODAL)
          ========================================================================= */}
      {!termsAccepted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl rounded-3xl bg-[#161a22] border border-amber-500/40 p-6 sm:p-8 shadow-2xl space-y-6 text-zinc-200">
            {/* Header Modal */}
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-amber-300">
                  Quy Chế & Điều Khoản Vận Hành Phòng Đấu Giá
                </h2>
                <p className="text-xs text-zinc-400">
                  Cam kết môi trường đấu giá minh bạch, công bằng 100% giữa người dùng thật
                </p>
              </div>
            </div>

            {/* Nội dung 4 Điều khoản */}
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 text-xs sm:text-sm leading-relaxed text-zinc-300">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>1. Tính Minh Bạch Trong Phòng Đấu</span>
                </div>
                <p className="text-zinc-300 pl-6">
                  Phòng đấu giá cam kết hiển thị 100% người dùng thực tế đang có mặt, tuyệt đối không sử dụng tài khoản ảo hoặc bot để tự động đẩy giá.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>2. Rời Phòng Tự Do</span>
                </div>
                <p className="text-zinc-300 pl-6">
                  Người chơi có quyền rời khỏi phòng đấu bất kỳ lúc nào khi không có nhu cầu tham gia. Tuy nhiên, nếu bạn đang là người giữ mức giá cao nhất gần thời điểm chốt, việc ngắt kết nối đột ngột có thể được tính là từ bỏ/bùng cọc tùy thuộc vào kết quả cuối cùng.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <Scale className="w-4 h-4 text-cyan-400" />
                  <span>3. Tính Pháp Lý Của Lời Trả Giá</span>
                </div>
                <p className="text-zinc-300 pl-6">
                  Mỗi lần nhấn nút "ĐẶT GIÁ" và dơ bảng là một cam kết giao dịch thực tế tương ứng với số tiền/điểm cọc bị tạm khóa.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>4. Xác Nhận Người Thắng</span>
                </div>
                <p className="text-zinc-300 pl-6">
                  Khi người điều phối gõ búa lần thứ 3, kết quả hiển thị trên bảng điện tử là kết quả cuối cùng, có giá trị pháp lý ràng buộc giữa người mua và người bán trên nền tảng.
                </p>
              </div>
            </div>

            {/* Checkbox Cam Kết */}
            <label className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={termsAgreedCheckbox}
                onChange={(e) => setTermsAgreedCheckbox(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
              />
              <span className="font-semibold text-amber-200">
                Tôi đã đọc, hiểu rõ và cam kết tuân thủ toàn bộ Điều khoản vận hành phòng đấu giá.
              </span>
            </label>

            {/* Nút hành động */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/auction"
                className="px-5 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300 transition-all cursor-pointer"
              >
                Quay Lại Sàn Đấu
              </Link>
              <button
                type="button"
                disabled={!termsAgreedCheckbox}
                onClick={() => setTermsAccepted(true)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-orange-500/30"
              >
                Xác Nhận & Bước Vào Phòng Đấu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          KHÔNG GIAN 3D CHÍNH & HUD
          ========================================================================= */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {termsAccepted && (
          <Theater3DScene
            currentBid={currentBid}
            highestBidderName={highestBidder}
            isUserHighestBidder={isUserLeader}
            phase={phase}
            revealedItem={currentItem}
            cameraMode={cameraMode}
            onCameraModeChange={setCameraMode}
            triggerBidEffect={bidTrigger}
            lastBidAmount={lastBidAmount}
            calloutStep={calloutStep}
            emojiReaction={emojiEffect}
            isLeaving={isLeaving}
            onLeaveComplete={handleLeaveComplete}
            userName={myDisplayName}
          />
        )}

        {/* NÚT BACK (GÓC TRÊN BÊN TRÁI) */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={handleExitHall}
            className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
            title="Thoát hội trường"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* TIỆN ÍCH TRÊN CÙNG BÊN PHẢI */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => handleBidSubmit(currentBid + 50000)}
            className="px-4 py-2 rounded-xl bg-black/70 hover:bg-orange-500/80 backdrop-blur-md border border-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg"
          >
            ĐẶT GIÁ NHANH (+50k)
          </button>

          <div className="px-3.5 py-2 rounded-xl bg-black/70 backdrop-blur-md border border-white/20 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span>Ví 1 Chiều: 100k Điểm</span>
          </div>

          <button
            type="button"
            onClick={toggleSound}
            className="p-2 rounded-xl bg-black/70 backdrop-blur-md border border-white/20 text-white hover:text-orange-400 text-xs transition-all cursor-pointer shadow-lg"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-orange-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>
        </div>

        {/* BỘ CHUYỂN ĐỔI GÓC NHÌN CAMERA & DANH SÁCH NGƯỜI THAM GIA */}
        <div className="absolute top-16 left-4 z-20 flex flex-col gap-2 pointer-events-auto">
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-black/75 backdrop-blur-md border border-white/15 shadow-xl">
            {[
              { id: "overview", label: "Toàn Cảnh" },
              { id: "stage", label: "Bục Đấu Giá" },
              { id: "my_seat", label: "Ghế Của Tôi" },
              { id: "free", label: "Tự Do 360°" },
            ].map((cam) => (
              <button
                key={cam.id}
                type="button"
                onClick={() => setCameraMode(cam.id as CameraViewMode)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  cameraMode === cam.id
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/30"
                    : "text-zinc-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {cam.label}
              </button>
            ))}

            <div className="w-px h-4 bg-white/20 mx-0.5" />

            {/* Nút Người tham gia cạnh nút Tự Do 360° */}
            <button
              type="button"
              onClick={() => setShowParticipantsMenu((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                showParticipantsMenu
                  ? "bg-cyan-500/25 text-cyan-300 border-cyan-400/50 shadow-md shadow-cyan-500/20"
                  : "bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 border-white/10"
              }`}
              title="Xem danh sách người tham gia phòng đấu"
            >
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Người Tham Gia ({participants.length})</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showParticipantsMenu ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* MENU MINI CUỘN: DANH SÁCH NGƯỜI THAM GIA */}
          {showParticipantsMenu && (
            <div className="w-80 rounded-2xl bg-black/85 backdrop-blur-xl border border-white/20 shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">Khán Phòng Đấu Giá</h4>
                    <p className="text-[10px] text-zinc-400">Đang có <span className="text-emerald-400 font-bold">{participants.length} người</span> trực tiếp</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowParticipantsMenu(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Đóng menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Danh sách cuộn */}
              <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {participants.map((person) => (
                  <div
                    key={person.id}
                    className={`group flex items-center justify-between p-2 rounded-xl transition-all border ${
                      person.isSelf
                        ? "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20"
                        : person.role === "host"
                        ? "bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20"
                        : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15"
                    }`}
                  >
                    {/* Bấm vào avatar hoặc tên để sang trang profile */}
                    <div
                      onClick={() => handleOpenProfile(person.id)}
                      className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                      title={`Xem profile của ${person.name}`}
                    >
                      <div className="relative shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={person.avatar}
                          alt={person.name}
                          className="w-9 h-9 rounded-full object-cover border border-white/20 group-hover:scale-105 group-hover:border-cyan-400 transition-all shadow-md"
                        />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-black" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                            {person.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                          <span className="text-amber-300/90 font-medium">{person.roleTag}</span>
                          <span>•</span>
                          <span className={person.statusColor}>{person.status}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenProfile(person.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-300 hover:bg-white/10 transition-all cursor-pointer opacity-80 group-hover:opacity-100"
                      title="Xem trang cá nhân"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ICON EXIT Ở GÓC DƯỚI BÊN TRÁI */}
        <div className="absolute bottom-6 left-6 z-20 pointer-events-auto">
          <button
            type="button"
            onClick={handleExitHall}
            className="w-11 h-11 rounded-xl bg-black/70 hover:bg-red-500/30 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 group"
            title="Rời khỏi phòng đấu"
          >
            <LogOut className="w-5 h-5 text-zinc-300 group-hover:text-red-400" />
          </button>
        </div>

        {/* FEED BÁO TIN NHỎ BÊN TRÁI */}
        <div className="absolute bottom-20 left-6 z-20 w-72 pointer-events-none hidden md:block space-y-1">
          {feedMessages.slice(0, 3).map((msg, idx) => (
            <div
              key={idx}
              className="px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 text-[11px] text-zinc-200 leading-snug animate-in fade-in"
              style={{ opacity: 1 - idx * 0.25 }}
            >
              {msg}
            </div>
          ))}
        </div>

        {/* =========================================================================
            THANH ĐIỀU KHIỂN NHẬP SỐ TIỀN ĐẤU GIÁ (CHÍNH GIỮA MÀN HÌNH - IMAGE 4)
            ========================================================================= */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 max-w-xl w-full px-4 pointer-events-auto">
          <div className="p-4 rounded-3xl bg-[#12151e]/90 backdrop-blur-2xl border border-amber-500/40 shadow-2xl space-y-3">
            {/* Hàng trên: Mức giá dẫn đầu & Số dư ví */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 font-bold">
                  ⚡ MỨC GIÁ DẪN ĐẦU:
                </span>
                <span className="text-lg sm:text-xl font-black font-mono text-amber-300">
                  {currentBid.toLocaleString("vi-VN")} Xu
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">
                  Ví 1 Chiều:
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  100k Điểm ({walletPoints.toLocaleString("vi-VN")} Xu)
                </span>
              </div>
            </div>

            {/* Hàng giữa: Ô nhập số tiền đấu giá & Nút Đặt Giá / Dơ Bảng */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleBidSubmit();
              }}
              className="flex items-center gap-2.5"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  value={bidAmountInput ? bidAmountInput.toLocaleString("vi-VN") : ""}
                  onChange={(e) => {
                    const rawVal = e.target.value.replace(/\D/g, "");
                    setBidAmountInput(rawVal ? parseInt(rawVal, 10) : 0);
                  }}
                  disabled={phase !== "BIDDING"}
                  placeholder="Nhập số tiền muốn trả..."
                  className="w-full pl-3.5 pr-12 py-2.5 rounded-xl bg-white/10 border border-white/20 focus:border-amber-400 focus:outline-none text-white font-mono font-bold text-sm sm:text-base placeholder:text-zinc-500 transition-all disabled:opacity-40"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400 pointer-events-none">
                  Xu
                </span>
              </div>

              <button
                type="submit"
                disabled={phase !== "BIDDING" || bidAmountInput <= currentBid}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-black font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-orange-500/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
              >
                <Hand className="w-4 h-4 fill-black" />
                <span>ĐẶT GIÁ</span>
              </button>
            </form>

            {/* Hàng dưới: Các nút cộng nhanh mức giá (+50k, +100k, +500k, +1M) */}
            <div className="flex items-center gap-1.5 pt-1.5 border-t border-white/10">
              <span className="text-[10px] text-zinc-400 uppercase font-bold shrink-0 hidden sm:inline">
                Cộng nhanh:
              </span>
              <div className="grid grid-cols-4 gap-1.5 flex-1">
                {[
                  { label: "+50k", val: 50000 },
                  { label: "+100k", val: 100000 },
                  { label: "+500k", val: 500000 },
                  { label: "+1M", val: 1000000 },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    type="button"
                    disabled={phase !== "BIDDING"}
                    onClick={() => handleQuickAdd(btn.val)}
                    className="py-1 px-2 rounded-lg bg-white/10 hover:bg-orange-500/25 border border-white/15 hover:border-orange-500/50 text-white font-bold text-xs font-mono transition-all cursor-pointer disabled:opacity-40 active:scale-95"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
