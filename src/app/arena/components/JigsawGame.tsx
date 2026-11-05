"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { 
  Puzzle, 
  Timer, 
  Trophy, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Users, 
  Zap, 
  Flame, 
  Crown,
  HelpCircle,
  Flag
} from "lucide-react";
import { showForfeitAlert } from "@/lib/swal";
import type { ArenaRoom } from "../types";

// Âm thanh Web Audio API tổng hợp (không phụ thuộc file ngoài)
class JigsawSoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playSelect() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }

  playSwap() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(540, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }

  playCorrectSnap() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {}
  }

  playWin() {
    if (!this.enabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        const start = ctx.currentTime + idx * 0.12;
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.45);
      });
    } catch {}
  }
}

const soundEngine = new JigsawSoundEngine();

// Mẫu 14 đối thủ mặc định khi phòng chưa đủ 15 người
const DEFAULT_OPPONENTS: { name: string; avatar: string }[] = [
  { name: "MinhTuDev", avatar: "M" },
  { name: "HoangAnh99", avatar: "H" },
  { name: "LinhGamer", avatar: "L" },
  { name: "QuangMinh_Pro", avatar: "Q" },
  { name: "ThanhHang_Tech", avatar: "T" },
  { name: "HoangNam_VIP", avatar: "N" },
  { name: "TuanAnh_Speed", avatar: "A" },
  { name: "MaiAnh_Puzzle", avatar: "M" },
  { name: "DucHuy_Custom", avatar: "D" },
  { name: "PhuongThao", avatar: "P" },
  { name: "VietDung_9x", avatar: "V" },
  { name: "BaoLong_Fast", avatar: "B" },
  { name: "NgocDiep", avatar: "N" },
  { name: "HaiDang_Ace", avatar: "H" },
];

export interface JigsawGameProps {
  room: ArenaRoom;
  currentUser: { id: string; name: string } | null;
  onFinish: (result: { timeSeconds: number; rank: number; isWinner: boolean; score: number }) => void;
  onQuit?: () => void;
}

interface Competitor {
  id: string;
  name: string;
  avatar: string;
  isSelf: boolean;
  progress: number; // 0 - 100
  finishedTime: number | null; // giây khi hoàn thành
  speedFactor: number; // tốc độ ngẫu nhiên
}

// Hàm sinh ngẫu nhiên số mảnh ghép cho trận đấu (3x3 = 9 mảnh, 4x4 = 16 mảnh, 5x5 = 25 mảnh)
// Thuật toán dựa trên mã room.id để đảm bảo cả 15 người chơi cùng vào phòng này đều thi đấu chung 1 độ khó duy nhất
function getMatchGridSize(roomId?: string): 3 | 4 | 5 {
  const SIZES: (3 | 4 | 5)[] = [3, 4, 5];
  if (!roomId) {
    return SIZES[Math.floor(Math.random() * SIZES.length)];
  }
  let hash = 0;
  for (let i = 0; i < roomId.length; i++) {
    hash = (hash << 5) - hash + roomId.charCodeAt(i);
    hash |= 0;
  }
  return SIZES[Math.abs(hash) % SIZES.length];
}

export function JigsawGame({ room, currentUser, onFinish, onQuit }: JigsawGameProps) {
  // Mỗi trận đấu được hệ thống chỉ định NGẪU NHIÊN 1 độ khó duy nhất: 9 mảnh, 16 mảnh hoặc 25 mảnh
  const [gridSize] = useState<3 | 4 | 5>(() => getMatchGridSize(room.id));
  const totalTiles = gridSize * gridSize;

  // Trạng thái bảng ghép: mảng lưu tileId đang ở từng vị trí (0 -> totalTiles - 1)
  const [tiles, setTiles] = useState<number[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [draggedSlot, setDraggedSlot] = useState<number | null>(null);
  const [movesCount, setMovesCount] = useState(0);

  // Thời gian & Trạng thái chơi
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Hiệu ứng pháo giấy Confetti trên Canvas
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Danh sách 15 người chơi thi đấu
  const [competitors, setCompetitors] = useState<Competitor[]>([]);

  // Ảnh sản phẩm sử dụng để cắt mảnh ghép
  const puzzleImage = useMemo(() => {
    return (
      room.productImage ||
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80"
    );
  }, [room.productImage]);

  // Đồng bộ âm thanh
  useEffect(() => {
    soundEngine.enabled = soundEnabled;
  }, [soundEnabled]);

  // 1. KHỞI TẠO DANH SÁCH 15 NGƯỜI THI ĐẤU
  useEffect(() => {
    const selfName = currentUser?.name || "Bạn (Tôi)";
    const selfComp: Competitor = {
      id: currentUser?.id || "self",
      name: selfName,
      avatar: selfName.charAt(0).toUpperCase(),
      isSelf: true,
      progress: 0,
      finishedTime: null,
      speedFactor: 1.0,
    };

    // Lấy đối thủ từ phòng + danh sách mặc định cho đủ 15 người
    const opponentList: Competitor[] = [];
    const pool = [...room.currentParticipants.filter((p) => p.id !== currentUser?.id), ...DEFAULT_OPPONENTS];

    // Tốc độ cơ bản theo độ khó của trận đấu
    const baseSpeed = gridSize === 3 ? 1.35 : gridSize === 4 ? 0.95 : 0.7;

    for (let i = 0; i < 14; i++) {
      const opp = pool[i % pool.length];
      opponentList.push({
        id: `opp_${i}_${opp.name}`,
        name: opp.name,
        avatar: opp.avatar || opp.name.charAt(0).toUpperCase(),
        isSelf: false,
        progress: 0,
        finishedTime: null,
        // Tốc độ ghép tương ứng với số mảnh của trận đấu (9 mảnh nhanh hơn, 25 mảnh cần nhiều thời gian hơn)
        speedFactor: baseSpeed * (0.75 + Math.random() * 0.5),
      });
    }

    setCompetitors([selfComp, ...opponentList]);
  }, [room.currentParticipants, currentUser, gridSize]);

  // 2. THUẬT TOÁN XÁO TRỘN MẢNH GHÉP (SHUFFLE)
  const initAndShuffleBoard = useCallback((size: 3 | 4 | 5) => {
    const total = size * size;
    const initial = Array.from({ length: total }, (_, i) => i);

    // Xáo trộn Fisher-Yates nhiều lần đảm bảo các mảnh bị đảo lộn
    for (let round = 0; round < 3; round++) {
      for (let i = initial.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [initial[i], initial[j]] = [initial[j], initial[i]];
      }
    }

    // Đảm bảo không tình cờ đã hoàn thành ngay từ đầu
    const correctCount = initial.filter((val, idx) => val === idx).length;
    if (correctCount >= total - 1) {
      // Đổi chỗ 2 phần tử đầu
      [initial[0], initial[1]] = [initial[1], initial[0]];
    }

    setTiles(initial);
    setSelectedSlot(null);
    setDraggedSlot(null);
    setMovesCount(0);
    setElapsedMs(0);
    setIsCompleted(false);
    setIsPlaying(true);
  }, []);

  // Bắt đầu game khi component mount hoặc khi đổi kích thước
  useEffect(() => {
    initAndShuffleBoard(gridSize);
  }, [gridSize, initAndShuffleBoard]);

  // 3. ĐỒNG HỒ ĐO THỜI GIAN THI ĐẤU
  useEffect(() => {
    if (!isPlaying || isCompleted) return;

    const timer = setInterval(() => {
      setElapsedMs((prev) => prev + 100);
    }, 100);

    return () => clearInterval(timer);
  }, [isPlaying, isCompleted]);

  // Tính số mảnh đã ghép đúng vị trí
  const correctCount = useMemo(() => {
    return tiles.filter((tileId, slotIndex) => tileId === slotIndex).length;
  }, [tiles]);

  const userProgress = useMemo(() => {
    if (totalTiles === 0) return 0;
    return Math.round((correctCount / totalTiles) * 100);
  }, [correctCount, totalTiles]);

  // 4. MÔ PHỎNG TIẾN ĐỘ 14 ĐỐI THỦ ĐANG ĐUA THEO THỜI GIAN THẬT
  useEffect(() => {
    if (!isPlaying || isCompleted) return;

    const interval = setInterval(() => {
      setCompetitors((prev) =>
        prev.map((comp) => {
          if (comp.isSelf) {
            return { ...comp, progress: userProgress };
          }
          if (comp.finishedTime !== null) {
            return comp; // Đã về đích
          }

          // Tăng tiến độ dựa trên speedFactor
          const increment = Math.floor((Math.random() * 4 + 1) * comp.speedFactor);
          const nextProgress = Math.min(100, comp.progress + increment);
          const finished = nextProgress >= 100 ? Math.round((elapsedMs / 100) / 10) : null;

          return {
            ...comp,
            progress: nextProgress,
            finishedTime: finished,
          };
        })
      );
    }, 1200);

    return () => clearInterval(interval);
  }, [isPlaying, isCompleted, userProgress, elapsedMs]);

  // Xếp hạng hiện tại của người chơi
  const currentRank = useMemo(() => {
    const sorted = [...competitors].sort((a, b) => {
      if (a.finishedTime !== null && b.finishedTime !== null) {
        return a.finishedTime - b.finishedTime;
      }
      if (a.finishedTime !== null) return -1;
      if (b.finishedTime !== null) return 1;
      return b.progress - a.progress;
    });
    const rankIndex = sorted.findIndex((c) => c.isSelf);
    return rankIndex >= 0 ? rankIndex + 1 : 1;
  }, [competitors]);

  // 5. HIỆU ỨNG PHÁO GIẤY CONFETTI KHI HOÀN THÀNH
  const triggerConfetti = useCallback(() => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      rotation: number;
      rotationSpeed: number;
    }[] = [];

    const colors = ["#f97316", "#eab308", "#10b981", "#38bdf8", "#ec4899", "#8b5cf6"];

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 14,
        vy: (Math.random() - 0.7) * 16,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
      });
    }

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // Trọng lực
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      frame++;
      if (frame < 120) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    animate();
  }, []);

  // 6. KIỂM TRA THẮNG CUỘC
  useEffect(() => {
    if (!isPlaying || isCompleted || tiles.length === 0) return;

    // Nếu toàn bộ mảnh đều trùng khớp vị trí chính xác
    const solved = tiles.every((tileId, slotIndex) => tileId === slotIndex);
    if (solved) {
      setIsCompleted(true);
      setIsPlaying(false);
      soundEngine.playWin();
      triggerConfetti();

      const timeSec = parseFloat((elapsedMs / 1000).toFixed(1));
      const isWinner = currentRank === 1;

      // Cập nhật người chơi về đích
      setCompetitors((prev) =>
        prev.map((c) => (c.isSelf ? { ...c, progress: 100, finishedTime: timeSec } : c))
      );

      // Thông báo hoàn thành trận đấu
      onFinish({
        timeSeconds: timeSec,
        rank: currentRank,
        isWinner,
        score: Math.max(100, Math.round(10000 / (timeSec + 1))),
      });
    }
  }, [tiles, isPlaying, isCompleted, elapsedMs, currentRank, triggerConfetti]);

  // 7. THỰC HIỆN ĐỔI CHỖ 2 MẢNH (SWAP TILES)
  const swapSlots = (slotA: number, slotB: number) => {
    if (slotA === slotB || isCompleted) return;

    setTiles((prev) => {
      const next = [...prev];
      const temp = next[slotA];
      next[slotA] = next[slotB];
      next[slotB] = temp;

      // Kiểm tra xem sau khi đổi, mảnh nào vào đúng vị trí không
      if (next[slotA] === slotA || next[slotB] === slotB) {
        soundEngine.playCorrectSnap();
      } else {
        soundEngine.playSwap();
      }

      return next;
    });

    setMovesCount((m) => m + 1);
    setSelectedSlot(null);
    setDraggedSlot(null);
  };

  // Click để chọn hoặc đổi chỗ
  const handleSlotClick = (slotIndex: number) => {
    if (isCompleted) return;

    if (selectedSlot === null) {
      setSelectedSlot(slotIndex);
      soundEngine.playSelect();
    } else if (selectedSlot === slotIndex) {
      setSelectedSlot(null);
    } else {
      swapSlots(selectedSlot, slotIndex);
    }
  };

  // Kéo thả (HTML5 Drag & Drop)
  const handleDragStart = (e: React.DragEvent, slotIndex: number) => {
    if (isCompleted) return;
    setDraggedSlot(slotIndex);
    e.dataTransfer.setData("text/plain", slotIndex.toString());
    soundEngine.playSelect();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetSlot: number) => {
    e.preventDefault();
    if (draggedSlot !== null) {
      swapSlots(draggedSlot, targetSlot);
    }
  };

  // Định dạng thời gian mm:ss.s
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    const tenths = Math.floor((ms % 1000) / 100);
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}.${tenths}s`;
  };

  return (
    <div className="relative w-full text-white space-y-4 select-none">
      {/* Canvas Confetti chúc mừng */}
      <canvas
        ref={confettiCanvasRef}
        className="absolute inset-0 z-30 pointer-events-none w-full h-full"
      />

      {/* =========================================================================
          THANH ĐIỀU KHIỂN & TRẠNG THÁI TRẬN ĐẤU
          ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 backdrop-blur-md">
        {/* Thông tin sản phẩm & Shop */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0">
            <Puzzle size={22} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-orange-400">
                Mảnh Ghép Thần Tốc
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Flame size={10} /> 15 Người Đua
              </span>
            </div>
            <h4 className="text-sm font-bold text-white truncate max-w-[220px] sm:max-w-xs" title={room.title}>
              {room.title}
            </h4>
          </div>
        </div>

        {/* Đồng hồ bấm giờ & Thứ hạng */}
        <div className="flex items-center gap-2.5">
          {/* Thời gian */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs font-bold text-amber-400 shadow-inner">
            <Timer size={14} className="text-amber-400 animate-spin" style={{ animationDuration: "3s" }} />
            <span>{formatTime(elapsedMs)}</span>
          </div>

          {/* Xếp hạng trực tiếp */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/15 border border-orange-500/30 text-xs font-bold text-orange-400">
            <Crown size={14} className="text-orange-400" />
            <span>Hạng: #{currentRank}/15</span>
          </div>

          {/* Bật/tắt âm thanh */}
          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={soundEnabled ? "Tắt âm thanh" : "Bật âm thanh"}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} className="text-slate-500" />}
          </button>

          {/* Nút Bỏ Cuộc giữa chừng dùng SweetAlert2 */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              showForfeitAlert(room.title, room.storeName).then((result) => {
                if (result.isConfirmed) {
                  onQuit?.();
                }
              });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white font-bold text-xs transition-all cursor-pointer shadow-sm active:scale-95 group"
            title="Bỏ cuộc trận đấu (Mất Thẻ không hoàn lại)"
          >
            <Flag size={14} className="text-rose-400 group-hover:text-white transition-colors" />
            <span>Bỏ Cuộc</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          TIẾN ĐỘ GHÉP & CHỌN ĐỘ KHÓ & NÚT XEM ẢNH GỐC
          ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Tiến độ người chơi */}
        <div className="flex-1 min-w-[200px] space-y-1">
          <div className="flex items-center justify-between font-semibold text-slate-300">
            <span>Tiến độ ghép: <strong className="text-emerald-400">{correctCount}/{totalTiles} mảnh</strong> ({userProgress}%)</span>
            <span className="text-[11px] text-slate-400">{movesCount} lượt di chuyển</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 transition-all duration-300 rounded-full"
              style={{ width: `${userProgress}%` }}
            />
          </div>
        </div>

        {/* Thông tin độ khó cố định của trận đấu & Nút xem ảnh gốc */}
        <div className="flex items-center gap-2">
          {/* Huy hiệu độ khó được chọn ngẫu nhiên cho trận này */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs font-bold shadow-sm">
            {gridSize === 3 && (
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Zap size={14} className="text-emerald-400" />
                <span>Trận đấu: <strong className="text-emerald-300 font-black">9 Mảnh</strong> (3x3 Tốc Độ)</span>
              </span>
            )}
            {gridSize === 4 && (
              <span className="flex items-center gap-1.5 text-amber-400">
                <Puzzle size={14} className="text-amber-400" />
                <span>Trận đấu: <strong className="text-amber-300 font-black">16 Mảnh</strong> (4x4 Tiêu Chuẩn)</span>
              </span>
            )}
            {gridSize === 5 && (
              <span className="flex items-center gap-1.5 text-rose-400">
                <Flame size={14} className="text-rose-400" />
                <span>Trận đấu: <strong className="text-rose-300 font-black">25 Mảnh</strong> (5x5 Cao Thủ)</span>
              </span>
            )}
          </div>

          {/* Nút bật ảnh gốc đối chiếu */}
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
              showPreview
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                : "bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:bg-slate-700"
            }`}
          >
            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showPreview ? "Ẩn mẫu" : "Xem ảnh mẫu"}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          KHU VỰC THI ĐẤU CHÍNH: BẢNG GHÉP VÀ BẢNG XẾP HẠNG 15 NGƯỜI
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CỘT TRÁI: BẢNG MẢNH GHÉP 3D HOẶC ẢNH MẪU ĐỐI CHIẾU */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="relative w-full max-w-[380px] sm:max-w-[420px] aspect-square rounded-3xl p-3 bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-orange-500/40 shadow-2xl shadow-orange-500/10 overflow-hidden">
            
            {/* Lớp hiển thị ảnh mẫu khi bấm "Xem ảnh mẫu" */}
            {showPreview ? (
              <div className="relative w-full h-full rounded-2xl overflow-hidden border border-cyan-500/40 animate-in fade-in zoom-in-95 duration-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={puzzleImage}
                  alt={room.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-center">
                  <p className="text-xs font-bold text-cyan-300">
                    🔍 Ảnh gốc sản phẩm của {room.storeName}
                  </p>
                  <p className="text-[10px] text-slate-300">
                    Hãy ghi nhớ chi tiết để kéo ghép các mảnh về đúng vị trí!
                  </p>
                </div>
              </div>
            ) : (
              /* Lưới ghép ảnh chính */
              <div
                className="w-full h-full grid gap-1.5 rounded-2xl overflow-hidden"
                style={{
                  gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
                }}
              >
                {tiles.map((tileId, slotIndex) => {
                  const targetRow = Math.floor(tileId / gridSize);
                  const targetCol = tileId % gridSize;

                  // Tính toán vị trí background crop chính xác 100%
                  const xPercent = (targetCol / (gridSize - 1)) * 100;
                  const yPercent = (targetRow / (gridSize - 1)) * 100;

                  const isCorrect = tileId === slotIndex;
                  const isSelected = selectedSlot === slotIndex;
                  const isDragged = draggedSlot === slotIndex;

                  return (
                    <div
                      key={`slot_${slotIndex}`}
                      draggable={!isCompleted}
                      onDragStart={(e) => handleDragStart(e, slotIndex)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, slotIndex)}
                      onClick={() => handleSlotClick(slotIndex)}
                      className={`relative w-full h-full rounded-xl overflow-hidden cursor-pointer transition-all duration-150 border-2 ${
                        isSelected
                          ? "border-amber-400 ring-4 ring-amber-400/50 scale-95 z-20 shadow-xl"
                          : isCorrect
                          ? "border-emerald-500/80 shadow-md shadow-emerald-500/20"
                          : "border-slate-700/80 hover:border-orange-400/80 hover:scale-[1.02] z-10"
                      } ${isDragged ? "opacity-40" : "opacity-100"}`}
                      style={{
                        backgroundImage: `url(${puzzleImage})`,
                        backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
                        backgroundPosition: `${xPercent}% ${yPercent}%`,
                      }}
                      title={`Mảnh số ${tileId + 1} ${isCorrect ? " (Đã đúng vị trí)" : ""}`}
                    >
                      {/* Huy hiệu nhỏ báo mảnh đã vào đúng vị trí */}
                      {isCorrect && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500/90 text-white flex items-center justify-center shadow-md">
                          <CheckCircle2 size={11} />
                        </div>
                      )}

                      {/* Số thứ tự mảnh mờ nhẹ hỗ trợ người chơi */}
                      <div className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-black/60 backdrop-blur-xs text-[9px] font-mono text-slate-300">
                        {tileId + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Hướng dẫn thao tác kéo thả hoặc chạm đổi chỗ */}
          <p className="mt-3 text-[11px] text-slate-400 flex items-center gap-1.5 text-center">
            <HelpCircle size={13} className="text-orange-400 shrink-0" />
            <span>
              <strong>Cách chơi:</strong> Kéo thả hoặc bấm chọn 2 mảnh bất kỳ để đổi chỗ cho nhau cho đến khi bức tranh hoàn chỉnh!
            </span>
          </p>
        </div>

        {/* CỘT PHẢI: BẢNG XẾP HẠNG TRỰC TIẾP 15 NGƯỜI ĐUA NHAU */}
        <div className="lg:col-span-5 space-y-3">
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2.5">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-orange-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Đua Tốc Độ (15 Người)
                </h4>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                Live Tournament
              </span>
            </div>

            {/* Danh sách 15 người chơi và thanh tiến độ */}
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {[...competitors]
                .sort((a, b) => {
                  if (a.finishedTime !== null && b.finishedTime !== null) {
                    return a.finishedTime - b.finishedTime;
                  }
                  if (a.finishedTime !== null) return -1;
                  if (b.finishedTime !== null) return 1;
                  return b.progress - a.progress;
                })
                .map((comp, rankIdx) => {
                  const isTop1 = rankIdx === 0;
                  const isTop2 = rankIdx === 1;
                  const isTop3 = rankIdx === 2;

                  return (
                    <div
                      key={comp.id}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                        comp.isSelf
                          ? "bg-orange-500/20 border-orange-500/50 shadow-md shadow-orange-500/10"
                          : "bg-slate-900/60 border-slate-800"
                      }`}
                    >
                      {/* Vị trí xếp hạng */}
                      <div className="w-5 text-center font-black text-xs">
                        {isTop1 ? (
                          <span className="text-amber-400 font-black">🥇</span>
                        ) : isTop2 ? (
                          <span className="text-slate-300 font-black">🥈</span>
                        ) : isTop3 ? (
                          <span className="text-amber-600 font-black">🥉</span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">#{rankIdx + 1}</span>
                        )}
                      </div>

                      {/* Avatar */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          comp.isSelf
                            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-black shadow-sm font-black"
                            : "bg-slate-700 text-slate-300"
                        }`}
                      >
                        {comp.avatar}
                      </div>

                      {/* Tên & Thanh tiến độ */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span
                            className={`truncate font-bold ${
                              comp.isSelf ? "text-orange-300" : "text-slate-300"
                            }`}
                          >
                            {comp.name} {comp.isSelf && "(Bạn)"}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-slate-400 shrink-0">
                            {comp.finishedTime !== null
                              ? `✓ ${comp.finishedTime}s`
                              : `${comp.progress}%`}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-950 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              comp.isSelf
                                ? "bg-gradient-to-r from-orange-500 to-amber-400"
                                : comp.progress >= 100
                                ? "bg-emerald-500"
                                : "bg-slate-600"
                            }`}
                            style={{ width: `${comp.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Banner giá trị Marketing ghi nhớ sản phẩm */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border border-orange-500/20 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <Sparkles size={14} />
              <span>Phần thưởng giá trị 0đ từ Shop:</span>
            </div>
            <p className="text-slate-300 leading-snug">
              Hoàn thành nhanh nhất để mang về <strong>{room.title}</strong> trị giá{" "}
              <strong className="text-orange-400">{room.productValue.toLocaleString("vi-VN")}đ</strong>!
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MÀN HÌNH HOÀN THÀNH KHI GHÉP XONG 100%
          ========================================================================= */}
      {isCompleted && (
        <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-800 to-slate-950 border-2 border-amber-500/60 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-300 mt-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-xl shadow-orange-500/30 animate-bounce">
            <Trophy size={36} />
          </div>

          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30">
              {currentRank === 1 ? "🏆 QUÁN QUÂN THẦN TỐC!" : `🥈 HOÀN THÀNH HẠNG #${currentRank}`}
            </span>
            <h3 className="text-2xl font-black text-white mt-1">
              {currentRank === 1
                ? "Chúc mừng bạn đã về đích đầu tiên!"
                : `Tuyệt vời! Bạn hoàn thành trong ${formatTime(elapsedMs)}`}
            </h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto">
              Bạn đã ghép chính xác toàn bộ {totalTiles} mảnh trong{" "}
              <strong className="text-orange-400">{formatTime(elapsedMs)}</strong> với{" "}
              <strong className="text-amber-400">{movesCount} lượt di chuyển</strong>.
            </p>
          </div>

          {/* Nút hành động hoàn tất */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => initAndShuffleBoard(gridSize)}
              className="px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer"
            >
              Chơi Lại Trận Mới
            </button>
            <button
              type="button"
              onClick={() => {
                onFinish({
                  timeSeconds: parseFloat((elapsedMs / 1000).toFixed(1)),
                  rank: currentRank,
                  isWinner: currentRank === 1,
                  score: 100,
                });
              }}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
            >
              Xác Nhận Kết Quả
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default JigsawGame;

