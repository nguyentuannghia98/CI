"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { 
  RotateCw, 
  Maximize2, 
  Minimize2, 
  Compass, 
  Sparkles, 
  Zap, 
  Trophy, 
  Volume2, 
  VolumeX,
  Layers,
  Award,
  ShieldCheck,
  ChevronRight
} from "lucide-react";

interface Auction3DArenaProps {
  title: string;
  imageUrl: string;
  currentBid: number;
  startBid: number;
  maxBid?: number;
  minStep?: number;
  category?: string;
  condition?: string;
  highestBidder?: {
    id?: string;
    name: string;
    avatar: string;
    verified?: boolean;
  };
  seller?: {
    id?: string;
    name: string;
    avatar: string;
  };
  isEnded?: boolean;
  isMaxBidReached?: boolean;
  onPlaceBid?: (amount: number) => void;
  onClose3D?: () => void;
}

export default function Auction3DArena({
  title,
  imageUrl,
  currentBid,
  startBid,
  maxBid,
  minStep = 50000,
  category = "Thiết bị Gaming",
  condition = "Nguyên seal 100%",
  highestBidder,
  seller,
  isEnded = false,
  isMaxBidReached = false,
  onPlaceBid,
  onClose3D,
}: Auction3DArenaProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  // States UI
  const [autoRotate, setAutoRotate] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundFX, setSoundFX] = useState(true);
  const [floatingText, setFloatingText] = useState<{ id: number; text: string; amount: number }[]>([]);
  const prevBidRef = useRef(currentBid);

  // References cho Three.js
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const centralLightRef = useRef<THREE.PointLight | null>(null);
  const productGroupRef = useRef<THREE.Group | null>(null);
  const ringsRef = useRef<THREE.Mesh[]>([]);
  const shockwavesRef = useRef<{ mesh: THREE.Mesh; scale: number; maxScale: number; alpha: number }[]>([]);
  const particlesRef = useRef<THREE.Points | null>(null);

  // Tương tác Camera chuột / touch
  const isDraggingRef = useRef(false);
  const prevMousePos = useRef({ x: 0, y: 0 });
  const cameraAngle = useRef({ theta: Math.PI * 0.25, phi: Math.PI * 0.35, radius: 7.2 });
  const targetCameraAngle = useRef({ theta: Math.PI * 0.25, phi: Math.PI * 0.35, radius: 7.2 });

  // Web Audio FX âm thanh khoa học viễn tưởng khi nhảy giá
  const playSciFiBidSound = useCallback((isMax: boolean = false) => {
    if (!soundFX || typeof window === "undefined") return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      if (isMax) {
        // Hợp âm chiến thắng
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.2); // A5
        osc.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.4); // E6
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.6);
      } else {
        // Laser energy zap
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(700, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.08);
        osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.22);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      }
    } catch {}
  }, [soundFX]);

  // Kích hoạt hiệu ứng tia sáng Shockwave khi giá thay đổi
  const triggerBidShockwave = useCallback((amount: number, isMax: boolean) => {
    const scene = sceneRef.current;
    if (!scene) return;

    // 1. Tạo sóng xung kích năng lượng tỏa ra từ bục
    const waveGeo = new THREE.RingGeometry(0.5, 0.7, 32);
    const waveMat = new THREE.MeshBasicMaterial({
      color: isMax ? 0xffcc00 : 0xff6600,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const waveMesh = new THREE.Mesh(waveGeo, waveMat);
    waveMesh.rotation.x = -Math.PI / 2;
    waveMesh.position.y = 0.25;
    scene.add(waveMesh);

    shockwavesRef.current.push({
      mesh: waveMesh,
      scale: 1,
      maxScale: 7.5,
      alpha: 0.9,
    });

    // 2. Chớp đèn Spotlight rực rỡ
    if (centralLightRef.current) {
      centralLightRef.current.intensity = isMax ? 12 : 7;
    }

    // 3. Floating text bay lên
    const textId = Date.now();
    const newText = isMax ? "👑 MAX BID! THẮNG NGAY!" : `+${(amount - prevBidRef.current).toLocaleString("vi-VN")}đ!`;
    setFloatingText((prev) => [...prev, { id: textId, text: newText, amount }]);
    setTimeout(() => {
      setFloatingText((prev) => prev.filter((item) => item.id !== textId));
    }, 2200);

    // 4. Phát âm thanh
    playSciFiBidSound(isMax);
  }, [playSciFiBidSound]);

  // Lắng nghe thay đổi giá đấu để kích hoạt hiệu ứng 3D Realtime
  useEffect(() => {
    if (currentBid > prevBidRef.current) {
      const reachedMax = Boolean(maxBid && currentBid >= maxBid);
      triggerBidShockwave(currentBid, reachedMax);
      prevBidRef.current = currentBid;
    }
  }, [currentBid, maxBid, triggerBidShockwave]);

  // KHỞI TẠO SCENE THREE.JS
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let animationFrameId: number;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. SCENE VÀ FOG CYBERPUNK
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0c14);
    scene.fog = new THREE.FogExp2(0x0a0c14, 0.05);
    sceneRef.current = scene;

    // 2. CAMERA
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;

    // 3. RENDERER
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. ÁNH SÁNG (LIGHTING)
    // Ánh sáng môi trường dịu nhẹ màu xanh neon
    const ambientLight = new THREE.AmbientLight(0x182038, 1.4);
    scene.add(ambientLight);

    // Đèn chiếu chính từ trên cao (Spotlight Cam Rực rỡ)
    const mainSpot = new THREE.SpotLight(0xff7700, 7.5, 20, Math.PI / 4, 0.6, 1.2);
    mainSpot.position.set(2, 6, 4);
    mainSpot.target.position.set(0, 1.0, 0);
    scene.add(mainSpot);
    scene.add(mainSpot.target);

    // Đèn viền xanh Neon Rim Light đối diện tạo chiều sâu Sci-Fi
    const rimSpot = new THREE.SpotLight(0x00d4ff, 5.0, 18, Math.PI / 3, 0.7, 1.0);
    rimSpot.position.set(-3, 4, -4);
    rimSpot.target.position.set(0, 0.8, 0);
    scene.add(rimSpot);
    scene.add(rimSpot.target);

    // Đèn PointLight phát sáng ngay tâm bục
    const centralPointLight = new THREE.PointLight(0xff8800, 3.5, 9, 1.5);
    centralPointLight.position.set(0, 0.8, 0);
    scene.add(centralPointLight);
    centralLightRef.current = centralPointLight;

    // 5. BỤC NĂNG LƯỢNG CYBERPUNK (ENERGY PODIUM)
    const podiumGroup = new THREE.Group();
    scene.add(podiumGroup);

    // Lưới sàn Grid Helper
    const gridHelper = new THREE.GridHelper(26, 26, 0xff5500, 0x182236);
    gridHelper.position.y = -0.05;
    podiumGroup.add(gridHelper);

    // Tầng 1: Đĩa đáy lớn
    const baseCylinderGeo = new THREE.CylinderGeometry(3.2, 3.5, 0.25, 48);
    const baseCylinderMat = new THREE.MeshStandardMaterial({
      color: 0x121624,
      metalness: 0.85,
      roughness: 0.25,
    });
    const baseMesh = new THREE.Mesh(baseCylinderGeo, baseCylinderMat);
    baseMesh.position.y = 0.125;
    podiumGroup.add(baseMesh);

    // Vòng đèn Neon Cam ở viền tầng 1
    const baseRingGeo = new THREE.TorusGeometry(3.3, 0.04, 16, 64);
    const baseRingMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
    const baseRing = new THREE.Mesh(baseRingGeo, baseRingMat);
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.y = 0.25;
    podiumGroup.add(baseRing);

    // Tầng 2: Bục nâng trung tâm
    const midCylinderGeo = new THREE.CylinderGeometry(2.1, 2.3, 0.2, 48);
    const midCylinderMat = new THREE.MeshStandardMaterial({
      color: 0x161c2e,
      metalness: 0.9,
      roughness: 0.2,
    });
    const midMesh = new THREE.Mesh(midCylinderGeo, midCylinderMat);
    midMesh.position.y = 0.35;
    podiumGroup.add(midMesh);

    // Vòng Neon Xanh Cyan ở viền tầng 2
    const midRingGeo = new THREE.TorusGeometry(2.15, 0.035, 16, 64);
    const midRingMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const midRing = new THREE.Mesh(midRingGeo, midRingMat);
    midRing.rotation.x = Math.PI / 2;
    midRing.position.y = 0.45;
    podiumGroup.add(midRing);

    // 2 Vòng quỹ đạo xoay quanh bục (Floating Orbit Rings)
    const orbitRing1Geo = new THREE.TorusGeometry(1.65, 0.02, 16, 64);
    const orbitRing1Mat = new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.75 });
    const orbitRing1 = new THREE.Mesh(orbitRing1Geo, orbitRing1Mat);
    orbitRing1.rotation.x = Math.PI / 2.2;
    orbitRing1.position.y = 0.65;
    podiumGroup.add(orbitRing1);

    const orbitRing2Geo = new THREE.TorusGeometry(1.95, 0.018, 16, 64);
    const orbitRing2Mat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.6 });
    const orbitRing2 = new THREE.Mesh(orbitRing2Geo, orbitRing2Mat);
    orbitRing2.rotation.x = Math.PI / 1.8;
    orbitRing2.position.y = 0.8;
    podiumGroup.add(orbitRing2);

    ringsRef.current = [orbitRing1, orbitRing2];

    // 6. KHỐI TRƯNG BÀY SẢN PHẨM HOLOGRAPHIC 3D
    const productGroup = new THREE.Group();
    productGroup.position.set(0, 1.35, 0);
    scene.add(productGroup);
    productGroupRef.current = productGroup;

    // Tải texture ảnh sản phẩm thật
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      imageUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;

        // Tấm thẻ Hologram 3D hai mặt
        const cardWidth = 2.2;
        const cardHeight = 1.45;
        const cardGeo = new THREE.BoxGeometry(cardWidth, cardHeight, 0.08);

        // Mặt trước hiển thị ảnh sản phẩm, viền xung quanh kim loại đen mạ vàng
        const edgeMat = new THREE.MeshStandardMaterial({
          color: 0x11131a,
          metalness: 0.95,
          roughness: 0.15,
        });
        const frontMat = new THREE.MeshStandardMaterial({
          map: texture,
          metalness: 0.3,
          roughness: 0.4,
        });
        const backMat = new THREE.MeshStandardMaterial({
          map: texture,
          metalness: 0.3,
          roughness: 0.4,
        });

        // 6 mặt của Box: [+x, -x, +y, -y, +z (front), -z (back)]
        const materials = [edgeMat, edgeMat, edgeMat, edgeMat, frontMat, backMat];
        const productMesh = new THREE.Mesh(cardGeo, materials);
        productGroup.add(productMesh);

        // Khung viền sáng Neon Hologram bao quanh thẻ sản phẩm
        const frameGeo = new THREE.BoxGeometry(cardWidth + 0.06, cardHeight + 0.06, 0.07);
        const wireframeMat = new THREE.MeshBasicMaterial({
          color: 0xff8800,
          wireframe: true,
          transparent: true,
          opacity: 0.45,
        });
        const frameMesh = new THREE.Mesh(frameGeo, wireframeMat);
        productGroup.add(frameMesh);
      },
      undefined,
      () => {
        // Fallback khối hộp neon nếu ảnh lỗi
        const fallbackGeo = new THREE.BoxGeometry(1.6, 1.2, 0.1);
        const fallbackMat = new THREE.MeshStandardMaterial({ color: 0xff6600, metalness: 0.8 });
        const fallbackMesh = new THREE.Mesh(fallbackGeo, fallbackMat);
        productGroup.add(fallbackMesh);
      }
    );

    // 7. HẠT PHÁT SÁNG CYBER PARTICLES (RISING EMBERS)
    const particleCount = 280;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const radius = Math.random() * 2.8;
      const angle = Math.random() * Math.PI * 2;
      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = Math.random() * 4.0;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
      particleSpeeds[i] = 0.006 + Math.random() * 0.012;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0xffaa33,
      size: 0.045,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    // 8. TỰ ĐỘNG THÍCH ỨNG KÍCH THƯỚC (RESIZING OBSERVER)
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    });
    resizeObserver.observe(container);

    // 9. ANIMATION LOOP (VÒNG LẶP CHUYỂN ĐỘNG 60 FPS)
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Cập nhật góc Camera mượt mà (Inertia Smoothing)
      if (autoRotate && !isDraggingRef.current) {
        targetCameraAngle.current.theta += 0.005;
      }

      // Nội suy lerp góc quay camera
      cameraAngle.current.theta += (targetCameraAngle.current.theta - cameraAngle.current.theta) * 0.08;
      cameraAngle.current.phi += (targetCameraAngle.current.phi - cameraAngle.current.phi) * 0.08;
      cameraAngle.current.radius += (targetCameraAngle.current.radius - cameraAngle.current.radius) * 0.08;

      // Giới hạn phi tránh lật camera
      cameraAngle.current.phi = Math.max(0.15, Math.min(Math.PI * 0.48, cameraAngle.current.phi));

      const cx = cameraAngle.current.radius * Math.sin(cameraAngle.current.phi) * Math.sin(cameraAngle.current.theta);
      const cy = cameraAngle.current.radius * Math.cos(cameraAngle.current.phi);
      const cz = cameraAngle.current.radius * Math.sin(cameraAngle.current.phi) * Math.cos(cameraAngle.current.theta);

      camera.position.set(cx, cy, cz);
      camera.lookAt(0, 1.1, 0);

      // Chuyển động lơ lửng của sản phẩm (Floating Sine wave)
      if (productGroupRef.current) {
        productGroupRef.current.position.y = 1.35 + Math.sin(elapsedTime * 2.0) * 0.12;
        productGroupRef.current.rotation.y = elapsedTime * 0.45;
      }

      // Xoay 2 vòng quỹ đạo
      if (ringsRef.current[0]) ringsRef.current[0].rotation.z = elapsedTime * 0.6;
      if (ringsRef.current[1]) ringsRef.current[1].rotation.z = -elapsedTime * 0.45;

      // Hồi phục dần độ sáng đèn sau khi shockwave
      if (centralLightRef.current && centralLightRef.current.intensity > 3.5) {
        centralLightRef.current.intensity -= 0.08;
      }

      // Chạy hiệu ứng sóng xung kích Shockwaves
      for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
        const sw = shockwavesRef.current[i];
        sw.scale += 0.14;
        sw.alpha -= 0.022;
        sw.mesh.scale.set(sw.scale, sw.scale, sw.scale);
        (sw.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, sw.alpha);

        if (sw.alpha <= 0 || sw.scale >= sw.maxScale) {
          scene.remove(sw.mesh);
          sw.mesh.geometry.dispose();
          (sw.mesh.material as THREE.Material).dispose();
          shockwavesRef.current.splice(i, 1);
        }
      }

      // Cập nhật vị trí hạt bay lên
      if (particlesRef.current) {
        const posAttr = particlesRef.current.geometry.attributes.position;
        const array = posAttr.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          array[i * 3 + 1] += particleSpeeds[i];
          if (array[i * 3 + 1] > 4.2) {
            array[i * 3 + 1] = 0.2;
          }
        }
        posAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // DỌN DẸP BỘ NHỚ VÀ SỰ KIỆN KHI UNMOUNT
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();

      // Giải phóng toàn bộ geometry, material, texture
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => mat.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [imageUrl, autoRotate]);

  // XỬ LÝ CHUỘT / TOUCH XOAY CAMERA 360°
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    prevMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - prevMousePos.current.x;
    const deltaY = e.clientY - prevMousePos.current.y;

    targetCameraAngle.current.theta -= deltaX * 0.008;
    targetCameraAngle.current.phi -= deltaY * 0.008;

    prevMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    targetCameraAngle.current.radius = Math.max(
      4.2,
      Math.min(10.5, targetCameraAngle.current.radius + e.deltaY * 0.006)
    );
  };

  // Nút đặt giá nhanh ngay trong màn hình 3D
  const handleQuickBid = () => {
    if (isEnded || isMaxBidReached || !onPlaceBid) return;
    const nextAmount = maxBid ? Math.min(maxBid, currentBid + minStep) : currentBid + minStep;
    onPlaceBid(nextAmount);
  };

  return (
    <div 
      className={`relative w-full rounded-2xl overflow-hidden border shadow-2xl transition-all duration-300 select-none ${
        isFullscreen ? "fixed inset-0 z-[100000] rounded-none h-screen w-screen" : "h-full min-h-[380px]"
      }`}
      style={{
        backgroundColor: "#0a0c14",
        borderColor: "rgba(249, 115, 22, 0.3)",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Khung chứa Canvas WebGL của Three.js */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 1. HUD HEADER TRÊN CÙNG: Status & Quick Controls */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        {/* Badge Cyber 3D Arena */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-black/75 backdrop-blur-md border border-orange-500/40 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-orange-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>CYBER ARENA 3D</span>
          </div>

          <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/80 text-[10px] font-bold">
            {condition}
          </span>
        </div>

        {/* Nút công cụ tương tác */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Tắt / Bật tự xoay */}
          <button
            type="button"
            onClick={() => setAutoRotate((prev) => !prev)}
            className={`p-2 rounded-xl backdrop-blur-md border text-xs font-bold transition-all cursor-pointer ${
              autoRotate
                ? "bg-orange-500/20 border-orange-500/50 text-orange-400"
                : "bg-black/60 border-white/15 text-white/70 hover:text-white"
            }`}
            title={autoRotate ? "Tắt tự xoay" : "Bật tự xoay"}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? "animate-spin-slow" : ""}`} />
          </button>

          {/* Âm thanh SFX */}
          <button
            type="button"
            onClick={() => setSoundFX((prev) => !prev)}
            className={`p-2 rounded-xl backdrop-blur-md border text-xs font-bold transition-all cursor-pointer ${
              soundFX
                ? "bg-orange-500/20 border-orange-500/50 text-orange-400"
                : "bg-black/60 border-white/15 text-white/70 hover:text-white"
            }`}
            title={soundFX ? "Tắt âm thanh 3D" : "Bật âm thanh 3D"}
          >
            {soundFX ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Reset góc nhìn Camera */}
          <button
            type="button"
            onClick={() => {
              targetCameraAngle.current = { theta: Math.PI * 0.25, phi: Math.PI * 0.35, radius: 7.2 };
            }}
            className="p-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white/80 hover:text-white text-xs font-bold transition-all cursor-pointer"
            title="Reset góc nhìn"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>

          {/* Toàn màn hình */}
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="p-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white/80 hover:text-white text-xs font-bold transition-all cursor-pointer"
            title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình 3D"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Nút thoát về chế độ chuẩn */}
          {onClose3D && (
            <button
              type="button"
              onClick={onClose3D}
              className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-lg shadow-orange-500/30"
            >
              <Layers className="w-3.5 h-3.5" /> Chế độ Chuẩn
            </button>
          )}
        </div>
      </div>

      {/* 2. FLOATING TEXT NẨY LÊN KHI CÓ NGƯỜI ĐẶT GIÁ (FLOATING COMBAT TEXT) */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        {floatingText.map((item) => (
          <div
            key={item.id}
            className="animate-in fade-in slide-in-from-bottom-6 zoom-in-110 duration-700 ease-out flex flex-col items-center"
          >
            <div className="px-4 py-1.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-sm sm:text-base tracking-wider uppercase shadow-2xl shadow-orange-500/60 border border-white/30 flex items-center gap-2">
              <Zap className="w-4 h-4 fill-white" />
              <span>{item.text}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 3. HUD FOOTER DƯỚI CÙNG: Thông tin giá & Nút đè giá 1 chạm */}
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-end justify-between gap-2 pointer-events-none z-10">
        {/* Khối hiển thị mức giá 3D */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-black/80 backdrop-blur-xl border border-orange-500/30 shadow-2xl pointer-events-auto max-w-sm">
          <div className="flex items-center justify-between gap-4 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400">
              ⚡ Giá dẫn đầu hiện tại
            </span>
            {highestBidder && (
              <span className="text-[10px] text-zinc-300 font-medium truncate flex items-center gap-1">
                <span className="opacity-60">bởi</span>
                <span className="font-bold text-white">{highestBidder.name}</span>
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
              {currentBid.toLocaleString("vi-VN")}đ
            </span>
            {maxBid && (
              <span className="text-[11px] font-bold text-amber-400/90 flex items-center gap-1">
                <Trophy className="w-3 h-3" /> Max: {maxBid.toLocaleString("vi-VN")}đ
              </span>
            )}
          </div>

          {/* Thanh phần trăm tới giá tối đa */}
          {maxBid && (
            <div className="mt-2 w-full">
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((currentBid / maxBid) * 100))}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Nút hành động đặt giá nhanh nếu được truyền callback */}
        {onPlaceBid && !isEnded && !isMaxBidReached && (
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleQuickBid}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-orange-500/30 active:scale-95 transition-all cursor-pointer flex items-center gap-2 border border-white/20"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>ĐÈ GIÁ +{minStep.toLocaleString("vi-VN")}đ</span>
            </button>
          </div>
        )}
      </div>

      {/* Gợi ý tương tác chuột góc dưới giữa */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none text-[10px] text-white/40 tracking-wider hidden sm:block">
        Kéo chuột để xoay 360° • Lăn chuột để phóng to / thu nhỏ
      </div>
    </div>
  );
}

