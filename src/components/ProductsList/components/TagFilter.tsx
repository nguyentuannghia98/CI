"use client";

import React, { memo, useMemo } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type TagFilterProps = {
  activeTag: string | null;
  onClear: () => void;
  setActiveTag: (tag: string | null) => void;
  availableTags: string[];
};

const TagFilter = memo(({ activeTag, onClear, setActiveTag, availableTags }: TagFilterProps) => {
  // TỐI ƯU 1: Memoize việc kiểm tra mảng để tránh tính toán lại mỗi lần cha render
  const hasTags = useMemo(() => availableTags && availableTags.length > 0, [availableTags]);

  if (!activeTag && !hasTags) return null;

  return (
    <div className="space-y-4 mb-6">
      {/* 1. HIỂN THỊ DANH SÁCH TAGS (Scroll ngang mượt hơn) */}
      <div className="group relative">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
          <div className="flex gap-2">
            {availableTags.map((tag) => {
              const isActive = activeTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setActiveTag(isActive ? null : tag)}
                  // TỐI ƯU 2: Sử dụng class-based transition thay vì motion.button cho list dài để tiết kiệm CPU
                  className={`flex-shrink-0 px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 border will-change-transform active:scale-95 ${
                    isActive
                      ? "bg-pink-600 border-pink-600 text-white shadow-md shadow-pink-100 ring-2 ring-pink-100"
                      : "bg-gray-50 border-transparent text-gray-500 hover:bg-white hover:border-pink-200 hover:text-pink-600"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. THANH THÔNG BÁO (Dùng Framer Motion để xử lý Entry/Exit mượt mà) */}
      <AnimatePresence mode="popLayout">
        {activeTag && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center"
          >
            <div className="flex items-center bg-white border border-pink-100 pl-4 pr-2 py-1.5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <span className="text-xs text-gray-500 select-none flex items-center gap-1.5 font-medium">
                Đang xem: 
                <span className="text-pink-600 font-black italic">#{activeTag}</span>
              </span>
              
              <div className="mx-3 w-[1px] h-3 bg-gray-200" />

              <button
                onClick={onClear}
                className="group p-1.5 rounded-xl hover:bg-pink-50 text-pink-400 hover:text-pink-600 transition-all flex items-center gap-1"
                aria-label="Clear filter"
              >
                <span className="text-[10px] font-black uppercase ml-1">Bỏ lọc</span>
                <X size={14} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

TagFilter.displayName = "TagFilter";

export default TagFilter;