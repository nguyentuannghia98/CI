"use client";

import { Search, Filter } from "lucide-react";

interface CommunityFiltersProps {
  query: string;
  setQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  categories: string[];
}

export default function CommunityFilters({
  query,
  setQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
}: CommunityFiltersProps) {
  return (
    /* FIX: 
       - Bỏ 'bg-white shadow-sm' để không tạo khối hộp xám.
       - Dùng 'bg-transparent' hoặc 'bg-white' không đổ bóng.
    */
    <section className="bg-white rounded-3xl p-2 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        
        {/* Search Input - Trắng tinh, viền mảnh, focus màu cam */}
        <div className="flex items-center gap-3 flex-1 border border-gray-100 rounded-2xl px-4 py-3 bg-white focus-within:ring-2 focus-within:ring-orange-100 focus-within:border-orange-500 transition-all">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên, mô tả hoặc chủ đề..."
            className="w-full outline-none bg-transparent text-[15px] text-gray-900 placeholder:text-gray-400 font-medium"
          />
        </div>

        {/* Category Filter - Đồng bộ với thanh search */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white border border-gray-100 focus-within:border-orange-500 transition-all">
            <Filter className="w-4 h-4 text-orange-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent outline-none text-[14px] text-gray-700 font-bold cursor-pointer min-w-[120px]"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}