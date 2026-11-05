"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { theaterAudio } from "./theaterAudio";

export type CameraViewMode = "overview" | "stage" | "my_seat" | "free";
export type StagePhase = "COUNTDOWN" | "NPC_WALKOUT" | "UNVEIL" | "BIDDING" | "ENDED";

export interface MysteryItem {
  id: string;
  name: string;
  category: string;
  estimatedValue: number;
  startBid: number;
  imageUrl: string;
  description: string;
}

interface Theater3DSceneProps {
  currentBid: number;
  highestBidderName?: string;
  isUserHighestBidder?: boolean;
  phase: StagePhase;
  revealedItem: MysteryItem | null;
  cameraMode: CameraViewMode;
  onCameraModeChange?: (mode: CameraViewMode) => void;
  triggerBidEffect?: number;
  lastBidAmount?: number;
  calloutStep?: number; // 0 (none), 1 (lần 1), 2 (lần 2), 3 (lần 3)
  emojiReaction?: { type: string; timestamp: number } | null;
  isLeaving?: boolean;
  onLeaveComplete?: () => void;
  userName?: string;
}

export default function Theater3DScene({
  currentBid,
  highestBidderName = "Hệ thống Sàn",
  isUserHighestBidder = false,
  phase,
  revealedItem,
  cameraMode,
  onCameraModeChange,
  triggerBidEffect,
  lastBidAmount = 500000,
  calloutStep = 0,
  emojiReaction,
  isLeaving = false,
  onLeaveComplete,
  userName = "Bạn",
}: Theater3DSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  // References Three.js Core
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Dynamic prop refs để animation loop Three.js truy cập liên tục
  const cameraModeRef = useRef(cameraMode);
  cameraModeRef.current = cameraMode;

  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const currentBidRef = useRef(currentBid);
  currentBidRef.current = currentBid;

  const highestBidderRef = useRef(highestBidderName);
  highestBidderRef.current = highestBidderName;

  const calloutStepRef = useRef(calloutStep);
  calloutStepRef.current = calloutStep;

  const onLeaveCompleteRef = useRef(onLeaveComplete);
  onLeaveCompleteRef.current = onLeaveComplete;

  const revealedItemRef = useRef(revealedItem);
  revealedItemRef.current = revealedItem;

  // 3 Màn hình LED điện tử phía sau bục đấu giá
  const leftLedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const leftLedTextureRef = useRef<THREE.CanvasTexture | null>(null);

  const centerLedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const centerLedTextureRef = useRef<THREE.CanvasTexture | null>(null);

  const rightLedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rightLedTextureRef = useRef<THREE.CanvasTexture | null>(null);

  // Hình ảnh món đồ hiển thị trên màn hình LED trung tâm
  const productImageRef = useRef<HTMLImageElement | null>(null);

  // Bảng giơ giá (Paddle): Texture sắc nét
  const paddleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const paddleTextureRef = useRef<THREE.CanvasTexture | null>(null);

  // Cửa hậu trường (Bên trái phòng)
  const leftDoorLeafRef = useRef<THREE.Group | null>(null);
  const rightDoorLeafRef = useRef<THREE.Group | null>(null);

  // Mô hình 3D Người chơi (Realistic Human User chuyên nghiệp)
  const userRootRef = useRef<THREE.Group | null>(null);
  const userPelvisRef = useRef<THREE.Group | null>(null);
  const userLeftHipRef = useRef<THREE.Group | null>(null);
  const userRightHipRef = useRef<THREE.Group | null>(null);
  const userLeftKneeRef = useRef<THREE.Group | null>(null);
  const userRightKneeRef = useRef<THREE.Group | null>(null);
  const userLeftShoulderRef = useRef<THREE.Group | null>(null);
  const userRightShoulderRef = useRef<THREE.Group | null>(null);
  const userLeftElbowRef = useRef<THREE.Group | null>(null);
  const userRightElbowRef = useRef<THREE.Group | null>(null);
  const userRightHandRef = useRef<THREE.Mesh | null>(null);
  const userPaddleGroupRef = useRef<THREE.Group | null>(null);

  // Mô hình 3D Người điều phối (Realistic Human Auctioneer - Image 4)
  const npcGroupRef = useRef<THREE.Group | null>(null);
  const npcLeftArmRef = useRef<THREE.Group | null>(null);
  const npcRightArmRef = useRef<THREE.Group | null>(null);
  const npcRightElbowRef = useRef<THREE.Group | null>(null);
  const npcGavelRef = useRef<THREE.Group | null>(null);
  const npcSpeechSpriteRef = useRef<THREE.Sprite | null>(null);

  const emojiParticlesRef = useRef<{ sprite: THREE.Sprite; vy: number; life: number }[]>([]);

  // Tương tác Camera chuột (Góc tự do 360 độ Panorama ngắm toàn cảnh nhà hát & trần nhà)
  const isDraggingRef = useRef(false);
  const prevMousePos = useRef({ x: 0, y: 0 });
  const cameraAngles = useRef({ yaw: 0.0, pitch: 0.08, dist: 5.5, fov: 60 });
  const targetCameraAngles = useRef({ yaw: 0.0, pitch: 0.08, dist: 5.5, fov: 60 });

  // Tọa độ ghế ngồi User: Hàng 2 bên trái sát lối đi trung tâm (z = 1.9, y = 0.12, x = -1.1)
  const USER_SEAT_POS = new THREE.Vector3(-1.1, 0.12, 1.9);
  const DOOR_POS = new THREE.Vector3(-4.8, 0, 3.6);

  // State Controller của User: "DOOR_OPEN" | "WALKING_IN" | "TURNING_AND_SITTING" | "IDLE" | "BIDDING" | "LEAVING"
  const userStateRef = useRef<"DOOR_OPEN" | "WALKING_IN" | "TURNING_AND_SITTING" | "IDLE" | "BIDDING" | "LEAVING">("DOOR_OPEN");
  const userProgressRef = useRef(0);
  const leaveProgressRef = useRef(0);

  // Pháo hoa màn hình LED phải
  const fireworksParticles = useRef<{ x: number; y: number; vx: number; vy: number; color: string; life: number }[]>([]);

  // =========================================================================
  // 1. CẬP NHẬT CANVAS MẶT BẢNG ĐẤU GIÁ (AUCTION PADDLE REAL-TIME)
  // =========================================================================
  const updatePaddleCanvas = useCallback((amount: number) => {
    const canvas = paddleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#12151e";
    ctx.fillRect(0, 0, 512, 512);

    // Khung kim loại viền vàng kim sang trọng
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 20;
    ctx.strokeRect(16, 16, 480, 480);

    ctx.strokeStyle = "#ff7700";
    ctx.lineWidth = 5;
    ctx.strokeRect(34, 34, 444, 444);

    // Tiêu đề
    ctx.fillStyle = "#ffcc00";
    ctx.font = "bold 44px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ĐẶT GIÁ // BID", 256, 115);

    // Dải phân cách
    ctx.strokeStyle = "#445566";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 145);
    ctx.lineTo(452, 145);
    ctx.stroke();

    // Số tiền hiển thị lớn, sắc nét
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 78px monospace";
    ctx.fillText(`${(amount / 1000).toLocaleString("vi-VN")}k`, 256, 255);

    // Đơn vị
    ctx.fillStyle = "#00ffcc";
    ctx.font = "bold 42px sans-serif";
    ctx.fillText("XU ĐIỂM", 256, 355);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "26px sans-serif";
    ctx.fillText(`(${amount.toLocaleString("vi-VN")} Xu)`, 256, 420);

    if (paddleTextureRef.current) paddleTextureRef.current.needsUpdate = true;
  }, []);

  // =========================================================================
  // 2. CẬP NHẬT 3 MÀN HÌNH LED PHÍA SAU BỤC ĐẤU GIÁ
  //    - TRÁI: Bảng giá & Người đấu liên tục thay đổi (Bỏ lịch sử giá)
  //    - GIỮA: Hình ảnh món đồ đấu giá
  //    - PHẢI: Bảng hiển thị người chiến thắng
  // =========================================================================
  const updateLedScreens = useCallback((
    curPhase: StagePhase,
    curBid: number,
    winnerName: string,
    cStep: number
  ) => {
    // --- 1. MÀN HÌNH BÊN TRÁI: MỨC GIÁ & NGƯỜI ĐẤU LIÊN TỤC THAY ĐỔI (BỎ LỊCH SỬ GIÁ) ---
    const leftCanvas = leftLedCanvasRef.current;
    if (leftCanvas) {
      const ctx = leftCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#080a10";
        ctx.fillRect(0, 0, 512, 512);

        // Khung viền LED hổ phách
        ctx.strokeStyle = curPhase === "ENDED" ? "#ffd700" : "#d97706";
        ctx.lineWidth = 10;
        ctx.strokeRect(6, 6, 500, 500);

        // Header: Chấm đỏ TRỰC TIẾP
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(42, 45, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 22px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText("TRỰC TIẾP // LIVE BID", 60, 53);

        // Tiêu đề: MỨC GIÁ HIỆN TẠI
        ctx.fillStyle = "#fbbf24";
        ctx.font = "bold 32px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("MỨC GIÁ HIỆN TẠI", 256, 110);

        // Con số giá vàng kim khổng lồ
        ctx.fillStyle = "#ffffff";
        ctx.font = "900 86px monospace";
        ctx.fillText(`${(curBid / 1000).toLocaleString("vi-VN")}k`, 256, 205);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "24px sans-serif";
        ctx.fillText(`(${curBid.toLocaleString("vi-VN")} Xu)`, 256, 245);

        // Khung người ra giá cao nhất (liên tục cập nhật khi có người trả giá)
        ctx.fillStyle = "#141923";
        ctx.beginPath();
        ctx.roundRect(30, 275, 452, 110, 16);
        ctx.fill();
        ctx.strokeStyle = "#384152";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#94a3b8";
        ctx.font = "bold 20px sans-serif";
        ctx.fillText("NGƯỜI RA GIÁ CAO NHẤT:", 256, 310);

        ctx.fillStyle = "#4ade80";
        ctx.font = "900 36px sans-serif";
        ctx.fillText(`[${winnerName}]`, 256, 360);

        // Trạng thái đếm nhịp
        ctx.font = "bold 28px sans-serif";
        if (curPhase === "ENDED") {
          ctx.fillStyle = "#ffd700";
          ctx.fillText("🏆 ĐÃ CHỐT ĐƠN THÀNH CÔNG!", 256, 445);
        } else if (cStep === 1) {
          ctx.fillStyle = "#4ade80";
          ctx.fillText(`⚡ ${(curBid / 1000).toLocaleString("vi-VN")}k LẦN 1...`, 256, 445);
        } else if (cStep === 2) {
          ctx.fillStyle = "#facc15";
          ctx.fillText(`⚡ ${(curBid / 1000).toLocaleString("vi-VN")}k LẦN 2...!!`, 256, 445);
        } else if (cStep === 3) {
          ctx.fillStyle = "#ef4444";
          ctx.fillText(`🔨 ${(curBid / 1000).toLocaleString("vi-VN")}k LẦN 3... SẮP GÕ BÚA!`, 256, 445);
        } else {
          ctx.fillStyle = "#4ade80";
          ctx.fillText("• ĐANG CHỜ RA GIÁ •", 256, 445);
        }

        if (leftLedTextureRef.current) leftLedTextureRef.current.needsUpdate = true;
      }
    }

    // --- 2. MÀN HÌNH Ở GIỮA: HÌNH ẢNH MÓN ĐỒ VÀ THÔNG TIN CHI TIẾT ---
    const centerCanvas = centerLedCanvasRef.current;
    if (centerCanvas) {
      const ctx = centerCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#05070c";
        ctx.fillRect(0, 0, 1024, 512);

        // Khung viền LED vàng kim sang trọng
        ctx.strokeStyle = "#ffd700";
        ctx.lineWidth = 12;
        ctx.strokeRect(6, 6, 1012, 500);

        // Nửa bên trái: Khung hiển thị hình ảnh món đồ
        ctx.fillStyle = "#0f131d";
        ctx.beginPath();
        ctx.roundRect(35, 35, 440, 440, 20);
        ctx.fill();
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 3;
        ctx.stroke();

        const img = productImageRef.current;
        if (img && img.complete && img.naturalWidth > 0) {
          try {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(45, 45, 420, 420, 16);
            ctx.clip();
            ctx.drawImage(img, 45, 45, 420, 420);
            ctx.restore();
          } catch {}
        } else {
          // Fallback khi ảnh đang tải
          ctx.fillStyle = "#1e2433";
          ctx.beginPath();
          ctx.roundRect(45, 45, 420, 420, 16);
          ctx.fill();
          ctx.fillStyle = "#ffd700";
          ctx.font = "bold 64px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("📦", 255, 235);
          ctx.fillStyle = "#94a3b8";
          ctx.font = "bold 26px sans-serif";
          ctx.fillText("VẬT PHẨM ĐẤU GIÁ", 255, 295);
        }

        // Nửa bên phải: Thông tin món đồ đang đấu giá
        ctx.textAlign = "left";

        ctx.fillStyle = "#f59e0b";
        ctx.font = "bold 22px sans-serif";
        ctx.fillText("✨ VẬT PHẨM ĐỘC QUYỀN SÀN NEXLOOT", 515, 80);

        const item = revealedItemRef.current;
        const itemName = item?.name || "Bàn Phím Cơ Custom Keychron Q1 Pro Full Nhôm";
        ctx.fillStyle = "#ffffff";
        ctx.font = "900 34px sans-serif";

        if (itemName.length > 28) {
          ctx.fillText(itemName.slice(0, 26) + "...", 515, 135);
        } else {
          ctx.fillText(itemName, 515, 135);
        }

        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(515, 165);
        ctx.lineTo(975, 165);
        ctx.stroke();

        // Danh mục & Tình trạng
        ctx.fillStyle = "#94a3b8";
        ctx.font = "24px sans-serif";
        ctx.fillText("🏷️ Danh mục:", 515, 215);
        ctx.fillStyle = "#38bdf8";
        ctx.font = "bold 24px sans-serif";
        ctx.fillText(item?.category || "Thiết bị Gaming cao cấp", 680, 215);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "24px sans-serif";
        ctx.fillText("💰 Ước tính:", 515, 270);
        ctx.fillStyle = "#4ade80";
        ctx.font = "bold 26px monospace";
        ctx.fillText(`${(item?.estimatedValue ?? 4200000).toLocaleString("vi-VN")}đ`, 680, 270);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "24px sans-serif";
        ctx.fillText("⚡ Khởi điểm:", 515, 325);
        ctx.fillStyle = "#fbbf24";
        ctx.font = "bold 26px monospace";
        ctx.fillText(`${(item?.startBid ?? 500000).toLocaleString("vi-VN")} Xu`, 680, 325);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "24px sans-serif";
        ctx.fillText("🛡️ Cam kết:", 515, 380);
        ctx.fillStyle = "#a78bfa";
        ctx.font = "bold 24px sans-serif";
        ctx.fillText("Nguyên seal 100% tài trợ", 680, 380);

        ctx.fillStyle = "#64748b";
        ctx.font = "italic 20px sans-serif";
        ctx.fillText("• Giao dịch minh bạch - Trao thưởng ngay sau phiên •", 515, 450);

        if (centerLedTextureRef.current) centerLedTextureRef.current.needsUpdate = true;
      }
    }

    // --- 3. MÀN HÌNH BÊN PHẢI: BẢNG HIỂN THỊ NGƯỜI CHIẾN THẮNG ---
    const rightCanvas = rightLedCanvasRef.current;
    if (rightCanvas) {
      const ctx = rightCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#080a10";
        ctx.fillRect(0, 0, 512, 512);

        ctx.strokeStyle = curPhase === "ENDED" ? "#ffd700" : "#3b4252";
        ctx.lineWidth = 10;
        ctx.strokeRect(6, 6, 500, 500);

        // Hiệu ứng pháo hoa nền nếu đã kết thúc
        if (curPhase === "ENDED" || fireworksParticles.current.length > 0) {
          fireworksParticles.current.forEach((p) => {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
          });
        }

        ctx.textAlign = "center";

        if (curPhase === "ENDED") {
          ctx.fillStyle = "#ffd700";
          ctx.font = "bold 32px sans-serif";
          ctx.fillText("🏆 BẢNG VINH DANH 🏆", 256, 75);

          ctx.fillStyle = "#facc15";
          ctx.font = "900 38px sans-serif";
          ctx.fillText("NGƯỜI CHIẾN THẮNG:", 256, 160);

          ctx.fillStyle = "#ffffff";
          ctx.font = "900 44px sans-serif";
          ctx.fillText(`[${winnerName}]`, 256, 240);

          ctx.fillStyle = "#4ade80";
          ctx.font = "900 56px monospace";
          ctx.fillText(`${(curBid / 1000).toLocaleString("vi-VN")}k Xu`, 256, 335);

          ctx.fillStyle = "#ffd700";
          ctx.font = "bold 28px sans-serif";
          ctx.fillText("🎆 CHỐT GIÁ THÀNH CÔNG! 🎆", 256, 425);
        } else {
          ctx.fillStyle = "#38bdf8";
          ctx.font = "bold 30px sans-serif";
          ctx.fillText("👑 BẢNG DẪN ĐẦU 👑", 256, 75);

          ctx.fillStyle = "#fbbf24";
          ctx.font = "bold 32px sans-serif";
          ctx.fillText("NGƯỜI ĐANG DẪN ĐẦU:", 256, 160);

          ctx.fillStyle = "#ffffff";
          ctx.font = "900 42px sans-serif";
          ctx.fillText(`[${winnerName}]`, 256, 240);

          ctx.fillStyle = "#4ade80";
          ctx.font = "900 52px monospace";
          ctx.fillText(`${(curBid / 1000).toLocaleString("vi-VN")}k Xu`, 256, 335);

          ctx.fillStyle = "#94a3b8";
          ctx.font = "24px sans-serif";
          ctx.fillText("Bấm 'ĐẶT GIÁ' để vượt qua!", 256, 425);
        }

        if (rightLedTextureRef.current) rightLedTextureRef.current.needsUpdate = true;
      }
    }
  }, []);

  useEffect(() => {
    updateLedScreens(phase, currentBid, highestBidderName, calloutStep);
  }, [phase, currentBid, highestBidderName, calloutStep, updateLedScreens]);

  // Load ảnh sản phẩm thật lên màn hình LED trung tâm
  useEffect(() => {
    if (!revealedItem?.imageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = revealedItem.imageUrl;
    img.onload = () => {
      productImageRef.current = img;
      updateLedScreens(phaseRef.current, currentBidRef.current, highestBidderRef.current || "Hệ thống Sàn", calloutStepRef.current);
    };
  }, [revealedItem, updateLedScreens]);

  useEffect(() => {
    updatePaddleCanvas(lastBidAmount);
  }, [lastBidAmount, updatePaddleCanvas]);

  // Sinh hạt pháo hoa khi kết thúc phiên đấu
  useEffect(() => {
    if (phase === "ENDED") {
      const colors = ["#ff3366", "#ffd700", "#00ffcc", "#ff9900", "#cc33ff", "#ffffff"];
      fireworksParticles.current = Array.from({ length: 60 }).map(() => ({
        x: 256 + (Math.random() - 0.5) * 200,
        y: 250 + (Math.random() - 0.5) * 160,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0,
      }));
    }
  }, [phase]);


  // Thả emoji
  const createEmojiSprite = (emoji: string) => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.font = "72px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(emoji, 64, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(0.85, 0.85, 1);
    return sprite;
  };

  useEffect(() => {
    if (!emojiReaction || !sceneRef.current) return;
    const scene = sceneRef.current;
    const emojiMap: Record<string, string> = { clap: "👏", heart: "❤️", shock: "😱", fire: "🔥" };
    const emojiChar = emojiMap[emojiReaction.type] || "👏";
    const sprite = createEmojiSprite(emojiChar);
    sprite.position.copy(USER_SEAT_POS).add(new THREE.Vector3(0, 1.6, 0));
    scene.add(sprite);

    emojiParticlesRef.current.push({
      sprite,
      vy: 0.035 + Math.random() * 0.02,
      life: 1.0,
    });

    if (emojiReaction.type === "clap") {
      theaterAudio.playCrowdApplause();
    }
  }, [emojiReaction]);

  // Giai đoạn 2: Đặt giá (Place Bid) -> Người chơi vươn vai dơ cao bảng đấu giá
  useEffect(() => {
    if (!triggerBidEffect) return;

    theaterAudio.playPaddleDing();
    userStateRef.current = "BIDDING";

    const timer = setTimeout(() => {
      if (userStateRef.current === "BIDDING") {
        userStateRef.current = "IDLE";
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [triggerBidEffect]);

  // Giai đoạn 4: Rời phòng (Leave Room)
  useEffect(() => {
    if (isLeaving) {
      userStateRef.current = "LEAVING";
      leaveProgressRef.current = 0;
    }
  }, [isLeaving]);

  useEffect(() => {
    if (phase === "NPC_WALKOUT") {
      theaterAudio.playDrumRoll();
    } else if (phase === "UNVEIL") {
      theaterAudio.playRevealFanfare();
    } else if (phase === "ENDED") {
      theaterAudio.playGavelBang();
      theaterAudio.playCrowdApplause();
    }
  }, [phase]);

  // =========================================================================
  // KHỞI TẠO SCENE 3D: KHÔNG GIAN GỖ CAO CẤP GIỐNG HỆT IMAGE 4
  // =========================================================================
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animId: number;
    const width = container.clientWidth || 900;
    const height = container.clientHeight || 550;

    // --- SCENE & BACKGROUND ẤM ÁP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x161311);
    sceneRef.current = scene;

    // --- CAMERA: GÓC NHÌN RỘNG TOÀN CẢNH ĐẠI SẢNH NHÀ HÁT LỚN HÀ NỘI ---
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 120);
    // Vị trí camera: đặt lùi ra sau và nâng cao hơn để thu trọn không gian nhà hát bao la, bề thế
    camera.position.set(-0.6, 3.2, 6.8);
    camera.lookAt(0, 1.9, -1.8);
    cameraRef.current = camera;

    // --- RENDERER ---
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05; // Độ sáng cân bằng chuẩn ACESFilmic, loại bỏ hoàn toàn cháy sáng
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // =========================================================================
    // HỆ THỐNG ÁNH SÁNG SÂN KHẤU ẤM ÁP CÂN BẰNG
    // =========================================================================
    const ambientLight = new THREE.AmbientLight(0xffebd2, 0.85);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffecd6, 0x241812, 0.55);
    scene.add(hemiLight);

    // Giàn đèn chiếu Spotlight trên trần sân khấu (Ceiling Light Truss)
    const trussBar = new THREE.Mesh(
      new THREE.BoxGeometry(10, 0.08, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x111114, metalness: 0.9, roughness: 0.2 })
    );
    trussBar.position.set(0, 4.8, -1.0);
    scene.add(trussBar);

    // 4 Đèn rọi Spotlight gắn trên giàn rọi xuống bục đấu giá
    const spotPositions = [-2.6, -0.9, 0.9, 2.6];
    spotPositions.forEach((sx) => {
      // Vỏ đèn rọi hình ống kim loại
      const spotHousing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.14, 0.3, 16),
        new THREE.MeshStandardMaterial({ color: 0x1e1e24, metalness: 0.8, roughness: 0.3 })
      );
      spotHousing.position.set(sx, 4.65, -1.0);
      spotHousing.rotation.x = Math.PI / 6;
      scene.add(spotHousing);

      // Thấu kính đèn phát sáng vàng ấm
      const spotLens = new THREE.Mesh(
        new THREE.CircleGeometry(0.09, 16),
        new THREE.MeshBasicMaterial({ color: 0xfff6dd })
      );
      spotLens.position.set(sx, 4.52, -0.93);
      spotLens.rotation.x = Math.PI / 6;
      scene.add(spotLens);

      // Đèn Spotlight thực tế
      const spotLight = new THREE.SpotLight(0xfff4e0, 130, 20, Math.PI / 5, 0.5, 1.0);
      spotLight.position.set(sx, 4.6, -1.0);
      spotLight.target.position.set(sx * 0.4, 1.4, -2.4);
      scene.add(spotLight);
      scene.add(spotLight.target);
    });

    // Đèn chiếu sáng ấm khu vực khán phòng (Audience Hall Lighting)
    const hallLight = new THREE.DirectionalLight(0xffecd6, 1.1);
    hallLight.position.set(-2.0, 7.0, 4.5);
    hallLight.target.position.set(0, 1.0, 1.5);
    scene.add(hallLight);
    scene.add(hallLight.target);

    // =========================================================================
    // VẬT LIỆU KIẾN TRÚC NHÀ HÁT LỚN HÀ NỘI (HANOI OPERA HOUSE - BEAUX-ARTS)
    // =========================================================================
    const richWoodFloorMat = new THREE.MeshStandardMaterial({
      color: 0x221610,
      roughness: 0.32,
      metalness: 0.12,
    });
    const darkWoodMat = new THREE.MeshStandardMaterial({
      color: 0x1d120c,
      roughness: 0.38,
      metalness: 0.08,
    });
    const panelWoodMat = new THREE.MeshStandardMaterial({
      color: 0x321e14,
      roughness: 0.42,
      metalness: 0.06,
    });
    // Màu vàng đất son hoàng gia Pháp ấm áp đặc trưng của Nhà Hát Lớn Hà Nội (không bao giờ bị trắng xóa)
    const frenchYellowWallMat = new THREE.MeshStandardMaterial({
      color: 0x9e7336,
      roughness: 0.68,
      metalness: 0.05,
    });
    const stageCurtainMat = new THREE.MeshStandardMaterial({
      color: 0x111115,
      roughness: 0.92,
    });
    const royalRedVelvetMat = new THREE.MeshStandardMaterial({
      color: 0x8a0e1c, // Nhung đỏ hoàng gia sang trọng
      roughness: 0.82,
      metalness: 0.04,
    });
    const goldBrassMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.94,
      roughness: 0.16,
    });
    const ivoryMarbleMat = new THREE.MeshStandardMaterial({
      color: 0xd9cebe, // Cẩm thạch ngà ấm cổ điển, chống chói lóa
      roughness: 0.35,
      metalness: 0.08,
    });
    const crystalGlassMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85,
    });
    // Tranh bích họa cổ điển & gấm nhung tường
    const frescoArtMat = new THREE.MeshStandardMaterial({
      color: 0x5a3422, // Tông màu tranh sơn dầu cổ điển ấm áp
      roughness: 0.55,
      metalness: 0.1,
    });
    const wallDamaskMat = new THREE.MeshStandardMaterial({
      color: 0x6e1b24, // Nhung đỏ bordeaux sẫm cổ điển
      roughness: 0.75,
      metalness: 0.05,
    });

    // 1. SÀN PHÒNG GỖ RỘNG LỚN & THẢM ĐỎ HOÀNG GIA TRẢI DÀI
    const floorGeo = new THREE.PlaneGeometry(36, 36);
    const floor = new THREE.Mesh(floorGeo, richWoodFloorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    scene.add(floor);

    // Lối đi thảm đỏ nhung trung tâm rộng rãi nối thẳng lên sân khấu
    const carpetGeo = new THREE.PlaneGeometry(1.4, 14.0);
    const carpet = new THREE.Mesh(carpetGeo, royalRedVelvetMat);
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.set(0, 0.012, 2.5);
    scene.add(carpet);

    // 2. TƯỜNG HẬU, VÒM SÂN KHẤU LỚN & RÈM NHUNG ĐỎ NHÀ HÁT LỚN HÀ NỘI
    const backWallGroup = new THREE.Group();
    backWallGroup.position.set(0, 0, -5.2);
    scene.add(backWallGroup);

    // Phông nền sân khấu đen sâu thẳm rộng lớn
    const stageCurtain = new THREE.Mesh(new THREE.BoxGeometry(26, 10.0, 0.1), stageCurtainMat);
    stageCurtain.position.set(0, 5.0, 0);
    backWallGroup.add(stageCurtain);

    // Ốp gỗ chân tường hậu
    const lowerBackPanel = new THREE.Mesh(new THREE.BoxGeometry(26, 1.4, 0.15), panelWoodMat);
    lowerBackPanel.position.set(0, 0.7, 0.05);
    backWallGroup.add(lowerBackPanel);

    // KHUNG VÒM SÂN KHẤU NHÀ HÁT LỚN (GRAND PROSCENIUM ARCH)
    const prosceniumGroup = new THREE.Group();
    prosceniumGroup.position.set(0, 0, -0.6);
    scene.add(prosceniumGroup);

    // Dầm vòm ngang đỉnh sân khấu viền vàng kim chạm khắc
    const archTopBeam = new THREE.Mesh(new THREE.BoxGeometry(18.0, 0.6, 0.4), panelWoodMat);
    archTopBeam.position.set(0, 7.2, 0);
    prosceniumGroup.add(archTopBeam);

    const archGoldTrim = new THREE.Mesh(new THREE.BoxGeometry(18.1, 0.12, 0.44), goldBrassMat);
    archGoldTrim.position.set(0, 6.9, 0);
    prosceniumGroup.add(archGoldTrim);

    // Phù điêu vương miện âm nhạc mạ vàng ở đỉnh vòm sân khấu
    const crestCenter = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 16, 32), goldBrassMat);
    crestCenter.position.set(0, 7.5, 0.22);
    prosceniumGroup.add(crestCenter);

    // Rèm diềm xếp nếp uốn lượn ở đỉnh vòm (Curtain Valance)
    for (let i = -7; i <= 7; i++) {
      const valanceSwag = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.42, 0.45, 16, 1, false, 0, Math.PI), royalRedVelvetMat);
      valanceSwag.rotation.z = Math.PI;
      valanceSwag.position.set(i * 1.25, 6.7, 0.16);
      prosceniumGroup.add(valanceSwag);
    }

    // 2 Dải rèm nhung đỏ hoàng gia bề thế rủ uốn lượn ở 2 bên cánh gà
    [-7.8, 7.8].forEach((rx) => {
      // Thân rèm nhung đỏ rủ từ đỉnh vòm xuống sàn
      const drapeBody = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 7.2, 20), royalRedVelvetMat);
      drapeBody.position.set(rx, 3.6, 0.2);
      drapeBody.scale.set(0.7, 1, 1.3);
      prosceniumGroup.add(drapeBody);

      // Dây đai vàng thắt eo rèm sang trọng
      const tasselTie = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.07, 12, 24), goldBrassMat);
      tasselTie.position.set(rx, 3.0, 0.2);
      tasselTie.rotation.x = Math.PI / 2;
      prosceniumGroup.add(tasselTie);
    });

    // 3. CÁC HÀNG CỘT TRỤ LA MÃ CỔ ĐIỂN CẨM THẠCH NGÀ (CLASSICAL CORINTHIAN PILLARS)
    const createCorinthianPillar = (px: number, pz: number, pHeight: number = 8.5) => {
      const pillarGroup = new THREE.Group();
      pillarGroup.position.set(px, 0, pz);
      scene.add(pillarGroup);

      // Chân bệ đế vuông phào chỉ vàng
      const basePedestal = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 1.0), panelWoodMat);
      basePedestal.position.y = 0.35;
      pillarGroup.add(basePedestal);

      const baseTrim = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.08, 1.04), goldBrassMat);
      baseTrim.position.y = 0.68;
      pillarGroup.add(baseTrim);

      // Thân cột tròn cẩm thạch ngà cổ điển
      const shaftGeo = new THREE.CylinderGeometry(0.38, 0.44, pHeight - 1.5, 24);
      const shaft = new THREE.Mesh(shaftGeo, ivoryMarbleMat);
      shaft.position.y = 0.7 + (pHeight - 1.5) / 2;
      pillarGroup.add(shaft);

      // Đai vàng chân cột và cổ cột
      const ringGeo = new THREE.TorusGeometry(0.42, 0.045, 12, 24);
      const lowerRing = new THREE.Mesh(ringGeo, goldBrassMat);
      lowerRing.rotation.x = Math.PI / 2;
      lowerRing.position.y = 0.9;
      pillarGroup.add(lowerRing);

      const upperRing = new THREE.Mesh(ringGeo, goldBrassMat);
      upperRing.rotation.x = Math.PI / 2;
      upperRing.position.y = pHeight - 0.85;
      pillarGroup.add(upperRing);

      // Đầu cột hoa văn cổ điển mạ vàng
      const capMesh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.55, 1.0), goldBrassMat);
      capMesh.position.y = pHeight - 0.48;
      pillarGroup.add(capMesh);

      return pillarGroup;
    };

    // Đặt 4 cột trụ cẩm thạch ngà vĩ đại ở 2 bên khán phòng
    [-8.4, 8.4].forEach((cx) => {
      createCorinthianPillar(cx, -0.4, 8.5);
      createCorinthianPillar(cx, 4.2, 8.5);
    });

    // =========================================================================
    // HÀM TẠO ĐÈN NẾN TƯỜNG CỔ ĐIỂN MẠ VÀNG (ANTIQUE BRASS WALL SCONCES)
    // =========================================================================
    const createWallSconce = (parentGroup: THREE.Group, x: number, y: number, z: number) => {
      const sconceGroup = new THREE.Group();
      sconceGroup.position.set(x, y, z);
      parentGroup.add(sconceGroup);

      // Chân đế đồng mạ vàng chạm khắc gắn tường
      const basePlate = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.03, 16), goldBrassMat);
      basePlate.rotation.x = Math.PI / 2;
      sconceGroup.add(basePlate);

      // Tay đỡ uốn cong chữ S mạ vàng cổ điển vươn ra khỏi tường (hướng -Z)
      const armCurve = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.02, 10, 16, Math.PI), goldBrassMat);
      armCurve.rotation.z = Math.PI / 2;
      armCurve.position.set(0, 0.06, -0.10);
      sconceGroup.add(armCurve);

      // 2 Chén nến & thân nến ngà cổ điển
      [-0.13, 0.13].forEach((cx) => {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.028, 0.035, 12), goldBrassMat);
        cup.position.set(cx, 0.14, -0.14);
        sconceGroup.add(cup);

        // Thân nến ngà
        const candleStick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 12), ivoryMarbleMat);
        candleStick.position.set(cx, 0.22, -0.14);
        sconceGroup.add(candleStick);

        // Ngọn lửa nến cam vàng ấm lung linh
        const flame = new THREE.Mesh(
          new THREE.ConeGeometry(0.022, 0.06, 8),
          new THREE.MeshBasicMaterial({ color: 0xffa028 })
        );
        flame.position.set(cx, 0.31, -0.14);
        sconceGroup.add(flame);
      });

      // Ánh sáng nến ấm áp huyền ảo
      const sconceLight = new THREE.PointLight(0xffa834, 16, 3.8);
      sconceLight.position.set(0, 0.26, -0.18);
      sconceGroup.add(sconceLight);
    };

    // 4. TƯỜNG TRÁI & TƯỜNG PHẢI MỞ RỘNG (26M) VỚI BAN CÔNG & HUỲNH PHÀO CHỈ TRANH CỔ ĐIỂN
    // Tách lớp Z rõ ràng (Layered Depth) để loại bỏ 100% Z-Fighting nhấp nháy
    const createSideWall = (sideX: number, isLeft: boolean) => {
      const wallGroup = new THREE.Group();
      wallGroup.position.set(sideX, 0, 0);
      wallGroup.rotation.y = isLeft ? Math.PI / 2 : -Math.PI / 2;
      scene.add(wallGroup);

      // Lớp 0: Tường nền ghép chuẩn xác tại Y = 2.2m (Không đè lên nhau, triệt tiêu 100% vệt nhấp nháy đen)
      const lowerPanel = new THREE.Mesh(new THREE.BoxGeometry(26, 2.2, 0.16), panelWoodMat);
      lowerPanel.position.set(0, 1.1, 0);
      wallGroup.add(lowerPanel);

      const upperWall = new THREE.Mesh(new THREE.BoxGeometry(26, 6.6, 0.16), frenchYellowWallMat);
      upperWall.position.set(0, 5.5, 0);
      wallGroup.add(upperWall);

      // Lớp 1: Phào chỉ viền vàng kim chạy ngang (Mặt trước ở Z = -0.12)
      [2.22, 4.5, 6.8].forEach((trimY) => {
        const wallTrim = new THREE.Mesh(new THREE.BoxGeometry(26.1, 0.08, 0.04), goldBrassMat);
        wallTrim.position.set(0, trimY, -0.10);
        wallGroup.add(wallTrim);
      });

      // Lớp 2: Cột ốp tường (Pilasters) bằng gỗ gụ (Mặt trước ở Z = -0.16)
      const pilasterZPositions = [-6.2, -3.2, -0.6, 2.6, 5.9, 9.2];
      pilasterZPositions.forEach((pz) => {
        const pilasterBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6.4, 0.08), panelWoodMat);
        pilasterBody.position.set(pz, 5.4, -0.12);
        wallGroup.add(pilasterBody);

        // Viền chỉ vàng nổi trên cột (Mặt trước ở Z = -0.18)
        [-0.2, 0.2].forEach((px) => {
          const pTrim = new THREE.Mesh(new THREE.BoxGeometry(0.03, 6.3, 0.02), goldBrassMat);
          pTrim.position.set(pz + px, 5.4, -0.17);
          wallGroup.add(pTrim);
        });

        // Đầu cột hoa văn mạ vàng Corinthian (Mặt trước ở Z = -0.20)
        const pCapital = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.32, 0.12), goldBrassMat);
        pCapital.position.set(pz, 8.5, -0.14);
        wallGroup.add(pCapital);
      });

      // Lớp 3: Các ô huỳnh tranh bích họa cổ điển (Fresco Panels)
      const frescoZPositions = [-4.7, -1.9];
      frescoZPositions.forEach((fz) => {
        // Tầng 1: Khung tranh sơn dầu (Khung ở Z = -0.11, Tranh ở Z = -0.13, Viền ở Z = -0.155)
        const frameT1 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.9, 0.06), darkWoodMat);
        frameT1.position.set(fz, 3.35, -0.11);
        wallGroup.add(frameT1);

        const canvasT1 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.7, 0.04), frescoArtMat);
        canvasT1.position.set(fz, 3.35, -0.13);
        wallGroup.add(canvasT1);

        const trimT1 = new THREE.Mesh(new THREE.BoxGeometry(1.84, 1.74, 0.02), goldBrassMat);
        trimT1.position.set(fz, 3.35, -0.155);
        wallGroup.add(trimT1);

        // Đèn nến tường gắn phía trên tranh
        createWallSconce(wallGroup, fz, 3.65, -0.11);

        // Tầng 2: Ô gấm hoa văn nhung đỏ rượu vang viền phào chỉ vàng
        const frameT2 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.9, 0.06), darkWoodMat);
        frameT2.position.set(fz, 5.65, -0.11);
        wallGroup.add(frameT2);

        const canvasT2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.7, 0.04), wallDamaskMat);
        canvasT2.position.set(fz, 5.65, -0.13);
        wallGroup.add(canvasT2);

        const crestT2 = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.035, 12, 24), goldBrassMat);
        crestT2.position.set(fz, 5.65, -0.16);
        wallGroup.add(crestT2);
      });

      // 3 TẦNG BAN CÔNG NHÀ HÁT LỚN (3-TIER HORSESHOE BALCONIES)
      const balconyTiers = [
        { y: 2.5, depth: 1.4, name: "Tầng 1 (Parterre/Baignoires)" },
        { y: 4.8, depth: 1.5, name: "Tầng 2 (Corbeille/Balcon)" },
        { y: 7.0, depth: 1.3, name: "Tầng 3 (Galerie)" },
      ];

      const balconyZPositions = [0.8, 4.2, 7.5];

      balconyTiers.forEach((tier) => {
        balconyZPositions.forEach((bz) => {
          const bGroup = new THREE.Group();
          bGroup.position.set(bz, tier.y, -tier.depth / 2 - 0.08);
          wallGroup.add(bGroup);

          // Sàn ban công viền gỗ
          const bFloor = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.22, tier.depth), darkWoodMat);
          bGroup.add(bFloor);

          // Lan can ban công màu vàng hoàng gia có phào chỉ mạ vàng
          const bRail = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.78, 0.1), frenchYellowWallMat);
          bRail.position.set(0, 0.48, -tier.depth / 2);
          bGroup.add(bRail);

          // Tay vịn bọc đệm nhung đỏ rượu vang biểu tượng của Nhà hát Lớn
          const bCushion = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 0.18), royalRedVelvetMat);
          bCushion.position.set(0, 0.88, -tier.depth / 2);
          bGroup.add(bCushion);

          // Phù điêu viền vàng kim mặt trước ban công
          const bTrim = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.06, 0.06), goldBrassMat);
          bTrim.position.set(0, 0.12, -tier.depth / 2 - 0.03);
          bGroup.add(bTrim);

          // Rèm nhung đỏ 2 bên buồng ban công
          [-1.18, 1.18].forEach((dx) => {
            const dMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 1.8, 12), royalRedVelvetMat);
            dMesh.position.set(dx, 1.15, -0.15);
            bGroup.add(dMesh);
          });

          // Đèn nến vàng ấm lung linh trong buồng ban công
          const bLight = new THREE.PointLight(0xffb84d, 35, 4.5);
          bLight.position.set(0, 1.25, -0.1);
          bGroup.add(bLight);
        });
      });

      return wallGroup;
    };

    createSideWall(-9.8, true);  // Tường trái mở rộng (cách tâm 9.8m)
    createSideWall(9.8, false); // Tường phải mở rộng (cách tâm 9.8m)

    // CỬA ĐÔI HẬU TRƯỜNG BÊN TRÁI (IMAGE 4)
    const doorFrameGroup = new THREE.Group();
    doorFrameGroup.position.set(-9.68, 0, 3.6);
    doorFrameGroup.rotation.y = Math.PI / 2;
    scene.add(doorFrameGroup);

    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1b120c, roughness: 0.35 });
    const topFrame = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.15, 0.18), frameMat);
    topFrame.position.set(0, 2.5, 0);
    doorFrameGroup.add(topFrame);

    const leftFrame = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.5, 0.18), frameMat);
    leftFrame.position.set(-1.08, 1.25, 0);
    doorFrameGroup.add(leftFrame);

    const rightFrame = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.5, 0.18), frameMat);
    rightFrame.position.set(1.08, 1.25, 0);
    doorFrameGroup.add(rightFrame);

    const leftDoorPivot = new THREE.Group();
    leftDoorPivot.position.set(-1.0, 0, 0);
    doorFrameGroup.add(leftDoorPivot);
    leftDoorLeafRef.current = leftDoorPivot;

    const leftDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.45, 0.08), panelWoodMat);
    leftDoorMesh.position.set(0.5, 1.225, 0);
    leftDoorPivot.add(leftDoorMesh);

    const leftKnob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), goldBrassMat);
    leftKnob.position.set(0.88, 1.1, 0.05);
    leftDoorPivot.add(leftKnob);

    const rightDoorPivot = new THREE.Group();
    rightDoorPivot.position.set(1.0, 0, 0);
    doorFrameGroup.add(rightDoorPivot);
    rightDoorLeafRef.current = rightDoorPivot;

    const rightDoorMesh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.45, 0.08), panelWoodMat);
    rightDoorMesh.position.set(-0.5, 1.225, 0);
    rightDoorPivot.add(rightDoorMesh);

    const rightKnob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), goldBrassMat);
    rightKnob.position.set(-0.88, 1.1, 0.05);
    rightDoorPivot.add(rightKnob);

    // =========================================================================
    // TƯỜNG PHÍA SAU LƯNG KHÁN PHÒNG (KIẾN TRÚC ĐẠI SẢNH BEAUX-ARTS NHÀ HÁT LỚN)
    // Tách tầng độ sâu Z phân cấp nghiêm ngặt (Zero Z-Fighting, Không nhấp nháy)
    // =========================================================================
    const rearWallGroup = new THREE.Group();
    rearWallGroup.position.set(0, 0, 9.8);
    scene.add(rearWallGroup);

    // Lớp 0: Tường nền ghép chuẩn xác tại Y = 2.2m (Không đè lên nhau, triệt tiêu 100% vệt nhấp nháy đen)
    const rearLowerPanel = new THREE.Mesh(new THREE.BoxGeometry(22, 2.2, 0.16), panelWoodMat);
    rearLowerPanel.position.set(0, 1.1, 0);
    rearWallGroup.add(rearLowerPanel);

    const rearUpperWall = new THREE.Mesh(new THREE.BoxGeometry(22, 6.6, 0.16), frenchYellowWallMat);
    rearUpperWall.position.set(0, 5.5, 0);
    rearWallGroup.add(rearUpperWall);

    // Lớp 1: Phào chỉ viền vàng kim chạy ngang (Mặt trước ở Z = -0.12)
    [2.22, 4.5, 6.8].forEach((trimY) => {
      const rearTrim = new THREE.Mesh(new THREE.BoxGeometry(22.1, 0.08, 0.04), goldBrassMat);
      rearTrim.position.set(0, trimY, -0.10);
      rearWallGroup.add(rearTrim);
    });

    // Lớp 2: Cổng đại sảnh đôi hoàng gia (Grand Entrance Portal) ở trung tâm tường sau
    const entranceGroup = new THREE.Group();
    entranceGroup.position.set(0, 0, 0);
    rearWallGroup.add(entranceGroup);

    // Khung bao gỗ gụ chạm trổ (Mặt trước ở Z = -0.22)
    const grandFrame = new THREE.Mesh(new THREE.BoxGeometry(3.6, 3.8, 0.14), darkWoodMat);
    grandFrame.position.set(0, 1.9, -0.15);
    entranceGroup.add(grandFrame);

    // Viền khung mạ vàng kim (Mặt trước ở Z = -0.25)
    const grandFrameTrim = new THREE.Mesh(new THREE.BoxGeometry(3.7, 0.1, 0.04), goldBrassMat);
    grandFrameTrim.position.set(0, 3.8, -0.23);
    entranceGroup.add(grandFrameTrim);

    // Trán cửa kiến trúc cổ điển (Mặt trước ở Z = -0.24)
    const pediment = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.42, 0.08), goldBrassMat);
    pediment.position.set(0, 4.05, -0.20);
    entranceGroup.add(pediment);

    // Biển chỉ dẫn mạ vàng sang trọng "KHÁN PHÒNG / GRAND AUDITORIUM" (Mặt trước ở Z = -0.25)
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.36, 0.04), goldBrassMat);
    signBoard.position.set(0, 3.45, -0.23);
    entranceGroup.add(signBoard);

    // 2 Cánh cửa đôi gỗ sồi sẫm màu thụt vào lòng khung (Mặt trước ở Z = -0.14)
    [-0.75, 0.75].forEach((dx) => {
      const doorLeaf = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3.0, 0.06), panelWoodMat);
      doorLeaf.position.set(dx, 1.5, -0.11);
      entranceGroup.add(doorLeaf);

      // Ô huỳnh phào chỉ trên cánh cửa (Mặt trước ở Z = -0.16)
      [0.8, 1.6, 2.4].forEach((py) => {
        const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.65, 0.02), darkWoodMat);
        doorPanel.position.set(dx, py, -0.15);
        entranceGroup.add(doorPanel);

        const doorTrim = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.69, 0.01), goldBrassMat);
        doorTrim.position.set(dx, py, -0.165);
        entranceGroup.add(doorTrim);
      });

      // Tay nắm tròn đồng vàng (Mặt trước ở Z = -0.20)
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 14, 14), goldBrassMat);
      knob.position.set(dx > 0 ? dx - 0.5 : dx + 0.5, 1.4, -0.16);
      entranceGroup.add(knob);
    });

    // Lớp 3: Cột ốp tường (Pilasters) bằng gỗ gụ (Mặt trước ở Z = -0.16)
    const rearPilasters = [-9.2, -5.8, -2.6, 2.6, 5.8, 9.2];
    rearPilasters.forEach((rx) => {
      const rPillar = new THREE.Mesh(new THREE.BoxGeometry(0.55, 6.4, 0.08), panelWoodMat);
      rPillar.position.set(rx, 5.4, -0.12);
      rearWallGroup.add(rPillar);

      // Đầu cột hoa văn mạ vàng (Mặt trước ở Z = -0.20)
      const rCap = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.32, 0.12), goldBrassMat);
      rCap.position.set(rx, 8.5, -0.14);
      rearWallGroup.add(rCap);
    });

    // Lớp 4: Các ô huỳnh tranh bích họa mỹ thuật lớn đối xứng 2 bên cửa
    [-7.5, -4.2, 4.2, 7.5].forEach((fx) => {
      // Tầng 1: Tranh sơn dầu cổ điển (Khung ở Z = -0.11, Tranh ở Z = -0.13, Viền ở Z = -0.155)
      const rFrame1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.0, 0.06), darkWoodMat);
      rFrame1.position.set(fx, 3.35, -0.11);
      rearWallGroup.add(rFrame1);

      const rCanvas1 = new THREE.Mesh(new THREE.BoxGeometry(2.18, 1.78, 0.04), frescoArtMat);
      rCanvas1.position.set(fx, 3.35, -0.13);
      rearWallGroup.add(rCanvas1);

      const rTrim1 = new THREE.Mesh(new THREE.BoxGeometry(2.22, 1.82, 0.02), goldBrassMat);
      rTrim1.position.set(fx, 3.35, -0.155);
      rearWallGroup.add(rTrim1);

      // Đèn nến tường mạ vàng gắn đối xứng tỏa ánh sáng vàng ấm
      createWallSconce(rearWallGroup, fx, 3.65, -0.11);

      // Tầng 2: Ô nhung gấm đỏ rượu vang và phù điêu mạ vàng
      const rFrame2 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.0, 0.06), darkWoodMat);
      rFrame2.position.set(fx, 5.65, -0.11);
      rearWallGroup.add(rFrame2);

      const rCanvas2 = new THREE.Mesh(new THREE.BoxGeometry(2.18, 1.78, 0.04), wallDamaskMat);
      rCanvas2.position.set(fx, 5.65, -0.13);
      rearWallGroup.add(rCanvas2);

      const rCrest2 = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.04, 12, 24), goldBrassMat);
      rCrest2.position.set(fx, 5.65, -0.16);
      rearWallGroup.add(rCrest2);
    });

    // 5. TRẦN Ô CỜ NHÀ HÁT LỚN HÀ NỘI & ĐÈN CHÙM PHA LÊ HOÀNG GIA (GRAND COFFERED CEILING)
    // Tấm trần phẳng trên cao 8.8m, phẳng phiu hoàn toàn không che khuất tầm nhìn camera
    const ceilingPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(28, 28),
      new THREE.MeshStandardMaterial({ color: 0x241a13, roughness: 0.85 })
    );
    ceilingPlane.rotation.x = Math.PI / 2;
    ceilingPlane.position.set(0, 8.8, 2.0);
    scene.add(ceilingPlane);

    // Khung xà gỗ ô cờ và phào chỉ mạ vàng kim trang trí trên trần
    [-6.0, -2.0, 2.0, 6.0].forEach((gx) => {
      const beamX = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.15, 24), panelWoodMat);
      beamX.position.set(gx, 8.7, 2.0);
      scene.add(beamX);

      const trimX = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 24), goldBrassMat);
      trimX.position.set(gx, 8.6, 2.0);
      scene.add(trimX);
    });

    [-2.0, 1.0, 4.0, 7.0].forEach((gz) => {
      const beamZ = new THREE.Mesh(new THREE.BoxGeometry(20, 0.15, 0.24), panelWoodMat);
      beamZ.position.set(0, 8.7, gz);
      scene.add(beamZ);

      const trimZ = new THREE.Mesh(new THREE.BoxGeometry(20, 0.04, 0.06), goldBrassMat);
      trimZ.position.set(0, 8.6, gz);
      scene.add(trimZ);
    });

    // ĐÈN CHÙM PHA LÊ HOÀNG GIA KHỔNG LỒ KIỂU PHÁP (GRAND GARNIER CHANDELIER)
    const chandelierGroup = new THREE.Group();
    chandelierGroup.position.set(0, 7.8, 2.0);
    scene.add(chandelierGroup);

    // Dây xích đồng vàng treo đèn từ đỉnh vòm
    const chandelierChain = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 1.8, 12), goldBrassMat);
    chandelierChain.position.y = 0.9;
    chandelierGroup.add(chandelierChain);

    // Tầng vương miện vàng trên cùng
    const topCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.35, 0.14, 24), goldBrassMat);
    chandelierGroup.add(topCrown);

    // Vành khuyên vàng lớn tầng giữa đường kính 2.4m
    const mainRing = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.08, 16, 32), goldBrassMat);
    mainRing.rotation.x = Math.PI / 2;
    mainRing.position.y = -0.45;
    chandelierGroup.add(mainRing);

    // 16 Bóng nến pha lê lấp lánh xung quanh vành khuyên
    for (let c = 0; c < 16; c++) {
      const cAngle = (c / 16) * Math.PI * 2;
      const candleX = Math.cos(cAngle) * 1.2;
      const candleZ = Math.sin(cAngle) * 1.2;

      const candleBase = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.15, 12), goldBrassMat);
      candleBase.position.set(candleX, -0.36, candleZ);
      chandelierGroup.add(candleBase);

      const crystalDrop = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.2, 12), crystalGlassMat);
      crystalDrop.rotation.x = Math.PI;
      crystalDrop.position.set(candleX, -0.56, candleZ);
      chandelierGroup.add(crystalDrop);
    }

    // Tầng chóp pha lê nhọn kim tự tháp rủ xuống tâm đèn
    const centerCrystalCone = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.1, 24), crystalGlassMat);
    centerCrystalCone.rotation.x = Math.PI;
    centerCrystalCone.position.y = -0.95;
    chandelierGroup.add(centerCrystalCone);

    // Nguồn sáng ấm áp huyền ảo từ đèn chùm tỏa khắp khán phòng rộng lớn (cân bằng, không bị cháy sáng)
    const chandelierLight = new THREE.PointLight(0xffecd6, 95, 22, 1.15);
    chandelierLight.position.set(0, -0.4, 0);
    chandelierGroup.add(chandelierLight);

    // 6. BỤC SÂN KHẤU (RAISED WOODEN PLATFORM - IMAGE 4)
    const stageWidth = 14.0;
    const stageDepth = 4.4;
    const stageHeight = 0.38;

    const stagePlatform = new THREE.Mesh(
      new THREE.BoxGeometry(stageWidth, stageHeight, stageDepth),
      darkWoodMat
    );
    stagePlatform.position.set(0, stageHeight / 2, -2.4);
    scene.add(stagePlatform);

    // Viền kim loại vàng bóng mép sân khấu
    const stageTrim = new THREE.Mesh(new THREE.BoxGeometry(stageWidth + 0.05, 0.06, 0.06), goldBrassMat);
    stageTrim.position.set(0, stageHeight, -2.4 + stageDepth / 2);
    scene.add(stageTrim);

    // =========================================================================
    // 5. BỤC ĐẤU GIÁ VÀ BÀN TRÒN TRUNG TÂM (PODIUM DESK - IMAGE 4)
    // =========================================================================
    const podiumGroup = new THREE.Group();
    podiumGroup.position.set(0, stageHeight, -2.1);
    scene.add(podiumGroup);

    // Bàn bục chính gỗ gụ sang trọng giống Image 4
    const podiumDesk = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.95, 0.7), darkWoodMat);
    podiumDesk.position.y = 0.95 / 2;
    podiumGroup.add(podiumDesk);

    // Các ô pa-nô trang trí mặt trước bục
    const panelBorder1 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.04), panelWoodMat);
    panelBorder1.position.set(-0.4, 0.48, 0.36);
    podiumGroup.add(panelBorder1);

    const panelBorder2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.04), panelWoodMat);
    panelBorder2.position.set(0.4, 0.48, 0.36);
    podiumGroup.add(panelBorder2);

    // Mép trên mặt bục vát cong
    const podiumTop = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.06, 0.8), panelWoodMat);
    podiumTop.position.y = 0.98;
    podiumGroup.add(podiumTop);

    // Bục nhỏ gõ búa (Sound Block / Gavel Striking Pad) đặt ngay trước tay phải người điều phối
    const soundBlockGroup = new THREE.Group();
    soundBlockGroup.position.set(0.24, 1.01, 0.06);
    podiumGroup.add(soundBlockGroup);

    // 1. Đế đồng tròn viền vàng ánh kim sang trọng, bề thế
    const brassBaseMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.88, roughness: 0.18 });
    const soundBlockBase = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.155, 0.024, 28), brassBaseMat);
    soundBlockBase.position.y = 0.012;
    soundBlockGroup.add(soundBlockBase);

    // 2. Thân đĩa gỗ gụ cao cấp sẫm màu
    const mahoganyDiscMat = new THREE.MeshStandardMaterial({ color: 0x2e180d, roughness: 0.35 });
    const soundBlockDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.138, 0.032, 28), mahoganyDiscMat);
    soundBlockDisc.position.y = 0.038;
    soundBlockGroup.add(soundBlockDisc);

    // 3. Mặt đệm tròn tâm đĩa để búa gõ xuống sắc nét
    const strikePadMat = new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.85 });
    const soundBlockPad = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.008, 28), strikePadMat);
    soundBlockPad.position.y = 0.056;
    soundBlockGroup.add(soundBlockPad);

    // =========================================================================
    // 6. KHỞI TẠO 3 MÀN HÌNH LED PHÍA SAU BỤC ĐẤU GIÁ (IMAGE 4)
    // =========================================================================
    const leftCanvas = document.createElement("canvas");
    leftCanvas.width = 512;
    leftCanvas.height = 512;
    leftLedCanvasRef.current = leftCanvas;
    const leftTexture = new THREE.CanvasTexture(leftCanvas);
    leftLedTextureRef.current = leftTexture;

    const leftLedMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.5, 1.9),
      new THREE.MeshBasicMaterial({ map: leftTexture })
    );
    leftLedMesh.position.set(-3.4, stageHeight + 2.4, -4.3);
    scene.add(leftLedMesh);

    const standMat = new THREE.MeshStandardMaterial({ color: 0x18181c, metalness: 0.85, roughness: 0.25 });
    const leftStand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5), standMat);
    leftStand.position.set(-3.4, stageHeight + 0.75, -4.3);
    scene.add(leftStand);

    const centerCanvas = document.createElement("canvas");
    centerCanvas.width = 1024;
    centerCanvas.height = 512;
    centerLedCanvasRef.current = centerCanvas;
    const centerTexture = new THREE.CanvasTexture(centerCanvas);
    centerLedTextureRef.current = centerTexture;

    const centerLedMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(4.6, 2.3),
      new THREE.MeshBasicMaterial({ map: centerTexture })
    );
    centerLedMesh.position.set(0, stageHeight + 2.7, -4.4);
    scene.add(centerLedMesh);

    const rightCanvas = document.createElement("canvas");
    rightCanvas.width = 512;
    rightCanvas.height = 512;
    rightLedCanvasRef.current = rightCanvas;
    const rightTexture = new THREE.CanvasTexture(rightCanvas);
    rightLedTextureRef.current = rightTexture;

    const rightLedMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.5, 1.9),
      new THREE.MeshBasicMaterial({ map: rightTexture })
    );
    rightLedMesh.position.set(3.4, stageHeight + 2.4, -4.3);
    scene.add(rightLedMesh);

    const rightStand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5), standMat);
    rightStand.position.set(3.4, stageHeight + 0.75, -4.3);
    scene.add(rightStand);

    updateLedScreens(phaseRef.current, currentBidRef.current, highestBidderRef.current || "Hệ thống Sàn", calloutStepRef.current);

    // =========================================================================
    // 7. GHẾ KHÁN PHÒNG NHÀ HÁT LỚN HÀ NỘI: ĐỆM NHUNG ĐỎ SANG TRỌNG & 8 HÀNG GHẾ
    // =========================================================================
    // 8 Hàng ghế giật cấp bậc thang bề thế từ thấp lên cao
    const rowsConfig = [
      { rowNum: 1, z: 0.8, y: 0.0 },
      { rowNum: 2, z: 1.9, y: 0.12 }, // Hàng 2: Nơi người chơi ngồi
      { rowNum: 3, z: 3.0, y: 0.24 },
      { rowNum: 4, z: 4.1, y: 0.36 },
      { rowNum: 5, z: 5.2, y: 0.48 },
      { rowNum: 6, z: 6.3, y: 0.60 },
      { rowNum: 7, z: 7.4, y: 0.72 },
      { rowNum: 8, z: 8.5, y: 0.84 },
    ];

    // HÀM TẠO 1 CHIẾC GHẾ NHÀ HÁT OPERA HOÀNG GIA (ROYAL RED VELVET THEATER SEAT)
    const createOperaChair = (x: number, y: number, z: number) => {
      const chairGroup = new THREE.Group();
      chairGroup.position.set(x, y, z);
      scene.add(chairGroup);

      const seatW = 0.52;
      const seatD = 0.46;
      const seatH = 0.46; // Chiều cao mặt đệm ngồi

      // 1. ĐỆM NGỒI BỌC NHUNG ĐỎ HOÀNG GIA (ROYAL RED VELVET CUSHION)
      const seatCushion = new THREE.Mesh(
        new THREE.BoxGeometry(seatW - 0.04, 0.09, seatD - 0.04),
        royalRedVelvetMat
      );
      seatCushion.position.set(0, seatH, 0);
      chairGroup.add(seatCushion);

      // Đáy đỡ đệm bằng gỗ quý
      const seatBaseWood = new THREE.Mesh(
        new THREE.BoxGeometry(seatW - 0.02, 0.03, seatD - 0.02),
        panelWoodMat
      );
      seatBaseWood.position.set(0, seatH - 0.05, 0);
      chairGroup.add(seatBaseWood);

      // 2. TỰA LƯNG BỌC NHUNG ĐỎ UỐN CONG & VIỀN GỖ MẠ VÀNG KIM
      const backCushion = new THREE.Mesh(
        new THREE.BoxGeometry(seatW - 0.06, 0.48, 0.08),
        royalRedVelvetMat
      );
      backCushion.position.set(0, seatH + 0.28, seatD / 2 - 0.04);
      backCushion.rotation.x = -0.06; // Ngả nhẹ tự nhiên ra sau
      chairGroup.add(backCushion);

      // Khung ốp gỗ phía sau lưng ghế
      const backWoodPlate = new THREE.Mesh(
        new THREE.BoxGeometry(seatW - 0.04, 0.50, 0.03),
        darkWoodMat
      );
      backWoodPlate.position.set(0, seatH + 0.28, seatD / 2 - 0.01);
      backWoodPlate.rotation.x = -0.06;
      chairGroup.add(backWoodPlate);

      // Viền kim loại mạ vàng đỉnh tựa lưng ghế sang trọng
      const backGoldTrim = new THREE.Mesh(
        new THREE.BoxGeometry(seatW, 0.04, 0.05),
        goldBrassMat
      );
      backGoldTrim.position.set(0, seatH + 0.53, seatD / 2 - 0.02);
      chairGroup.add(backGoldTrim);

      // 3. TAY VỊN GỖ QUÝ MÀI BÓNG 2 BÊN GHẾ (OPERA ARMRESTS)
      [-seatW / 2, seatW / 2].forEach((ax) => {
        // Trụ đỡ tay vịn
        const armPost = new THREE.Mesh(
          new THREE.BoxGeometry(0.04, 0.22, 0.04),
          darkWoodMat
        );
        armPost.position.set(ax, seatH + 0.11, 0.05);
        chairGroup.add(armPost);

        // Mặt tay vịn gỗ tiện cong thanh lịch
        const armCap = new THREE.Mesh(
          new THREE.BoxGeometry(0.055, 0.035, seatD - 0.08),
          panelWoodMat
        );
        armCap.position.set(ax, seatH + 0.22, 0.05);
        chairGroup.add(armCap);
      });

      // 4. CHÂN ĐẾ KIM LOẠI ĐÚC CỔ ĐIỂN MÀU ĐỒNG SẪM (Nằm hoàn toàn trên mặt sàn, triệt tiêu 100% nhấp nháy đen)
      const chairLegMat = new THREE.MeshStandardMaterial({ color: 0x181412, metalness: 0.8, roughness: 0.3 });
      const mainLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, seatH - 0.06, 12), chairLegMat);
      mainLeg.position.set(0, (seatH - 0.06) / 2 + 0.015, 0);
      chairGroup.add(mainLeg);

      // Đĩa chân đế đặt nổi 1.5mm trên mặt sàn (Y = 0.01) để không bao giờ bị trùng mặt phẳng Z-fighting với sàn
      const footFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.018, 16), chairLegMat);
      footFlange.position.set(0, 0.01, 0);
      chairGroup.add(footFlange);

      return chairGroup;
    };

    rowsConfig.forEach((row) => {
      // Bậc gỗ giật cấp khán phòng (chỉ tạo từ hàng 2 trở đi để hàng 1 nằm êm ái trên sàn chính)
      if (row.y > 0) {
        // Bậc gỗ bên trái (chừa lối đi giữa thảm đỏ)
        const leftRiser = new THREE.Mesh(new THREE.BoxGeometry(3.3, row.y, 0.98), panelWoodMat);
        leftRiser.position.set(-2.45, row.y / 2, row.z);
        scene.add(leftRiser);

        // Bậc gỗ bên phải (chừa lối đi giữa thảm đỏ)
        const rightRiser = new THREE.Mesh(new THREE.BoxGeometry(3.3, row.y, 0.98), panelWoodMat);
        rightRiser.position.set(2.45, row.y / 2, row.z);
        scene.add(rightRiser);
      }

      // 8 GHẾ MỖI HÀNG (4 ghế cánh trái, 4 ghế cánh phải) đặt CHÍNH XÁC trên mặt sàn bậc gỗ
      const leftSeatPositions = [-3.1, -2.4, -1.75, -1.1];
      const rightSeatPositions = [1.1, 1.75, 2.4, 3.1];

      leftSeatPositions.forEach((sx) => {
        createOperaChair(sx, row.y, row.z);
      });

      rightSeatPositions.forEach((sx) => {
        createOperaChair(sx, row.y, row.z);
      });
    });

    // =========================================================================
    // VẬT LIỆU CHUNG CHO NHÂN VẬT (NGƯỜI CHƠI, KHÁN GIẢ & ĐIỀU PHỐI)
    // =========================================================================
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xdeb89e, roughness: 0.55 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x221a15, roughness: 0.85 });
    const sweaterMat = new THREE.MeshStandardMaterial({ color: 0x2e3440, roughness: 0.7 }); // Áo nỉ xám sẫm giống Image 4
    const ribMat = new THREE.MeshStandardMaterial({ color: 0x242933, roughness: 0.75 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x181a20, roughness: 0.65 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.45 });
    const whiteSoleMat = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.25 });
    const watchMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 });

    // =========================================================================
    // HÀM TẠO BẢNG TÊN 3D NỔI TRÊN ĐẦU NHÂN VẬT (NAME TAG BILLBOARD SPRITE)
    // =========================================================================
    const createNameTagSprite = (
      name: string,
      roleTag?: string,
      variant: "host" | "user" | "audience" = "audience"
    ) => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 144;
      const ctx = canvas.getContext("2d");
      if (!ctx) return new THREE.Sprite();

      // Nền kính mờ bo góc
      ctx.fillStyle =
        variant === "host"
          ? "rgba(25, 18, 12, 0.95)"
          : variant === "user"
          ? "rgba(35, 20, 10, 0.95)"
          : "rgba(12, 17, 28, 0.92)";
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(8, 8, 496, 128, 28);
      } else {
        ctx.rect(8, 8, 496, 128);
      }
      ctx.fill();

      // Viền kim loại nổi bật
      ctx.strokeStyle =
        variant === "host" ? "#f59e0b" : variant === "user" ? "#ff6600" : "#38bdf8";
      ctx.lineWidth = 5;
      ctx.stroke();

      // Tag nhỏ phía trên
      if (roleTag) {
        ctx.fillStyle =
          variant === "host" ? "#fbbf24" : variant === "user" ? "#ffa143" : "#7dd3fc";
        ctx.font = "bold 24px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(roleTag, 256, 42);
      }

      // Tên chính
      ctx.fillStyle = "#ffffff";
      ctx.font = roleTag ? "900 36px sans-serif" : "900 42px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(name, 256, roleTag ? 98 : 78);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      const mat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false, // Luôn hiển thị sắc nét trên đầu mọi người
      });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(0.95, 0.27, 1);
      sprite.renderOrder = 999;
      return sprite;
    };

    // =========================================================================
    // TẠO CÁC KHÁN GIẢ KHÁC NGỒI TRONG KHÁN PHÒNG (MỖI NGƯỜI ĐỀU CÓ BẢNG TÊN)
    // =========================================================================
    const createAudiencePerson = (
      x: number,
      y: number,
      z: number,
      name: string,
      tag: string,
      sweaterColor: number
    ) => {
      const personGroup = new THREE.Group();
      personGroup.position.set(x, y + 0.02, z);
      scene.add(personGroup);

      const persSweaterMat = new THREE.MeshStandardMaterial({ color: sweaterColor, roughness: 0.65 });

      // Thân áo ngồi
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.44, 14), persSweaterMat);
      torso.position.set(0, 0.68, 0.04);
      torso.scale.set(1.1, 1, 0.7);
      personGroup.add(torso);

      // Đầu
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), skinMat);
      head.position.set(0, 1.05, 0.04);
      head.scale.set(0.92, 1.08, 0.95);
      personGroup.add(head);

      // Tóc
      const hair = new THREE.Mesh(new THREE.SphereGeometry(0.126, 16, 16), hairMat);
      hair.position.set(0, 1.08, 0.03);
      personGroup.add(hair);

      // Bảng tên nổi trên đầu
      const nameTag = createNameTagSprite(name, tag, "audience");
      nameTag.position.set(0, 1.48, 0.04);
      personGroup.add(nameTag);

      return personGroup;
    };

    // Tạo 6 khán giả ngồi ở các vị trí ghế khác nhau trong nhà hát
    createAudiencePerson(1.1, 0.12, 1.9, "QuangMinh_Pro", "👑 VIP Leader", 0x1e3a8a); // Hàng 2 bên phải
    createAudiencePerson(-1.75, 0.0, 0.8, "ThanhHang_Tech", "⚡ Săn Deal", 0x065f46); // Hàng 1 bên trái
    createAudiencePerson(1.75, 0.0, 0.8, "HoangNam_VIP", "💎 Kim Cương", 0x581c87); // Hàng 1 bên phải
    createAudiencePerson(-2.4, 0.24, 3.0, "TuanAnh_Gaming", "🎮 Gamer", 0x7c2d12); // Hàng 3 bên trái
    createAudiencePerson(2.4, 0.24, 3.0, "MaiAnh_Audio", "🎧 Audiophile", 0x831843); // Hàng 3 bên phải
    createAudiencePerson(-1.1, 0.36, 4.1, "DucHuy_CustomKey", "⌨️ Key Custom", 0x14532d); // Hàng 4 bên trái

    // =========================================================================
    // 8. MÔ HÌNH NGƯỜI CHƠI (USER): THIẾT KẾ 3D CHUYÊN NGHIỆP GIỐNG IMAGE 4
    // =========================================================================
    const userRoot = new THREE.Group();
    userRoot.position.copy(DOOR_POS);
    scene.add(userRoot);
    userRootRef.current = userRoot;

    // Pelvis (Khung chậu)
    const userPelvis = new THREE.Group();
    userPelvis.position.set(0, 0.88, 0);
    userRoot.add(userPelvis);
    userPelvisRef.current = userPelvis;

    const pelvisMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.22, 16), pantsMat);
    userPelvis.add(pelvisMesh);

    // Chân trái (Left Leg)
    const userLeftHip = new THREE.Group();
    userLeftHip.position.set(-0.11, -0.08, 0);
    userPelvis.add(userLeftHip);
    userLeftHipRef.current = userLeftHip;

    const leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.42, 16), pantsMat);
    leftThigh.position.y = -0.21;
    userLeftHip.add(leftThigh);

    const userLeftKnee = new THREE.Group();
    userLeftKnee.position.set(0, -0.42, 0);
    userLeftHip.add(userLeftKnee);
    userLeftKneeRef.current = userLeftKnee;

    const leftShin = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.42, 16), pantsMat);
    leftShin.position.y = -0.21;
    userLeftKnee.add(leftShin);

    // Giày sneaker đen đế trắng giống Image 4
    const leftShoeBody = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.075, 0.24), shoeMat);
    leftShoeBody.position.set(0, -0.42, 0.05);
    userLeftKnee.add(leftShoeBody);

    const leftSole = new THREE.Mesh(new THREE.BoxGeometry(0.118, 0.026, 0.25), whiteSoleMat);
    leftSole.position.set(0, -0.455, 0.05);
    userLeftKnee.add(leftSole);

    // Chân phải (Right Leg)
    const userRightHip = new THREE.Group();
    userRightHip.position.set(0.11, -0.08, 0);
    userPelvis.add(userRightHip);
    userRightHipRef.current = userRightHip;

    const rightThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.42, 16), pantsMat);
    rightThigh.position.y = -0.21;
    userRightHip.add(rightThigh);

    const userRightKnee = new THREE.Group();
    userRightKnee.position.set(0, -0.42, 0);
    userRightHip.add(userRightKnee);
    userRightKneeRef.current = userRightKnee;

    const rightShin = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.42, 16), pantsMat);
    rightShin.position.y = -0.21;
    userRightKnee.add(rightShin);

    const rightShoeBody = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.075, 0.24), shoeMat);
    rightShoeBody.position.set(0, -0.42, 0.05);
    userRightKnee.add(rightShoeBody);

    const rightSole = new THREE.Mesh(new THREE.BoxGeometry(0.118, 0.026, 0.25), whiteSoleMat);
    rightSole.position.set(0, -0.455, 0.05);
    userRightKnee.add(rightSole);

    // Thân trên áo Sweater thời trang tự nhiên (Image 4)
    const userTorso = new THREE.Group();
    userPelvis.add(userTorso);

    const chestMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.48, 16), sweaterMat);
    chestMesh.position.y = 0.28;
    chestMesh.scale.set(1.15, 1, 0.75);
    userTorso.add(chestMesh);

    // Bo gấu áo và cổ tròn
    const hemBand = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.185, 0.05, 16), ribMat);
    hemBand.position.y = 0.04;
    hemBand.scale.set(1.15, 1, 0.75);
    userTorso.add(hemBand);

    // Cầu vai tròn tự nhiên
    const leftShoulderCap = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 14), sweaterMat);
    leftShoulderCap.position.set(-0.23, 0.44, 0);
    userTorso.add(leftShoulderCap);

    const rightShoulderCap = new THREE.Mesh(new THREE.SphereGeometry(0.08, 14, 14), sweaterMat);
    rightShoulderCap.position.set(0.23, 0.44, 0);
    userTorso.add(rightShoulderCap);

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.05, 16), ribMat);
    collar.position.y = 0.52;
    userTorso.add(collar);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.1, 14), skinMat);
    neck.position.y = 0.55;
    userTorso.add(neck);

    // Đầu & Tóc nam hiện đại giống Image 4
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.68, 0);
    userTorso.add(headGroup);

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.125, 24, 24), skinMat);
    headMesh.scale.set(0.92, 1.12, 0.96);
    headGroup.add(headMesh);

    // Tai người 2 bên
    const earGeo = new THREE.BoxGeometry(0.02, 0.05, 0.035);
    const leftEar = new THREE.Mesh(earGeo, skinMat);
    leftEar.position.set(-0.12, 0, 0);
    headGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, skinMat);
    rightEar.position.set(0.12, 0, 0);
    headGroup.add(rightEar);

    // Mũi và cằm tạo khối mặt người tự nhiên
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.04), skinMat);
    nose.position.set(0, 0, 0.13);
    headGroup.add(nose);

    // Mái tóc rẽ ngôi tự nhiên giống Image 4
    const hairMesh = new THREE.Mesh(new THREE.SphereGeometry(0.134, 24, 24), hairMat);
    hairMesh.position.set(0, 0.04, -0.015);
    hairMesh.scale.set(0.95, 1.05, 1.0);
    headGroup.add(hairMesh);

    // Bảng tên nổi trên đầu Người Chơi (User)
    const userNameTag = createNameTagSprite(userName, "⭐ Bạn", "user");
    userNameTag.position.set(0, 0.42, 0);
    headGroup.add(userNameTag);

    // Cánh tay trái có đồng hồ vàng
    const userLeftShoulder = new THREE.Group();
    userLeftShoulder.position.set(-0.23, 0.44, 0);
    userTorso.add(userLeftShoulder);
    userLeftShoulderRef.current = userLeftShoulder;

    const leftUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.052, 0.34, 14), sweaterMat);
    leftUpperArm.position.y = -0.17;
    userLeftShoulder.add(leftUpperArm);

    const userLeftElbow = new THREE.Group();
    userLeftElbow.position.set(0, -0.34, 0);
    userLeftShoulder.add(userLeftElbow);
    userLeftElbowRef.current = userLeftElbow;

    const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.044, 0.3, 14), sweaterMat);
    leftForearm.position.y = -0.15;
    userLeftElbow.add(leftForearm);

    const watch = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.03, 16), watchMat);
    watch.position.y = -0.28;
    userLeftElbow.add(watch);

    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.048, 14, 14), skinMat);
    leftHand.position.y = -0.32;
    userLeftElbow.add(leftHand);

    // Cánh tay phải & Tấm bảng đấu giá
    const userRightShoulder = new THREE.Group();
    userRightShoulder.position.set(0.23, 0.44, 0);
    userTorso.add(userRightShoulder);
    userRightShoulderRef.current = userRightShoulder;

    const rightUpperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.052, 0.34, 14), sweaterMat);
    rightUpperArm.position.y = -0.17;
    userRightShoulder.add(rightUpperArm);

    const userRightElbow = new THREE.Group();
    userRightElbow.position.set(0, -0.34, 0);
    userRightShoulder.add(userRightElbow);
    userRightElbowRef.current = userRightElbow;

    const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.044, 0.3, 14), sweaterMat);
    rightForearm.position.y = -0.15;
    userRightElbow.add(rightForearm);

    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.048, 14, 14), skinMat);
    rightHand.position.y = -0.32;
    userRightElbow.add(rightHand);
    userRightHandRef.current = rightHand;

    // =========================================================================
    // BẢNG ĐẤU GIÁ (AUCTION PADDLE): CHUẨN XÁC 100%, ĐỌC XUÔI TỪ TRÁI SANG PHẢI
    // =========================================================================
    const paddleGroup = new THREE.Group();
    scene.add(paddleGroup);
    userPaddleGroupRef.current = paddleGroup;
    paddleGroup.visible = false; // Chỉ xuất hiện khi dơ bảng

    // Cán cầm bảng bằng gỗ bóng, vươn thẳng lên từ tay
    const paddleStick = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.42, 16), darkWoodMat);
    paddleStick.position.y = 0.21;
    paddleGroup.add(paddleStick);

    const paddleCanvas = document.createElement("canvas");
    paddleCanvas.width = 512;
    paddleCanvas.height = 512;
    paddleCanvasRef.current = paddleCanvas;

    const paddleTexture = new THREE.CanvasTexture(paddleCanvas);
    paddleTextureRef.current = paddleTexture;

    // Khung kim loại viền vàng kim sang trọng
    const paddleBorderMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.92, roughness: 0.18 });
    const paddleBackPlate = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.34, 0.02), paddleBorderMat);
    paddleBackPlate.position.y = 0.54;
    paddleGroup.add(paddleBackPlate);

    // MẶT CHÍNH HƯỚNG VÀO CAMERA (WORLD +Z) - Chuẩn xác 100%, đọc từ trái sang phải
    const frontSignMat = new THREE.MeshBasicMaterial({ map: paddleTexture, side: THREE.FrontSide });
    const frontSign = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.32), frontSignMat);
    frontSign.position.set(0, 0.54, 0.012);
    paddleGroup.add(frontSign);

    // MẶT SAU HƯỚNG VỀ PHÍA SÂN KHẤU (WORLD -Z)
    const backSignMat = new THREE.MeshBasicMaterial({ map: paddleTexture, side: THREE.FrontSide });
    const backSign = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.32), backSignMat);
    backSign.rotation.y = Math.PI;
    backSign.position.set(0, 0.54, -0.012);
    paddleGroup.add(backSign);

    updatePaddleCanvas(lastBidAmount);

    // =========================================================================
    // 9. MÔ HÌNH NGƯỜI ĐIỀU PHỐI (AUCTIONEER): VEST LỊCH LÃM, DƠ TAY (IMAGE 4)
    // =========================================================================
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.4 });
    const vestMat = new THREE.MeshStandardMaterial({ color: 0x1f2736, roughness: 0.5 }); // Áo vest gile navy giống Image 4
    const tieMat = new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.3 });

    const npcGroup = new THREE.Group();
    npcGroup.position.set(0, stageHeight, -2.6);
    scene.add(npcGroup);
    npcGroupRef.current = npcGroup;

    const npcChest = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.28), vestMat);
    npcChest.position.y = 1.05;
    npcGroup.add(npcChest);

    // Dây xích đồng hồ quả quýt vàng trên áo vest
    const chainMesh = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.01, 8, 16), goldBrassMat);
    chainMesh.position.set(0.1, 0.96, 0.15);
    npcGroup.add(chainMesh);

    const npcSleeves = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 0.29), shirtMat);
    npcSleeves.position.set(0, 1.15, 0.01);
    npcGroup.add(npcSleeves);

    const npcTie = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.04), tieMat);
    npcTie.position.set(0, 1.12, 0.16);
    npcGroup.add(npcTie);

    const npcHeadGroup = new THREE.Group();
    npcHeadGroup.position.set(0, 1.48, 0);
    npcGroup.add(npcHeadGroup);

    const npcHead = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 24), skinMat);
    npcHead.scale.set(0.9, 1.1, 0.95);
    npcHeadGroup.add(npcHead);

    const npcHair = new THREE.Mesh(new THREE.SphereGeometry(0.138, 20, 20), hairMat);
    npcHair.position.set(0, 0.04, -0.015);
    npcHair.scale.set(0.92, 1.05, 0.98);
    npcHeadGroup.add(npcHair);

    // Bảng tên nổi trên đầu Người Điều Phối (Host)
    const npcNameTag = createNameTagSprite("Người Điều Phối", "👑 Sàn NexLoot", "host");
    npcNameTag.position.set(0, 0.45, 0);
    npcHeadGroup.add(npcNameTag);

    // Cánh tay trái NPC: Vươn cao chỉ nhịp giá về phía khán phòng (Image 4)
    const npcLeftArm = new THREE.Group();
    npcLeftArm.position.set(-0.26, 1.25, 0);
    npcGroup.add(npcLeftArm);
    npcLeftArmRef.current = npcLeftArm;

    const npcLeftFore = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.44, 14), shirtMat);
    npcLeftFore.position.y = -0.22;
    npcLeftArm.add(npcLeftFore);

    const npcLeftHand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 14), skinMat);
    npcLeftHand.position.y = -0.46;
    npcLeftArm.add(npcLeftHand);

    // Cánh tay trái vươn cao chỉ nhịp giá tự nhiên
    npcLeftArm.rotation.x = -Math.PI * 0.42;
    npcLeftArm.rotation.z = -0.25;

    // Cánh tay phải NPC: CẦM BÚA ĐẤU GIÁ (GAVEL) TO HƠN, NẰM DỌC 100% TRÊN BỤC NHỎ
    const npcRightArm = new THREE.Group();
    npcRightArm.position.set(0.24, 1.25, 0);
    npcGroup.add(npcRightArm);
    npcRightArmRef.current = npcRightArm;

    // Bắp tay phải buông thẳng xuống sát mặt bàn
    const npcRightUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.046, 0.22, 14), shirtMat);
    npcRightUpper.position.y = -0.11;
    npcRightArm.add(npcRightUpper);

    // Khớp khuỷu tay phải: gập góc đưa cẳng tay ra phía trước đặt trên mặt bàn bục
    const npcRightElbow = new THREE.Group();
    npcRightElbow.position.set(0, -0.22, 0);
    npcRightArm.add(npcRightElbow);
    npcRightElbowRef.current = npcRightElbow;

    // Cẳng tay phải: hướng thẳng DỌC ra phía trước (+Z) song song mặt bàn
    const npcRightFore = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.042, 0.28, 14), shirtMat);
    npcRightFore.position.set(0, 0.01, 0.14);
    npcRightFore.rotation.x = Math.PI / 2;
    npcRightElbow.add(npcRightFore);

    // Bàn tay phải nắm chắc cán búa
    const npcRightHand = new THREE.Mesh(new THREE.SphereGeometry(0.048, 14, 14), skinMat);
    npcRightHand.position.set(0, 0.045, 0.28);
    npcRightElbow.add(npcRightHand);

    // =========================================================================
    // BÚA GÕ ĐẤU GIÁ (AUCTIONEER GAVEL): TO HƠN, NẰM DỌC 100%, 2 ĐẦU DỌC TRÊN - DƯỚI
    // =========================================================================
    const gavelGroup = new THREE.Group();
    npcRightElbow.add(gavelGroup);
    npcGavelRef.current = gavelGroup;

    // 1. Cán búa to hơn, chạy DỌC theo trục Z từ tay người điều phối ra phía trước
    const gavelHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.018, 0.28, 18),
      darkWoodMat
    );
    gavelHandle.rotation.x = Math.PI / 2; // Cán búa chạy DỌC theo trục Z
    gavelHandle.position.set(0, 0.05, 0.42);
    gavelGroup.add(gavelHandle);

    // Đốc chuôi cán búa bọc kim loại vàng sang trọng
    const handlePommel = new THREE.Mesh(
      new THREE.SphereGeometry(0.024, 14, 14),
      goldBrassMat
    );
    handlePommel.position.set(0, 0.05, 0.28);
    gavelGroup.add(handlePommel);

    // 2. Đầu búa TO HƠN, DỰNG ĐỨNG DỌC (Trục thẳng đứng Y: 2 đầu dọc trên - dưới)
    const gavelHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.062, 0.062, 0.16, 24),
      darkWoodMat
    );
    // Trục thẳng đứng Y: 2 đầu tròn của búa hướng dọc lên trên và xuống dưới
    gavelHead.position.set(0, 0.13, 0.56);
    gavelGroup.add(gavelHead);

    // Nắp kim loại vàng bọc đầu trên (đầu dọc trên)
    const topCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.064, 0.064, 0.018, 24),
      goldBrassMat
    );
    topCap.position.set(0, 0.205, 0.56);
    gavelGroup.add(topCap);

    // Vòng kim loại vàng bọc đầu dưới (đầu dọc dưới)
    const bottomRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.064, 0.064, 0.018, 24),
      goldBrassMat
    );
    bottomRing.position.set(0, 0.06, 0.56);
    gavelGroup.add(bottomRing);

    // Giữ tay phải thẳng thắn, búa dựng dọc ngay trên mặt đệm bục nhỏ
    npcRightArm.rotation.set(0, 0, 0);
    npcRightElbow.rotation.set(0, 0, 0);

    // Bong bóng chat đếm nhịp giá (Thu nhỏ gọn gàng, đặt bên hông tay chỉ để không che bảng LED đằng sau)
    const speechCanvas = document.createElement("canvas");
    speechCanvas.width = 512;
    speechCanvas.height = 160;
    const speechTexture = new THREE.CanvasTexture(speechCanvas);
    const speechSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: speechTexture, transparent: true }));
    speechSprite.scale.set(1.25, 0.38, 1); // Thu nhỏ hơn 60% so với kích thước khổng lồ cũ
    speechSprite.position.set(-0.85, 1.35, 0.25); // Đặt chếch bên tay trái NPC, không che màn hình LED trung tâm
    speechSprite.visible = false;
    npcGroup.add(speechSprite);
    npcSpeechSpriteRef.current = speechSprite;

    // --- RESIZE OBSERVER ---
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    });
    resizeObserver.observe(container);

    // --- ANIMATION LOOP CHÍNH ---
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // =====================================================================
      // 1. ANIMATION NGƯỜI CHƠI (USER): BƯỚC VÀO & NGỒI NHÌN THẲNG VỀ BỤC
      // =====================================================================
      const state = userStateRef.current;
      const user = userRootRef.current;
      const leftDoor = leftDoorLeafRef.current;
      const rightDoor = rightDoorLeafRef.current;

      if (state === "DOOR_OPEN") {
        userProgressRef.current += 0.025;
        const p = Math.min(1.0, userProgressRef.current);

        if (leftDoor) leftDoor.rotation.y = THREE.MathUtils.lerp(0, -Math.PI * 0.42, p);
        if (rightDoor) rightDoor.rotation.y = THREE.MathUtils.lerp(0, Math.PI * 0.42, p);

        if (p >= 1.0) {
          userStateRef.current = "WALKING_IN";
          userProgressRef.current = 0;
        }
      } else if (state === "WALKING_IN" && user) {
        userProgressRef.current += 0.009;
        const p = Math.min(1.0, userProgressRef.current);

        const walkCycle = elapsed * 9;
        if (userLeftHipRef.current) userLeftHipRef.current.rotation.x = Math.sin(walkCycle) * 0.5;
        if (userRightHipRef.current) userRightHipRef.current.rotation.x = -Math.sin(walkCycle) * 0.5;
        if (userLeftKneeRef.current) userLeftKneeRef.current.rotation.x = Math.max(0, -Math.sin(walkCycle)) * 0.6;
        if (userRightKneeRef.current) userRightKneeRef.current.rotation.x = Math.max(0, Math.sin(walkCycle)) * 0.6;

        if (userLeftShoulderRef.current) userLeftShoulderRef.current.rotation.x = -Math.sin(walkCycle) * 0.35;
        if (userRightShoulderRef.current) userRightShoulderRef.current.rotation.x = Math.sin(walkCycle) * 0.35;

        // Quỹ đạo bước đi: Từ cửa hậu trường (-4.8, 3.6) tới hàng ghế 2 (-1.1, 1.9)
        const walkX = THREE.MathUtils.lerp(DOOR_POS.x, USER_SEAT_POS.x, p);
        const walkZ = THREE.MathUtils.lerp(DOOR_POS.z, USER_SEAT_POS.z, p);
        user.position.set(walkX, THREE.MathUtils.lerp(0, USER_SEAT_POS.y, p) + Math.sin(walkCycle * 2) * 0.02, walkZ);
        user.rotation.y = -Math.PI * 0.3;

        if (p > 0.4) {
          const doorP = (p - 0.4) / 0.6;
          if (leftDoor) leftDoor.rotation.y = THREE.MathUtils.lerp(-Math.PI * 0.42, 0, doorP);
          if (rightDoor) rightDoor.rotation.y = THREE.MathUtils.lerp(Math.PI * 0.42, 0, doorP);
        }

        if (p >= 1.0) {
          userStateRef.current = "TURNING_AND_SITTING";
          userProgressRef.current = 0;
        }
      } else if (state === "TURNING_AND_SITTING" && user) {
        userProgressRef.current += 0.035;
        const p = Math.min(1.0, userProgressRef.current);

        // QUAY MẶT 100% VỀ PHÍA BỤC (ROTATION.Y = MATH.PI)
        user.rotation.y = THREE.MathUtils.lerp(-Math.PI * 0.3, Math.PI, p);
        user.position.y = THREE.MathUtils.lerp(USER_SEAT_POS.y, USER_SEAT_POS.y - 0.42, p);
        user.position.x = USER_SEAT_POS.x;
        user.position.z = USER_SEAT_POS.z;

        if (userLeftHipRef.current) userLeftHipRef.current.rotation.x = THREE.MathUtils.lerp(0, Math.PI / 2, p);
        if (userRightHipRef.current) userRightHipRef.current.rotation.x = THREE.MathUtils.lerp(0, Math.PI / 2, p);
        if (userLeftKneeRef.current) userLeftKneeRef.current.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 2, p);
        if (userRightKneeRef.current) userRightKneeRef.current.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 2, p);

        if (p >= 1.0) {
          userStateRef.current = "IDLE";
          if (userLeftShoulderRef.current) userLeftShoulderRef.current.rotation.x = -0.3;
          if (userLeftElbowRef.current) userLeftElbowRef.current.rotation.x = -0.5;
          if (userRightShoulderRef.current) userRightShoulderRef.current.rotation.x = -0.3;
          if (userRightElbowRef.current) userRightElbowRef.current.rotation.x = -0.5;
        }
      } else if (state === "BIDDING" && user) {
        user.rotation.y = Math.PI;
        if (userPelvisRef.current) {
          userPelvisRef.current.position.y = 0.88;
        }
        // Vươn cao cánh tay phải cầm bảng đấu giá mượt mà, chân thực
        if (userRightShoulderRef.current) {
          userRightShoulderRef.current.rotation.x = THREE.MathUtils.lerp(userRightShoulderRef.current.rotation.x, -Math.PI * 0.72, 0.12);
          userRightShoulderRef.current.rotation.z = THREE.MathUtils.lerp(userRightShoulderRef.current.rotation.z, -0.15, 0.12);
        }
        if (userRightElbowRef.current) {
          userRightElbowRef.current.rotation.x = THREE.MathUtils.lerp(userRightElbowRef.current.rotation.x, -0.12, 0.12);
        }
      } else if (state === "IDLE" && user) {
        user.rotation.y = Math.PI;
        if (userPelvisRef.current) {
          const breath = Math.sin(elapsed * 2.2) * 0.008;
          userPelvisRef.current.position.y = 0.88 + breath;
        }
        // Hạ tay phải về tư thế nghỉ tự nhiên trên đùi mượt mà
        if (userRightShoulderRef.current) {
          userRightShoulderRef.current.rotation.x = THREE.MathUtils.lerp(userRightShoulderRef.current.rotation.x, -0.3, 0.08);
          userRightShoulderRef.current.rotation.z = THREE.MathUtils.lerp(userRightShoulderRef.current.rotation.z, 0, 0.08);
        }
        if (userRightElbowRef.current) {
          userRightElbowRef.current.rotation.x = THREE.MathUtils.lerp(userRightElbowRef.current.rotation.x, -0.5, 0.08);
        }
      }

      // Căn chỉnh bảng đấu giá luôn đứng thẳng và hướng trực diện vào camera khi dơ bảng
      const paddle = userPaddleGroupRef.current;
      const hand = userRightHandRef.current;
      if (paddle && hand) {
        if (state === "BIDDING") {
          paddle.visible = true;
          // Lấy vị trí thế giới chính xác của bàn tay phải người chơi
          hand.updateWorldMatrix(true, false);
          const handWorldPos = new THREE.Vector3();
          hand.getWorldPosition(handWorldPos);
          paddle.position.copy(handWorldPos);
          // Giữ tấm bảng luôn hướng thẳng đứng (World +Y), mặt chính hướng về camera, góc nghiêng nhẹ chân thực
          paddle.rotation.set(-0.06, -0.12, 0.0);
        } else {
          paddle.visible = false;
        }
      } else if (state === "LEAVING" && user) {
        leaveProgressRef.current += 0.012;
        const p = leaveProgressRef.current;

        if (p < 0.25) {
          const standP = p / 0.25;
          user.position.y = THREE.MathUtils.lerp(USER_SEAT_POS.y - 0.42, USER_SEAT_POS.y, standP);
          if (userLeftHipRef.current) userLeftHipRef.current.rotation.x = THREE.MathUtils.lerp(Math.PI / 2, 0, standP);
          if (userRightHipRef.current) userRightHipRef.current.rotation.x = THREE.MathUtils.lerp(Math.PI / 2, 0, standP);
          if (userLeftKneeRef.current) userLeftKneeRef.current.rotation.x = THREE.MathUtils.lerp(-Math.PI / 2, 0, standP);
          if (userRightKneeRef.current) userRightKneeRef.current.rotation.x = THREE.MathUtils.lerp(-Math.PI / 2, 0, standP);
        } else if (p < 0.45) {
          const turnP = (p - 0.25) / 0.2;
          user.rotation.y = THREE.MathUtils.lerp(Math.PI, -Math.PI * 0.5, turnP);

          if (leftDoor) leftDoor.rotation.y = THREE.MathUtils.lerp(0, -Math.PI * 0.42, turnP);
          if (rightDoor) rightDoor.rotation.y = THREE.MathUtils.lerp(0, Math.PI * 0.42, turnP);
        } else {
          const walkP = (p - 0.45) / 0.55;
          const walkX = THREE.MathUtils.lerp(USER_SEAT_POS.x, DOOR_POS.x - 0.8, walkP);
          const walkZ = THREE.MathUtils.lerp(USER_SEAT_POS.z, DOOR_POS.z, walkP);
          user.position.set(walkX, Math.sin(elapsed * 10) * 0.025, walkZ);
          user.rotation.y = -Math.PI * 0.5;

          const walkCycle = elapsed * 10;
          if (userLeftHipRef.current) userLeftHipRef.current.rotation.x = Math.sin(walkCycle) * 0.5;
          if (userRightHipRef.current) userRightHipRef.current.rotation.x = -Math.sin(walkCycle) * 0.5;

          if (walkP >= 1.0) {
            user.visible = false;
            if (leftDoor) leftDoor.rotation.y = 0;
            if (rightDoor) rightDoor.rotation.y = 0;
            onLeaveCompleteRef.current?.();
          }
        }
      }

      // =====================================================================
      // 2. LOGIC NGƯỜI ĐIỀU PHỐI (AUCTIONEER - IMAGE 4)
      // =====================================================================
      const npc = npcGroupRef.current;
      const curPhase = phaseRef.current;
      const cStep = calloutStepRef.current;
      const cBid = currentBidRef.current;

      if (npc) {
        if (cStep > 0 && curPhase === "BIDDING") {
          // Tay trái giơ cao chỉ về phía người vừa đặt giá giống Image 4
          if (npcLeftArmRef.current) {
            npcLeftArmRef.current.rotation.x = -Math.PI * 0.45 + Math.sin(elapsed * 4) * 0.04;
            npcLeftArmRef.current.rotation.z = -0.25;
          }
          // Tay phải giữ búa thẳng thắn ngay trên bục nhỏ
          if (npcRightArmRef.current) {
            npcRightArmRef.current.rotation.set(0, 0, 0);
          }
          if (npcRightElbowRef.current) {
            if (cStep === 3) {
              // Nhấc búa lên chuẩn bị gõ chốt ở lần 3
              npcRightElbowRef.current.rotation.x = -Math.PI * 0.16;
            } else {
              // Giữ búa đứng dọc thẳng thắn ngay trên mặt bục nhỏ
              npcRightElbowRef.current.rotation.set(0, 0, 0);
            }
          }

          const sprite = npcSpeechSpriteRef.current;
          if (sprite) {
            sprite.visible = true;
            const sCanvas = (sprite.material.map as THREE.CanvasTexture)?.image as HTMLCanvasElement;
            if (sCanvas) {
              const sCtx = sCanvas.getContext("2d");
              if (sCtx) {
                sCtx.clearRect(0, 0, 512, 160);
                // Nền bo góc tối sang trọng, không bị chói loá hay che khuất bảng LED
                sCtx.fillStyle = "rgba(10, 15, 26, 0.94)";
                sCtx.beginPath();
                sCtx.roundRect(8, 8, 496, 144, 28);
                sCtx.fill();

                // Viền vàng hổ phách nổi bật
                sCtx.strokeStyle = "#f59e0b";
                sCtx.lineWidth = 6;
                sCtx.stroke();

                // Biểu tượng loa phát thanh nhịp giá
                sCtx.fillStyle = "#fbbf24";
                sCtx.font = "bold 34px sans-serif";
                sCtx.textAlign = "left";
                sCtx.fillText("📢", 26, 92);

                // Dòng chữ đếm nhịp giá nổi bật, rõ ràng
                sCtx.fillStyle = "#ffffff";
                sCtx.font = "900 46px monospace";
                sCtx.textAlign = "center";
                const stepText = cStep === 1 ? "LẦN 1..." : cStep === 2 ? "LẦN 2...!!" : "LẦN 3... CHỐT!";
                sCtx.fillText(`${(cBid / 1000).toLocaleString("vi-VN")}k ${stepText}`, 275, 96);
                (sprite.material.map as THREE.CanvasTexture).needsUpdate = true;
              }
            }
          }
        } else {
          if (npcLeftArmRef.current) {
            npcLeftArmRef.current.rotation.x = -0.2;
            npcLeftArmRef.current.rotation.z = -0.05;
          }
          if (npcRightArmRef.current) {
            npcRightArmRef.current.rotation.set(0, 0, 0);
          }
          if (npcRightElbowRef.current && curPhase !== "ENDED") {
            npcRightElbowRef.current.rotation.set(0, 0, 0);
          }
          if (npcSpeechSpriteRef.current && curPhase !== "BIDDING") {
            npcSpeechSpriteRef.current.visible = false;
          }
        }

        // KHI KẾT THÚC: CẦM BÚA GÕ MẠNH XUỐNG BỤC NHỎ (THẲNG TẮP VÀO MẶT ĐỆM GỖ)
        if (curPhase === "ENDED") {
          if (npcRightArmRef.current) {
            npcRightArmRef.current.rotation.set(0, 0, 0);
          }
          if (npcRightElbowRef.current) {
            const smashTime = (elapsed * 3.2) % 2;
            if (smashTime < 0.45) {
              // Nhấc búa lên cao chuẩn bị gõ
              npcRightElbowRef.current.rotation.x = -Math.PI * 0.26;
            } else if (smashTime < 0.85) {
              // GÕ MẠNH XUỐNG BỤC NHỎ
              npcRightElbowRef.current.rotation.x = 0.03;
            } else {
              // Giữ búa đứng dọc phẳng phiu trên mặt bục nhỏ
              npcRightElbowRef.current.rotation.set(0, 0, 0);
            }
          }
        }
      }

      // =====================================================================
      // 3. DI CHUYỂN CÁC HẠT EMOJI BAY LÊN
      // =====================================================================
      for (let i = emojiParticlesRef.current.length - 1; i >= 0; i--) {
        const item = emojiParticlesRef.current[i];
        item.sprite.position.y += item.vy;
        item.sprite.position.x += Math.sin(elapsed * 4 + i) * 0.008;
        item.life -= 0.015;
        item.sprite.material.opacity = Math.max(0, item.life);

        if (item.life <= 0) {
          scene.remove(item.sprite);
          item.sprite.material.dispose();
          emojiParticlesRef.current.splice(i, 1);
        }
      }

      // Cập nhật hạt pháo hoa nếu có
      if (fireworksParticles.current.length > 0) {
        for (let i = fireworksParticles.current.length - 1; i >= 0; i--) {
          const p = fireworksParticles.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.08; // trọng lực nhẹ
          p.life -= 0.015;
          if (p.life <= 0) {
            fireworksParticles.current.splice(i, 1);
          }
        }
      }

      // =====================================================================
      // 4. ĐIỀU CHỈNH GÓC CAMERA THEO CAMERA MODE (RỘNG RÃI TOÀN CẢNH NHÀ HÁT LỚN)
      // =====================================================================
      const cMode = cameraModeRef.current;
      if (cMode === "overview") {
        // GÓC TOÀN CẢNH ĐẠI SẢNH NHÀ HÁT LỚN HÀ NỘI (RỘNG THÊNH THANG, BỀ THẾ, THU TRỌN 3 TẦNG BAN CÔNG)
        camera.position.lerp(new THREE.Vector3(-0.6, 3.2, 6.8), 0.08);
        camera.lookAt(0, 1.9, -1.8);
      } else if (cMode === "stage") {
        // Nhìn cận cảnh vào bục đấu giá và 3 màn hình LED
        camera.position.lerp(new THREE.Vector3(0, 2.0, 0.8), 0.08);
        camera.lookAt(0, 1.6, -2.1);
      } else if (cMode === "my_seat") {
        // Góc nhìn trực tiếp từ chỗ ngồi người chơi nhưng thoáng đãng, góc rộng
        camera.position.lerp(new THREE.Vector3(-0.9, 1.7, 3.2), 0.08);
        camera.lookAt(0, 1.6, -2.0);
      } else if (cMode === "free") {
        cameraAngles.current.yaw += (targetCameraAngles.current.yaw - cameraAngles.current.yaw) * 0.08;
        cameraAngles.current.pitch += (targetCameraAngles.current.pitch - cameraAngles.current.pitch) * 0.08;
        cameraAngles.current.dist += (targetCameraAngles.current.dist - cameraAngles.current.dist) * 0.08;
        cameraAngles.current.fov += (targetCameraAngles.current.fov - cameraAngles.current.fov) * 0.08;

        // Cập nhật FOV mượt mà khi cuộn chuột zoom
        if (Math.abs(camera.fov - cameraAngles.current.fov) > 0.1) {
          camera.fov = cameraAngles.current.fov;
          camera.updateProjectionMatrix();
        }

        // Vị trí camera đứng trong khán phòng
        const camX = -0.6;
        const camY = 2.4;
        const camZ = cameraAngles.current.dist;
        camera.position.set(camX, camY, camZ);

        // Vector hướng nhìn: quay 360 độ và ngửa nhìn thẳng lên trần nhà hát
        const yaw = cameraAngles.current.yaw;
        const pitch = cameraAngles.current.pitch;

        const dirX = Math.sin(yaw) * Math.cos(pitch);
        const dirY = Math.sin(pitch); // Khi pitch > 0: ngửa thẳng mắt lên trần nhà & đèn chùm
        const dirZ = -Math.cos(yaw) * Math.cos(pitch);

        camera.lookAt(camX + dirX * 10, camY + dirY * 10, camZ + dirZ * 10);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          if (Array.isArray(m.material)) m.material.forEach((mat) => mat.dispose());
          else m.material?.dispose();
        }
      });
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // SỰ KIỆN CHUỘT & CẢM ỨNG XOAY CAMERA 360 ĐỘ TỰ DO & NGỬA NHÌN TRẦN NHÀ
  const handleMouseDown = (e: React.MouseEvent) => {
    if (cameraModeRef.current !== "free") return;
    isDraggingRef.current = true;
    prevMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || cameraModeRef.current !== "free") return;
    const dx = e.clientX - prevMousePos.current.x;
    const dy = e.clientY - prevMousePos.current.y;
    // Xoay 360 độ ngang quanh phòng
    targetCameraAngles.current.yaw -= dx * 0.006;
    // Ngửa lên nhìn trần nhà & đèn chùm (kéo chuột lên/xuống mượt mà, góc ngửa lên tới 83 độ)
    targetCameraAngles.current.pitch = Math.max(
      -Math.PI * 0.38, // Cúi nhìn sàn
      Math.min(Math.PI * 0.46, targetCameraAngles.current.pitch + dy * 0.006) // Ngửa nhìn thẳng lên trần nhà & đèn chùm
    );
    prevMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (cameraModeRef.current !== "free") return;
    // Tiến / lùi vị trí trong khán phòng và zoom góc nhìn
    targetCameraAngles.current.dist = Math.max(
      1.5,
      Math.min(8.5, targetCameraAngles.current.dist + e.deltaY * 0.008)
    );
    targetCameraAngles.current.fov = Math.max(
      35,
      Math.min(78, targetCameraAngles.current.fov + e.deltaY * 0.03)
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (cameraModeRef.current !== "free" || e.touches.length === 0) return;
    isDraggingRef.current = true;
    prevMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || cameraModeRef.current !== "free" || e.touches.length === 0) return;
    const dx = e.touches[0].clientX - prevMousePos.current.x;
    const dy = e.touches[0].clientY - prevMousePos.current.y;
    targetCameraAngles.current.yaw -= dx * 0.008;
    targetCameraAngles.current.pitch = Math.max(
      -Math.PI * 0.38,
      Math.min(Math.PI * 0.46, targetCameraAngles.current.pitch + dy * 0.008)
    );
    prevMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  return (
    <div
      ref={mountRef}
      className="relative w-full h-full cursor-grab active:cursor-grabbing select-none overflow-hidden touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
}
