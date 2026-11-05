"use client";

import React, { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  TrendingUp, Zap, 
  Globe, 
  CheckCircle2, ShieldCheck,
  MousePointer2, Sparkles, Search, Compass, Layers
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import CommunityCard from "@/components/Discover/Component/CommunityCard";
import { useUser } from "@/components/auth/store/AuthStore";
import type { Database } from "@/types/supabase";

type CommunityRaw = Database["public"]["Tables"]["communities"]["Row"];

export interface Community extends CommunityRaw {
  community_members: { user_id: string }[];
  isJoined: boolean;
}

export default function CommunitiesView() {
  const supabase = createClient();
  const [selectedCategory, setSelectedCategory] = useState<string>("Tất cả");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState<number>(9);
  
  // 1. Lấy userId trực tiếp từ AuthStore
  const user = useUser();
  const userId = user?.id;

  // 2. Query danh sách cộng đồng
  const { data: communities = [], isLoading } = useQuery<Community[]>({
    queryKey: ["communities", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communities")
        .select(`*, community_members(user_id)`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rawData = data as (CommunityRaw & { community_members: { user_id: string }[] | null })[];

      return rawData.map((c) => ({
        ...c,
        community_members: c.community_members || [],
        isJoined: Array.isArray(c.community_members) && 
                  c.community_members.some((m: { user_id: string }) => m.user_id === userId),
      }));
    },
    staleTime: 1000 * 60 * 5, // Cache trong 5 phút
  });

  // 3. Xử lý Categories từ dữ liệu đã fetch
  const categories = useMemo(() => {
    const set = new Set<string>();
    communities.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return ["Tất cả", ...Array.from(set)];
  }, [communities]);

  // 4. Lọc cộng đồng theo Category và Search
  const filteredCommunities = useMemo(() => {
    return communities.filter((c) => {
      const matchCat = selectedCategory === "Tất cả" || c.category === selectedCategory;
      const matchSearch = !searchQuery.trim() || 
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [communities, selectedCategory, searchQuery]);

  const featured = useMemo(() => filteredCommunities.slice(0, 3), [filteredCommunities]);
  const others = useMemo(() => filteredCommunities.slice(3, visibleCount), [filteredCommunities, visibleCount]);
  const hasMore = filteredCommunities.length > visibleCount;

  if (isLoading) {
    return (
      <div 
        className="flex items-center justify-center min-h-[80vh] transition-colors duration-300" 
        style={{ backgroundColor: 'rgb(var(--bg-surface))' }}
      >
        <div className="flex flex-col items-center gap-5 p-8 rounded-3xl border border-white/10 bg-[rgb(var(--bg-card))]/50 backdrop-blur-md shadow-2xl">
          <div className="relative w-14 h-14">
            <div className="w-14 h-14 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
            <Sparkles className="w-6 h-6 text-amber-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-orange-400 animate-pulse">
            Đang tải dữ liệu...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen font-sans selection:bg-orange-500/20 selection:text-orange-500 relative transition-colors duration-300 pb-20 overflow-x-hidden" 
      style={{ backgroundColor: 'rgb(var(--bg-surface))', color: 'rgb(var(--text-main))' }}
    >
      {/* Background Glow Orbs cao cấp */}
      <div className="absolute top-0 inset-x-0 h-[650px] pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[120px] left-[15%] w-[45%] h-[550px] bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-transparent rounded-full blur-[140px]" />
        <div className="absolute -top-[100px] right-[10%] w-[40%] h-[500px] bg-gradient-to-bl from-purple-600/15 via-indigo-500/10 to-transparent rounded-full blur-[140px]" />
        <div className="absolute top-[350px] left-[30%] w-[40%] h-[300px] bg-orange-400/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 relative z-10">
        
        {/* ========================================================================= */}
        {/* HERO SECTION HIỆN ĐẠI & SANG TRỌNG */}
        {/* ========================================================================= */}
        <header className="mb-14 relative">
          <div className="max-w-4xl space-y-6">
            
            {/* Badges */}
            <div className="flex items-center gap-3 flex-wrap">
              <div 
                className="inline-flex items-center gap-2 px-4 py-1.5 border rounded-full text-xs font-bold uppercase tracking-widest cursor-default shadow-sm backdrop-blur-md"
                style={{ 
                  backgroundColor: 'rgb(var(--bg-card))', 
                  borderColor: 'rgba(var(--border-main), 0.6)', 
                  color: 'rgb(var(--text-main))' 
                }}
              >
                <Compass className="w-3.5 h-3.5 text-orange-400" />
                Khám phá
              </div>

              <span 
                className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-400 cursor-default"
              >
                <Globe size={13} className="animate-spin-slow" />
                Cộng đồng trực tuyến
              </span>
            </div>

            {/* Tiêu đề chính lớn */}
            <h1 
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.08] uppercase" 
              style={{ color: 'rgb(var(--text-main))' }}
            >
              Mạng lưới <br />
              <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent italic underline decoration-orange-400/30 underline-offset-8">
                Tri thức
              </span>{" "}
              hữu ích.
            </h1>

            {/* Đoạn mô tả */}
            <p 
              className="text-lg sm:text-xl md:text-2xl leading-relaxed font-normal max-w-3xl" 
              style={{ color: 'rgb(var(--text-muted))' }}
            >
              Nơi kết nối, học hỏi và chia sẻ kinh nghiệm cùng{" "}
              <span className="font-bold text-orange-400">{communities.length}+</span> cộng đồng chuyên sâu.
            </p>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* THANH TÌM KIẾM & BỘ LỌC DANH MỤC CATEGORIES */}
        {/* ========================================================================= */}
        <div className="sticky top-4 z-40 mb-16 space-y-4">
          <div 
            className="p-3 sm:p-4 rounded-3xl shadow-2xl border backdrop-blur-2xl transition-all duration-300 flex flex-col md:flex-row items-center gap-3"
            style={{ 
              backgroundColor: 'rgba(var(--bg-card), 0.88)', 
              borderColor: 'rgba(var(--border-main), 0.5)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)' 
            }}
          >
            {/* Ô tìm kiếm thông minh */}
            <div 
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border w-full md:w-80 shrink-0 transition-all focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500/60"
              style={{ 
                backgroundColor: 'rgb(var(--bg-surface))', 
                borderColor: 'rgba(var(--border-main), 0.4)' 
              }}
            >
              <Search className="w-4 h-4 text-orange-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm cộng đồng theo tên..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400 font-medium"
                style={{ color: 'rgb(var(--text-main))' }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-zinc-400 hover:text-orange-400 font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dải nút danh mục trượt ngang */}
            <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full py-1">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                const count = cat === "Tất cả" 
                  ? communities.length 
                  : communities.filter(c => c.category === cat).length;

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 whitespace-nowrap cursor-pointer flex items-center gap-2 shrink-0
                      ${isSelected 
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25 scale-[1.03]" 
                        : "hover:bg-orange-500/10 border border-transparent hover:border-orange-500/20"
                      }
                    `}
                    style={!isSelected ? { color: 'rgb(var(--text-muted))' } : {}}
                  >
                    <span>{cat}</span>
                    <span 
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold
                        ${isSelected ? "bg-black/20 text-white" : "bg-zinc-500/10 text-zinc-400"}
                      `}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* NỘI DUNG CỘNG ĐỒNG */}
        {/* ========================================================================= */}
        <div className="space-y-24">
          
          {/* 1. SECTION TIÊU BIỂU */}
          {featured.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-8 px-2 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 shadow-sm">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <h2 
                      className="text-2xl sm:text-3xl font-black uppercase tracking-tight" 
                      style={{ color: 'rgb(var(--text-main))' }}
                    >
                      Tiêu biểu
                    </h2>
                    <p className="text-xs text-orange-400 font-semibold tracking-wide">
                      Cộng đồng sôi nổi và đông đảo thành viên nhất
                    </p>
                  </div>
                </div>

                <span className="text-xs font-semibold px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400">
                  {featured.length} nhóm nổi bật
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {featured.map((c) => (
                  <div key={c.id} className="transition-all cursor-pointer">
                    <CommunityCard community={c} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 2. BENEFIT CARDS (BENTO BOX CÔNG NGHỆ CAO) */}
          <section className="relative">
            <div 
              className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 sm:p-12 rounded-3xl border border-white/10 dark:border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-md"
              style={{ 
                backgroundColor: 'rgba(var(--bg-card), 0.5)',
                borderColor: 'rgba(var(--border-main), 0.4)' 
              }}
            >
              {/* Ánh sáng nền bên trong card */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent blur-3xl pointer-events-none" />

              {[
                { 
                  icon: <CheckCircle2 size={30} className="text-blue-400" />, 
                  title: "Chất lượng", 
                  desc: "Các cộng đồng được kiểm duyệt nội dung kỹ lưỡng.",
                  glow: "from-blue-500/15 via-blue-500/5 to-transparent",
                  border: "hover:border-blue-500/40"
                },
                { 
                  icon: <ShieldCheck size={30} className="text-emerald-400" />, 
                  title: "Bảo mật", 
                  desc: "Thông tin thành viên luôn được bảo vệ an toàn.",
                  glow: "from-emerald-500/15 via-emerald-500/5 to-transparent",
                  border: "hover:border-emerald-500/40"
                },
                { 
                  icon: <Zap size={30} className="text-orange-400" />, 
                  title: "Tốc độ", 
                  desc: "Kết nối và trao đổi dữ liệu tức thì.",
                  glow: "from-orange-500/15 via-orange-500/5 to-transparent",
                  border: "hover:border-orange-500/40"
                }
              ].map((item, i) => (
                <div 
                  key={i} 
                  className={`group relative flex flex-col items-center text-center p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${item.border}`}
                  style={{ 
                    backgroundColor: 'rgb(var(--bg-surface))',
                    borderColor: 'rgba(var(--border-main), 0.3)' 
                  }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-b ${item.glow} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
                  
                  <div 
                    className="p-5 rounded-2xl shadow-xl transition-transform duration-300 group-hover:scale-110 mb-5 relative z-10 border border-white/10"
                    style={{ backgroundColor: 'rgb(var(--bg-card))' }}
                  >
                    {item.icon}
                  </div>
                  <h4 
                    className="font-bold uppercase text-sm tracking-widest mb-2 relative z-10" 
                    style={{ color: 'rgb(var(--text-main))' }}
                  >
                    {item.title}
                  </h4>
                  <p 
                    className="text-sm font-normal leading-relaxed relative z-10" 
                    style={{ color: 'rgb(var(--text-muted))' }}
                  >
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 3. SECTION TẤT CẢ CỘNG ĐỒNG */}
          {others.length > 0 && (
            <section className="pb-12">
              <div className="flex items-center justify-between mb-8 px-2 flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-sm">
                    <Layers size={24} />
                  </div>
                  <h2 
                    className="text-2xl sm:text-3xl font-black uppercase tracking-tight" 
                    style={{ color: 'rgb(var(--text-main))' }}
                  >
                    Tất cả cộng đồng
                  </h2>
                </div>

                <span className="text-xs font-semibold px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
                  {filteredCommunities.length} nhóm khả dụng
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {others.map((c) => (
                  <div key={c.id} className="transition-all cursor-pointer">
                    <CommunityCard community={c} />
                  </div>
                ))}
              </div>

              {/* Nút Xem thêm cộng đồng */}
              {hasMore && (
                <div className="mt-16 flex justify-center">
                  <button 
                    onClick={() => setVisibleCount((prev) => prev + 6)}
                    className="px-8 sm:px-10 py-4 sm:py-5 rounded-2xl text-xs sm:text-sm font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-3 shadow-xl hover:scale-105 active:scale-95 cursor-pointer bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white shadow-orange-500/25 border border-orange-400/40"
                  >
                    Xem thêm cộng đồng <MousePointer2 size={16} />
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Khi không có kết quả tìm kiếm */}
          {filteredCommunities.length === 0 && (
            <div 
              className="py-20 text-center rounded-3xl border p-8 space-y-4"
              style={{ 
                backgroundColor: 'rgb(var(--bg-card))',
                borderColor: 'rgba(var(--border-main), 0.4)' 
              }}
            >
              <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mx-auto text-2xl">
                🔍
              </div>
              <h3 className="text-xl font-bold uppercase tracking-tight" style={{ color: 'rgb(var(--text-main))' }}>
                Không tìm thấy cộng đồng phù hợp
              </h3>
              <p className="text-sm max-w-md mx-auto" style={{ color: 'rgb(var(--text-muted))' }}>
                Thử đổi từ khóa tìm kiếm hoặc chọn danh mục khác để khám phá các nhóm đang hoạt động.
              </p>
              <button
                onClick={() => { setSelectedCategory("Tất cả"); setSearchQuery(""); }}
                className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-orange-500 text-white hover:bg-orange-600 transition-all cursor-pointer"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          )}

        </div>
      </div>

      {/* ========================================================================= */}
      {/* FOOTER HIỆN ĐẠI & SANG TRỌNG */}
      {/* ========================================================================= */}
      <footer 
        className="py-14 mt-20 border-t transition-colors duration-300 relative z-10" 
        style={{ 
          backgroundColor: 'rgb(var(--bg-surface))', 
          borderColor: 'rgba(var(--border-main), 0.3)' 
        }}
      >
        <div 
          className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8 text-[12px] font-semibold uppercase tracking-widest" 
          style={{ color: 'rgb(var(--text-muted))' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl text-white flex items-center justify-center font-black text-base shadow-md shadow-orange-500/30 cursor-pointer">
              H
            </div>
            <span className="cursor-default">© 2026 Community Ecosystem</span>
          </div>

          <div className="flex gap-8">
            <span className="hover:text-orange-400 cursor-pointer transition-colors">Hỗ trợ</span>
            <span className="hover:text-orange-400 cursor-pointer transition-colors">Quy định</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
