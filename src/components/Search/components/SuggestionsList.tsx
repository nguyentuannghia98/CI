"use client";

import React from "react";
import Image from "next/image";
import { User, Tag, Users, Package } from "lucide-react";
import type { SuggestionItem, HistoryItem } from "@/components/Search/types/search";
// Import store của bạn (hãy điều chỉnh đường dẫn @/lib/Zustard/... nếu cần)
import { useProductStore } from "@/lib/Zustard/store/useProductStore";

type Props = {
  query: string;
  results: SuggestionItem[];
  loading: boolean;
  history: HistoryItem[];
  onSelect: (item: SuggestionItem) => void;
  onHistoryClick: (q: string) => void;
};

export default function SuggestionsList({
  query,
  results,
  loading,
  history,
  onSelect,
  onHistoryClick,
}: Props) {
  // Lấy hàm openDetail từ store bạn đã viết
  const openDetail = useProductStore((state) => state.openDetail);

  const handleItemClick = (item: SuggestionItem) => {
    // 1. Nếu là product, ta ưu tiên mở Modal trước
    if (item.type === "product") {
      openDetail(item.id);
      
      // 2. Dùng setTimeout để onSelect (đóng search) chạy sau một chút, 
      // tránh việc xung đột khiến Modal bị tắt đột ngột.
      setTimeout(() => {
        onSelect(item);
      }, 100);
    } else {
      // Các loại khác (user, tag...) thì chạy bình thường
      onSelect(item);
    }
  };

  return (
    <div className="absolute z-50 w-full mt-2 max-h-72 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-md">
      {loading && (
        <p className="text-xs text-gray-500 p-2">Đang tải...</p>
      )}

      {query && results.length > 0 && (
        <ul role="listbox" className="divide-y divide-gray-100">
          {results.map((item) => (
            <li
              key={`${item.type}-${item.id}`}
              role="option"
              aria-selected={false}
              tabIndex={0}
              onClick={() => handleItemClick(item)} // Sử dụng hàm handleItemClick đã chỉnh sửa
              className="flex items-center gap-2 p-2 hover:bg-blue-50 cursor-pointer transition-colors rounded-md"
            >
              {/* ---------- ICON / IMAGE ---------- */}
              <SuggestionIcon item={item} />

              {/* ---------- CONTENT ---------- */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">
                  {item.title}
                </p>

                {item.type === "product" && (
                  <p className="text-[10px] text-gray-500">
                    {item.price != null
                      ? `${item.price.toLocaleString()}₫`
                      : "Liên hệ"}
                  </p>
                )}

                {item.type === "user" && (
                  <p className="text-[10px] text-gray-500">
                    Người dùng
                  </p>
                )}

                {item.type === "tag" && (
                  <p className="text-[10px] text-gray-500">
                    Tag sản phẩm
                  </p>
                )}

                {item.type === "community" && (
                  <p className="text-[10px] text-gray-500">
                    Cộng đồng
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {query && !loading && results.length === 0 && (
        <p className="text-xs text-gray-500 p-2 text-center">
          Không tìm thấy kết quả
        </p>
      )}

      {!query && history.length > 0 && (
        <div className="p-2">
          <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">
            Tìm kiếm gần đây
          </p>
          {history.map((h, i) => (
            <button
              key={i}
              onClick={() => onHistoryClick(h.query)}
              className="block w-full text-left text-xs p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              {h.query}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Icon renderer (TS-safe) ---------- */

function SuggestionIcon({ item }: { item: SuggestionItem }) {
  if (
    (item.type === "product" ||
      item.type === "user" ||
      item.type === "community") &&
    item.image
  ) {
    return (
      <div className="w-8 h-8 relative rounded-md overflow-hidden shrink-0">
        <Image
          src={item.image}
          alt={item.title}
          fill
          sizes="32px"
          className="object-cover"
        />
      </div>
    );
  }

  switch (item.type) {
    case "product":
      return <Package size={16} />;
    case "user":
      return <User size={16} />;
    case "tag":
      return <Tag size={16} />;
    case "community":
      return <Users size={16} />;
    default:
      return null;
  }
}