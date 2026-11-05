"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence, motion, LazyMotion, domMax } from "framer-motion";
import { SearchX } from "lucide-react"; 

import { useViewStore } from "@/lib/Zustard/store/useViewStore"; 
import { useProductStore } from "@/lib/Zustard/store/useProductStore"; 
import type { Product } from "@/components/UniversalCard/types/type";

/* ================= TYPES ================= */
interface ProductsListProps {
  products: Product[];
  className?: string;
  showFilter?: boolean;
  onDelete?: (id: string) => void;
  onTagClick?: (tag: string) => void;
  isLoading?: boolean;
  isProfile?: boolean; 
  currentRole?: "mod" | "guest" | "member" | string | null;
  isCommunity?: boolean;
}

/* ================= SKELETON ================= */
const ProductsListSkeleton = ({ isGrid }: { isGrid: boolean }) => (
  <div className={`grid gap-4 sm:gap-6 w-full justify-items-center ${isGrid ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5" : "grid-cols-1"}`}>
    {[...Array(8)].map((_, i) => (
      <div key={i} className="bg-[rgb(var(--bg-card))] rounded-[2rem] p-3 border border-[rgb(var(--border-main))] w-full animate-pulse">
        <div className={`${isGrid ? "w-full aspect-square" : "w-32 h-32"} bg-[rgb(var(--bg-surface))] rounded-2xl mb-4`} />
        <div className="h-4 bg-[rgb(var(--bg-surface))] rounded-full w-3/4 mb-2" />
        <div className="h-4 bg-[rgb(var(--bg-surface))] rounded-full w-1/2" />
      </div>
    ))}
  </div>
);

const TagFilter = dynamic(() => import("./components/TagFilter"), { ssr: false });
const ProductsGrid = dynamic(() => import("./components/ProductsGrid"), { 
  ssr: true,
  loading: () => <ProductsListSkeleton isGrid={true} /> 
});

export default function ProductsList({
  products = [],
  className = "",
  showFilter = true,
  onDelete,
  onTagClick,
  isLoading = false,
  isProfile = false,
}: ProductsListProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const setStoreProducts = useProductStore((state) => state.setProducts);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search")?.toLowerCase() || "";
  const { viewMode } = useViewStore();

  // ✅ ĐỒNG BỘ STORE
  useEffect(() => {
    if (products.length > 0) {
      setStoreProducts(products);
    }
  }, [products, setStoreProducts]);

  const allAvailableTags = useMemo(() => {
    const tagsSet = new Set<string>();
    products.forEach((p) => p.tags?.forEach((t) => {
      // Đã loại bỏ chữ "bán" ra khỏi danh sách hiển thị tag
      if (t.toLowerCase() !== 'bán') {
        tagsSet.add(t);
      }
    }));
    return Array.from(tagsSet).sort();
  }, [products]);

  const visibleProducts = useMemo(() => {
    let filtered = products;
    if (searchQuery) {
      filtered = filtered.filter((p) => 
        p.title?.toLowerCase().includes(searchQuery) || 
        p.tags?.some(t => t.toLowerCase().includes(searchQuery))
      );
    }
    if (activeTag) {
      const lowerTag = activeTag.toLowerCase();
      filtered = filtered.filter((p) => p.tags?.some(t => t.toLowerCase() === lowerTag));
    }
    return filtered;
  }, [products, activeTag, searchQuery]);

  const handleSetTag = useCallback((tag: string | null) => {
    setActiveTag(tag);
    if (tag) onTagClick?.(tag);
  }, [onTagClick]);

  const handleResetAll = useCallback(() => {
    setActiveTag(null);
    if (searchQuery) {
      router.push(isProfile ? window.location.pathname : "/", { scroll: false });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchQuery, router, isProfile]);

  return (
    <LazyMotion features={domMax}>
      <div className={`w-full flex flex-col items-center space-y-8 ${className}`}>
        {!isLoading && showFilter && allAvailableTags.length > 0 && (
          <div className="w-full flex justify-center max-w-[1600px] mx-auto px-2">
            <TagFilter 
              activeTag={activeTag} 
              onClear={() => setActiveTag(null)}
              setActiveTag={handleSetTag}
              availableTags={allAvailableTags} 
            />
          </div>
        )}

        <AnimatePresence>
          {(activeTag || searchQuery) && !isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="flex items-center justify-between px-4 w-full max-w-[1600px]"
            >
              <div className="flex gap-3 items-center text-[10px] font-normal uppercase tracking-widest text-[rgb(var(--text-muted))]">
                {searchQuery && <span className="bg-blue-600 text-white px-3 py-1 rounded-full">&quot;{searchQuery}&quot;</span>}
                {activeTag && <span className="bg-fuchsia-600 text-white px-3 py-1 rounded-full">#{activeTag}</span>}
                <span className="opacity-50">({visibleProducts.length} sản phẩm)</span>
              </div>
              <button 
                onClick={handleResetAll} 
                className="text-[10px] font-normal text-red-500 hover:underline uppercase tracking-tighter transition-all cursor-pointer"
              >
                Xóa tất cả bộ lọc
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="min-h-[400px] w-full flex justify-center">
          {isLoading ? (
            <ProductsListSkeleton isGrid={viewMode === 'grid'} />
          ) : visibleProducts.length > 0 ? (
            <ProductsGrid
              products={visibleProducts}
              onDelete={onDelete}
              setActiveTag={handleSetTag}
              isProfile={isProfile} 
            />
          ) : (
            <EmptyState 
              onClear={handleResetAll} 
              message={searchQuery ? `Không tìm thấy kết quả cho "${searchQuery}"` : `Danh sách sản phẩm trống.`} 
            />
          )}
        </div>
      </div>
    </LazyMotion>
  );
}

const EmptyState = ({ onClear, message }: { onClear: () => void; message: string }) => (
  <div className="w-full max-w-2xl py-20 text-center border-2 border-dashed border-[rgb(var(--border-main))] rounded-[2.5rem] bg-[rgb(var(--bg-card))]/50">
    <div className="inline-flex p-6 bg-[rgb(var(--bg-card))] shadow-xl rounded-3xl mb-6 text-slate-300">
      <SearchX size={40} strokeWidth={1.5} />
    </div>
    <h3 className="text-[rgb(var(--text-main))] font-normal uppercase tracking-tight text-xl mb-6 px-4">{message}</h3>
    <button onClick={onClear} className="bg-black text-white px-10 py-3 rounded-full text-[10px] font-normal uppercase tracking-widest transition-transform active:scale-95 shadow-2xl hover:bg-blue-600 cursor-pointer">
      Quay lại trang chính
    </button>
  </div>
);