"use client";

import React, { useEffect, memo } from "react";
import ProductsList from "@/components/ProductsList/ProductsList";
// Đã xóa ProductDetailModal tại đây theo yêu cầu
import { useProductStore } from "@/lib/Zustard/store/useProductStore";
import { useUserContext } from "@/hooks/useUserContext"; 
import type { Product } from "@/components/UniversalCard/types/type";

interface Props {
  initialProducts: Product[];
}

const EmptyState = memo(function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-200 mx-4">
      <h3 className="text-gray-900 font-bold tracking-tight uppercase">Chưa có sản phẩm nào</h3>
      <p className="text-gray-600 text-[11px] font-bold mt-2 text-center uppercase tracking-widest">
        Hãy quay lại sau nhé!
      </p>
    </div>
  );
});

export default function ProductsPageClient({ initialProducts }: Props) {
  const setInitialData = useProductStore((state) => state.setInitialData);
  
  const { data: userContext, isLoading: isUserLoading } = useUserContext();

  // Đồng bộ dữ liệu ban đầu vào Store để UniversalCard sử dụng
  useEffect(() => {
    const likesMap = Object.fromEntries(initialProducts.map(p => [p.id, p.upvotes || 0]));
    const commentsMap = Object.fromEntries(initialProducts.map(p => [p.id, p.comments_count || 0]));

    setInitialData({
      likesCount: likesMap,
      commentsCount: commentsMap,
      likedIds: userContext?.likedIds ?? [], 
    });
  }, [initialProducts, userContext?.likedIds, setInitialData]);

  return (
    <div className="py-4 relative min-h-[600px]">
      {initialProducts.length > 0 ? (
        <ProductsList 
          products={initialProducts} 
          showFilter={true} 
          isLoading={isUserLoading} 
        />
      ) : (
        <EmptyState />
      )}
    </div>
  );
}