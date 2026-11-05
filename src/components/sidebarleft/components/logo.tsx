"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";

export default function Logo({
  onMenuToggle,
}: {
  onMenuToggle?: () => void;
}) {
  return (
    /* h-12 là khung chuẩn của Navbar */
    <div className="relative flex items-center justify-between h-12 bg-transparent px-4">
      
      {/* 1. NÚT MENU: chỉ hiện khi có handler (tránh nút "chết" không tác dụng) */}
      {onMenuToggle && (
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label="Mở menu"
          className="relative z-50 text-[rgb(var(--text-main))] p-2 sm:hidden hover:bg-black/5 dark:hover:bg-white/10 rounded-md active:scale-90 transition-transform"
        >
          <Menu className="w-8 h-8" />
        </button>
      )}

      {/* 2. KHU VỰC LOGO: Căn giữa tuyệt đối */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Link
          href="/"
          className="relative w-40 h-12 flex items-center justify-center pointer-events-auto group"
        >
          <Image
            src="/logo.png"
            alt="NexLoot"
            width={632}
            height={107}
            priority
            /**
             * GIỮ MÀU GỐC VÀ LÀM RỰC SÁNG:
             * - dark:brightness-[1.5]: Tăng độ sáng của ảnh gốc lên 150%.
             * - dark:saturate-[1.2]: Đẩy màu sắc rực rỡ hơn một chút để không bị bạc màu.
             * - dark:drop-shadow: Tạo quầng sáng (Glow) xung quanh để logo nổi lên khỏi nền đen.
             */
            className="absolute max-none w-auto h-[280%] md:h-[380%] 
                       object-contain object-center pointer-events-none z-0
                       drop-shadow-[0_12px_24px_rgba(0,0,0,0.15)]
                       
                       dark:brightness-[1.5] 
                       dark:saturate-[1.3]
                       dark:drop-shadow-[0_0_20px_rgba(255,255,255,0.25)]
                       
                       transition-all duration-500
                       translate-y-1" 
          />
          
          {/* Lớp đệm click: group-hover để sau này thêm hiệu ứng hover nếu cần */}
          <div className="absolute inset-0 z-10" />
        </Link>
      </div>

      {/* 3. VÙNG TRỐNG BÊN PHẢI: Để cân bằng layout cho Flexbox */}
      <div className="w-10 h-10 sm:hidden"></div>
    </div>
  );
}