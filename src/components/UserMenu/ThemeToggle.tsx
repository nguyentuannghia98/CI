"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Kiểm tra xem theme hiện tại có phải là dark hay không
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`
        w-full flex items-center gap-4 px-6 py-4 text-[15px] font-medium transition-colors cursor-pointer
        ${isDark ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-50"}
      `}
    >
      <div className="flex items-center justify-center w-5 h-5">
        {/* ĐÃ CHỈNH NGƯỢC LẠI: Đang tối thì hiện Mặt trời, đang sáng hiện Mặt trăng */}
        {isDark ? (
          <Sun size={20} className="text-orange-400" />
        ) : (
          <Moon size={20} className="text-indigo-400" />
        )}
      </div>

      <span className="flex-1 text-left">
        {/* ĐÃ CHỈNH NGƯỢC LẠI: Đang tối thì mời gọi bật "Chế độ Sáng" */}
        {isDark ? "Chế độ Sáng" : "Chế độ Tối"}
      </span>

      <span className="text-[10px] opacity-40 uppercase tracking-wider font-bold">
        {/* Phần badge nhỏ này thường để báo trạng thái hiện tại, nhưng mình cũng đảo luôn cho đồng bộ ý bạn */}
        {isDark ? "Light Mode" : "Dark Mode"}
      </span>
    </button>
  );
}