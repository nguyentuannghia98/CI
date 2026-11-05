"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import SearchInput from "@/components/Search/components/SearchInput";
// Đã loại bỏ SuggestionsList vì không hiển thị gợi ý khi gõ nữa
import { useSearchHistory } from "@/components/Search/hooks/useSearchHistory";
// Giữ lại types nếu cần thiết cho các phần khác, nhưng không dùng hook gợi ý nữa

type Props = {
  userId?: string;
  onSearch?: (q: string) => void;
};

export default function SearchBar({ userId, onSearch }: Props) {
  const [query, setQuery] = useState("");
  // showDropdown có thể giữ lại nếu bạn vẫn muốn hiện lịch sử tìm kiếm, 
  // nhưng ở đây mình sẽ ẩn đi theo yêu cầu "chỉ Enter để lọc" của bạn.
  const [, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { saveHistory } = useSearchHistory(userId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. Xử lý Submit (Nhấn Enter)
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    onSearch?.(trimmedQuery);
    if (userId) await saveHistory(userId, trimmedQuery);
    
    setShowDropdown(false);
    
    // ĐIỀU CHỈNH: Điều hướng về trang chủ kèm tham số ?search để lọc sản phẩm
    // Thay vì dùng `/search?q=`, ta dùng `/` để lọc ngay tại trang chủ
    router.push(`/?search=${encodeURIComponent(trimmedQuery)}`);
  }, [query, userId, onSearch, saveHistory, router]);

  return (
    <div ref={containerRef} className="relative w-full group">
      <SearchInput
        value={query}
        onChange={(v) => {
          setQuery(v);
        }}
        onSubmit={handleSubmit}
        // Bạn có thể giữ hoặc bỏ onFocus tùy vào việc có muốn hiện lịch sử search cũ hay không
        onFocus={() => setShowDropdown(true)}
      />

      {/* PHẦN THAY ĐỔI:
          Đã loại bỏ SuggestionsList hoàn toàn khỏi giao diện khi gõ.
          Nếu bạn vẫn muốn hiện Lịch sử tìm kiếm (History) khi Click vào ô input,
          bạn có thể giữ lại SuggestionsList nhưng truyền mảng rỗng vào kết quả (results={[]}).
      */}
    </div>
  );
}