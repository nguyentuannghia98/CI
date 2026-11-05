"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Đấu trường Cyberpunk Neon & Tinh thể Loot 3D (NexLoot Cyber Arena Engine)
 *
 * 1. Sóng lưới Cyber Grid uốn lượn (Cyber Synthwave Terrain): 
 *    Các đường lưới neon tím - cam trôi dạt và gợn sóng nhịp nhàng tạo chiều sâu không gian mạng vô tận.
 * 2. Khối Hộp Quà Loot Box & Tinh thể Đa diện (Cyber Loot Crystals & Hologram Cubes):
 *    Các khối pha lê, ngọc tím và vàng hổ phách lơ lửng, phản chiếu ánh sáng và xoay chuyển tương tác theo chuột.
 * 3. Vòng khuyên lượng tử Neon (Hologram Orbital Rings):
 *    Vòng hào quang công nghệ xoay quanh các cổ vật loot quý hiếm.
 * 4. Bụi hạt năng lượng Cyber Matrix (Floating Cyber Motes):
 *    Chùm hạt lấp lánh bay bổng trong không gian tạo hiệu ứng chiều sâu 3D đa tầng.
 * 5. Tương tác chuột mượt mà (Smooth Parallax Physics) & Tối ưu hóa hiệu năng 60fps.
 */
export default function Canvas3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // ═══════════════════════════════════════════════════════════════
    // 1. SCENE, CAMERA & RENDERER
    // ═══════════════════════════════════════════════════════════════
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      52,
      window.innerWidth / window.innerHeight,
      0.1,
      150
    );
    camera.position.set(0, 1.6, 9.5);
    camera.lookAt(0, -0.4, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // Root group chịu ảnh hưởng bởi tương tác chuột Parallax
    const arenaRoot = new THREE.Group();
    scene.add(arenaRoot);

    // ═══════════════════════════════════════════════════════════════
    // 2. HỆ THỐNG ÁNH SÁNG NEON CYBERPUNK (AMBER & PURPLE NEON)
    // ═══════════════════════════════════════════════════════════════
    const ambientLight = new THREE.AmbientLight(0x28123e, 1.8);
    scene.add(ambientLight);

    // Ánh sáng neon cam hổ phách rực rỡ từ bên trái
    const amberLight = new THREE.PointLight(0xff7700, 180, 25, 1.2);
    amberLight.position.set(-5, 3.5, 4);
    scene.add(amberLight);

    // Ánh sáng tím cyberpunk huyền ảo từ bên phải
    const purpleLight = new THREE.PointLight(0x9d4edd, 220, 25, 1.2);
    purpleLight.position.set(5, 3.0, 3);
    scene.add(purpleLight);

    // Ánh sáng xanh Cyan tương lai chiếu từ phía dưới sàn
    const cyanUnderlight = new THREE.DirectionalLight(0x06b6d4, 1.2);
    cyanUnderlight.position.set(0, -4, 2);
    scene.add(cyanUnderlight);

    // ═══════════════════════════════════════════════════════════════
    // 3. SÓNG LƯỚI CYBER GRID UỐN LƯỢN (SYNTHWAVE WIREFRAME TERRAIN)
    // ═══════════════════════════════════════════════════════════════
    const gridCols = 54;
    const gridRows = 54;
    const gridGeo = new THREE.PlaneGeometry(38, 38, gridCols, gridRows);
    gridGeo.rotateX(-Math.PI * 0.42); // Nghiêng tự nhiên về phía chân trời

    // Lưu trữ vị trí gốc của các đỉnh lưới
    const posAttr = gridGeo.attributes.position;
    const originalPositions = new Float32Array(posAttr.array);

    // Vật liệu lưới Neon tím - cam
    const gridMat = new THREE.MeshStandardMaterial({
      color: 0x6d28d9, // Tím Neon rực rỡ
      wireframe: true,
      roughness: 0.25,
      metalness: 0.85,
      emissive: 0x2e1065,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.48,
    });

    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    gridMesh.position.set(0, -3.2, -4);
    arenaRoot.add(gridMesh);

    // ═══════════════════════════════════════════════════════════════
    // 4. BỘ SƯU TẬP TINH THỂ LOOT & HỘP QUÀ CYBER 3D LƠ LỬNG
    // ═══════════════════════════════════════════════════════════════
    interface FloatingLootItem {
      group: THREE.Group;
      baseY: number;
      floatSpeed: number;
      floatOffset: number;
      rotSpeedX: number;
      rotSpeedY: number;
      rotSpeedZ: number;
    }

    const lootItems: FloatingLootItem[] = [];

    // Vật liệu thủy tinh ngọc tinh thể Loot phát quang
    const amberCrystalMat = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.4,
      roughness: 0.15,
      metalness: 0.3,
      transparent: true,
      opacity: 0.88,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });

    const purpleCrystalMat = new THREE.MeshPhysicalMaterial({
      color: 0x8b5cf6,
      emissive: 0x6d28d9,
      emissiveIntensity: 0.45,
      roughness: 0.12,
      metalness: 0.35,
      transparent: true,
      opacity: 0.88,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });

    const cyanCrystalMat = new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      emissive: 0x0891b2,
      emissiveIntensity: 0.4,
      roughness: 0.15,
      metalness: 0.4,
      transparent: true,
      opacity: 0.85,
      clearcoat: 1.0,
    });

    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0xb45309,
      emissiveIntensity: 0.3,
    });

    const neonWireMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 2,
    });

    // Hàm tạo 1 Hộp Loot Box Cyber với khung viền phát sáng
    const createCyberLootBox = (size: number, colorMat: THREE.Material) => {
      const boxGroup = new THREE.Group();

      // Khối lõi pha lê
      const coreGeo = new THREE.BoxGeometry(size, size, size);
      const coreMesh = new THREE.Mesh(coreGeo, colorMat);
      boxGroup.add(coreMesh);

      // Khung viền kim loại công nghệ
      const edges = new THREE.EdgesGeometry(coreGeo);
      const lineMesh = new THREE.LineSegments(edges, neonWireMat);
      boxGroup.add(lineMesh);

      // Khung đai vàng bảo vệ bên ngoài
      const ringGeo = new THREE.TorusGeometry(size * 0.85, 0.025, 8, 24);
      const ringMesh = new THREE.Mesh(ringGeo, goldTrimMat);
      ringMesh.rotation.x = Math.PI / 4;
      boxGroup.add(ringMesh);

      return boxGroup;
    };

    // Hàm tạo 1 Viên Tinh thể Đa diện (Octahedron / Icosahedron)
    const createLootGem = (radius: number, detail: number, colorMat: THREE.Material) => {
      const gemGroup = new THREE.Group();

      const gemGeo = detail === 0 ? new THREE.OctahedronGeometry(radius, 0) : new THREE.IcosahedronGeometry(radius, 0);
      const gemMesh = new THREE.Mesh(gemGeo, colorMat);
      gemGroup.add(gemMesh);

      // Viền sáng các cạnh của viên tinh thể
      const gemEdges = new THREE.EdgesGeometry(gemGeo);
      const gemLine = new THREE.LineSegments(gemEdges, neonWireMat);
      gemGroup.add(gemLine);

      return gemGroup;
    };

    // Cấu hình các vật phẩm Loot lơ lửng trong không gian
    const lootConfigs = [
      // 1. Tinh thể cam hổ phách trung tâm bên trái (lớn)
      { type: "gem", x: -4.5, y: 1.2, z: 2.5, scale: 0.95, mat: amberCrystalMat, detail: 0 },
      // 2. Hộp Cyber Loot tím bí ẩn bên phải (lớn)
      { type: "box", x: 4.8, y: 0.8, z: 2.2, scale: 0.88, mat: purpleCrystalMat },
      // 3. Tinh thể Cyan công nghệ ở giữa cao hơn (trung bình)
      { type: "gem", x: -2.2, y: 2.8, z: 0.5, scale: 0.65, mat: cyanCrystalMat, detail: 1 },
      // 4. Hộp Loot vàng kim ở góc phải phía xa
      { type: "box", x: 3.6, y: 2.5, z: -1.5, scale: 0.72, mat: amberCrystalMat },
      // 5. Tinh thể tím đa giác ở góc trái phía xa
      { type: "gem", x: -5.8, y: -0.6, z: 0.8, scale: 0.8, mat: purpleCrystalMat, detail: 1 },
      // 6. Hộp Loot nhỏ ở tầng thấp bên phải
      { type: "box", x: 2.2, y: -1.2, z: 3.2, scale: 0.48, mat: cyanCrystalMat },
      // 7. Tinh thể ngọc lục lam nhỏ lơ lửng
      { type: "gem", x: -1.2, y: -1.8, z: 1.8, scale: 0.42, mat: amberCrystalMat, detail: 0 },
      // 8. Tinh thể Loot xa trung tâm tạo độ sâu
      { type: "gem", x: 1.5, y: 3.2, z: -3.5, scale: 0.75, mat: purpleCrystalMat, detail: 0 },
    ];

    lootConfigs.forEach((cfg, idx) => {
      const lootObj = cfg.type === "box" 
        ? createCyberLootBox(cfg.scale, cfg.mat) 
        : createLootGem(cfg.scale, cfg.detail || 0, cfg.mat);

      lootObj.position.set(cfg.x, cfg.y, cfg.z);
      arenaRoot.add(lootObj);

      lootItems.push({
        group: lootObj,
        baseY: cfg.y,
        floatSpeed: 0.8 + (idx % 4) * 0.25,
        floatOffset: idx * 1.3,
        rotSpeedX: 0.008 + (idx % 3) * 0.004,
        rotSpeedY: 0.012 + (idx % 2) * 0.005,
        rotSpeedZ: 0.006 + (idx % 5) * 0.002,
      });
    });

    // ═══════════════════════════════════════════════════════════════
    // 5. VÒNG QUAY LƯỢNG TỬ ĐỒNG TÂM (QUANTUM HOLO RINGS)
    // ═══════════════════════════════════════════════════════════════
    const ringGroup = new THREE.Group();
    ringGroup.position.set(0, 0.4, -2.5);
    arenaRoot.add(ringGroup);

    const outerRingGeo = new THREE.TorusGeometry(3.6, 0.02, 12, 64);
    const outerRing = new THREE.Mesh(outerRingGeo, amberCrystalMat);
    outerRing.rotation.x = Math.PI / 3;
    ringGroup.add(outerRing);

    const innerRingGeo = new THREE.TorusGeometry(2.4, 0.02, 12, 48);
    const innerRing = new THREE.Mesh(innerRingGeo, purpleCrystalMat);
    innerRing.rotation.y = Math.PI / 4;
    ringGroup.add(innerRing);

    // ═══════════════════════════════════════════════════════════════
    // 6. BỤI HẠT NĂNG LƯỢNG MA TRẬN CYBER (MATRIX CYBER PARTICLES)
    // ═══════════════════════════════════════════════════════════════
    const particleCount = 450;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleSeeds = new Float32Array(particleCount);

    const colorPalette = [
      new THREE.Color(0xf59e0b), // Cam hổ phách
      new THREE.Color(0x8b5cf6), // Tím Cyberpunk
      new THREE.Color(0x06b6d4), // Cyan Neon
      new THREE.Color(0xffffff), // Trắng phát quang
    ];

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3 + 0] = (Math.random() - 0.5) * 28;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 16;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 22;

      const col = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      particleColors[i * 3 + 0] = col.r;
      particleColors[i * 3 + 1] = col.g;
      particleColors[i * 3 + 2] = col.b;

      particleSeeds[i] = Math.random() * Math.PI * 2;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

    // Canvas texture tạo đốm sáng tròn mềm mại
    const particleCanvas = document.createElement("canvas");
    particleCanvas.width = 32;
    particleCanvas.height = 32;
    const pCtx = particleCanvas.getContext("2d");
    if (pCtx) {
      const gradient = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.3, "rgba(240, 240, 255, 0.8)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      pCtx.fillStyle = gradient;
      pCtx.fillRect(0, 0, 32, 32);
    }
    const particleTexture = new THREE.CanvasTexture(particleCanvas);

    const particleMat = new THREE.PointsMaterial({
      size: 0.16,
      map: particleTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.75,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    arenaRoot.add(particles);

    // ═══════════════════════════════════════════════════════════════
    // 7. TƯƠNG TÁC CHUỘT / TOUCH PARALLAX
    // ═══════════════════════════════════════════════════════════════
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;
      targetMouseX = normX * 0.45;
      targetMouseY = normY * 0.35;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const normX = (touch.clientX / window.innerWidth) * 2 - 1;
        const normY = -(touch.clientY / window.innerHeight) * 2 + 1;
        targetMouseX = normX * 0.45;
        targetMouseY = normY * 0.35;
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    // Handle Resize
    const handleResize = () => {
      if (!renderer || !camera) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // ═══════════════════════════════════════════════════════════════
    // 8. RENDER & ANIMATION LOOP (MƯỢT MÀ 60FPS)
    // ═══════════════════════════════════════════════════════════════
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // 1. Quán tính chuột Parallax mượt mà (Smooth Lerp)
      currentMouseX += (targetMouseX - currentMouseX) * 0.04;
      currentMouseY += (targetMouseY - currentMouseY) * 0.04;

      arenaRoot.rotation.y = currentMouseX * 0.5;
      arenaRoot.rotation.x = -currentMouseY * 0.3;

      // 2. Sóng lưới Synthwave Grid chuyển động uốn lượn
      const positions = gridGeo.attributes.position;
      const vertexCount = positions.count;
      for (let i = 0; i < vertexCount; i++) {
        const u = originalPositions[i * 3 + 0];
        const v = originalPositions[i * 3 + 1];

        // Sóng sin phức hợp trôi dạt theo thời gian
        const wave1 = Math.sin(u * 0.35 + elapsed * 1.4) * 0.65;
        const wave2 = Math.cos(v * 0.45 + elapsed * 1.1) * 0.55;
        const wave3 = Math.sin((u + v) * 0.25 + elapsed * 0.9) * 0.4;

        positions.setZ(i, originalPositions[i * 3 + 2] + wave1 + wave2 + wave3);
      }
      positions.needsUpdate = true;

      // 3. Tinh thể Loot & Hộp Cyber nhấp nhô lơ lửng & xoay quanh trục
      lootItems.forEach((item) => {
        // Nhấp nhô bồng bềnh êm ái
        item.group.position.y = item.baseY + Math.sin(elapsed * item.floatSpeed + item.floatOffset) * 0.18;
        // Xoay tròn đều
        item.group.rotation.x += item.rotSpeedX;
        item.group.rotation.y += item.rotSpeedY;
        item.group.rotation.z += item.rotSpeedZ;
      });

      // 4. Vòng quay lượng tử đồng tâm
      outerRing.rotation.z = elapsed * 0.35;
      innerRing.rotation.x = -elapsed * 0.45;

      // 5. Bụi hạt bay bổng trong không gian
      const pPositions = particleGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        // Hạt từ từ trôi lên trên
        pPositions[i * 3 + 1] += 0.008;
        if (pPositions[i * 3 + 1] > 9) {
          pPositions[i * 3 + 1] = -8;
        }

        // Dao động ngang nhẹ nhàng
        pPositions[i * 3 + 0] += Math.sin(elapsed * 0.8 + particleSeeds[i]) * 0.004;
      }
      particleGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // ═══════════════════════════════════════════════════════════════
    // 9. CLEANUP MEMORY KHI UNMOUNT
    // ═══════════════════════════════════════════════════════════════
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("resize", handleResize);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      renderer.dispose();
      gridGeo.dispose();
      gridMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      particleTexture.dispose();
      outerRingGeo.dispose();
      innerRingGeo.dispose();
      amberCrystalMat.dispose();
      purpleCrystalMat.dispose();
      cyanCrystalMat.dispose();
      goldTrimMat.dispose();
      neonWireMat.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 z-0 opacity-75 dark:opacity-90 transition-opacity duration-700 overflow-hidden pointer-events-none"
      id="cyber-arena-loot-3d-canvas"
    />
  );
}
