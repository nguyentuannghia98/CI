"use client";

import { Search, X, SlidersHorizontal } from "lucide-react";

interface ArenaFilterProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  statusFilter: "ALL" | "WAITING" | "FULL" | "CANCELLED";
  setStatusFilter: (s: "ALL" | "WAITING" | "FULL" | "CANCELLED") => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  categories: string[];
}

export function ArenaFilter({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  selectedCategory,
  setSelectedCategory,
  categories,
}: ArenaFilterProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Ô Tìm kiếm */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-500/70" size={18} />
          <input
            type="text"
            placeholder="Tìm sản phẩm, tên shop trong Arena..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl border outline-none text-sm transition-all focus:ring-2 focus:ring-orange-500/30"
            style={{
              backgroundColor: "rgb(var(--bg-card))",
              borderColor: "rgba(var(--border-main), 0.25)",
              color: "rgb(var(--text-main))",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-60 hover:opacity-100"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Lọc Trạng thái phòng */}
        <div
          className="flex items-center gap-1 p-1 rounded-2xl border"
          style={{
            borderColor: "rgba(var(--border-main), 0.2)",
            backgroundColor: "rgb(var(--bg-card))",
          }}
        >
          {(
            [
              { key: "ALL", label: "Tất cả" },
              { key: "WAITING", label: "Đang mở" },
              { key: "FULL", label: "Đã đầy" },
              { key: "CANCELLED", label: "Đã hủy" },
            ] as const
          ).map((st) => (
            <button
              key={st.key}
              onClick={() => setStatusFilter(st.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === st.key
                  ? "bg-orange-500 text-white shadow-sm"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lọc theo Danh mục */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-semibold flex items-center gap-1 shrink-0" style={{ color: "rgb(var(--text-muted))" }}>
          <SlidersHorizontal size={13} /> Danh mục:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
              selectedCategory === cat
                ? "bg-orange-500/10 border-orange-500/40 text-orange-500 font-bold"
                : "border-transparent opacity-70 hover:opacity-100"
            }`}
            style={{
              backgroundColor: selectedCategory === cat ? undefined : "rgba(var(--border-main), 0.05)",
            }}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}