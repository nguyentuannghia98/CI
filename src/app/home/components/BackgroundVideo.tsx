"use client";

import { useState } from "react";

interface BackgroundVideoProps {
  /**
   * Link video mp4 nền (mặc định là video motion đồ họa công nghệ số học / cyber matrix chất lượng cao)
   */
  videoSrc?: string;
  posterSrc?: string;
}

/**
 * BackgroundVideo Component - Giải pháp nền Video điện ảnh thay thế cho 3D Canvas
 * Ưu điểm:
 * - Không bị vỡ khối, không bị góc cạnh thô của mô hình tự dựng.
 * - Hiệu năng cực nhẹ, GPU giải mã video phần cứng, không gây nóng máy hoặc giật lag.
 * - Có lớp phủ gradient tinh tế (Dark Cinematic Overlay + Vignette) giúp làm nổi bật chữ Hero và các nút bấm.
 */
export default function BackgroundVideo({
  videoSrc = "https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4",
  posterSrc = "/nen.png",
}: BackgroundVideoProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 1. Thẻ Video HTML5 Loop Autoplay Muted */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster={posterSrc}
        onLoadedData={() => setIsLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          isLoaded ? "opacity-60 dark:opacity-75" : "opacity-0"
        }`}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* 2. Lớp phủ Gradient điện ảnh (Cinematic Cyberpunk Vignette & Overlays) */}
      {/* Lớp tối phía trên và dưới để hòa quyện vào giao diện Dark mode của NexLoot */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-[#070913]" />

      {/* Ánh sáng cam ấm NexLoot ở góc trên để ton-sur-ton với tông màu chủ đạo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-orange-500/15 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Lớp lưới Scanline nhẹ nhàng chuẩn Sci-Fi */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0) 50%, rgba(0, 0, 0, 0.5) 50%)",
          backgroundSize: "100% 4px",
        }}
      />
    </div>
  );
}
