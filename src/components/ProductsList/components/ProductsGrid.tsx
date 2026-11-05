"use client";

import { memo } from "react";
import { motion, Variants } from "framer-motion";
import UniversalCard from "@/components/UniversalCard/UniversalCard"; 
import type { Product } from "@/components/UniversalCard/types/type";
import { useViewStore } from "@/lib/Zustard/store/useViewStore"; 

type Props = {
  products: Product[]; 
  setActiveTag: (tag: string | null) => void;
  onDelete?: (productId: string) => void; 
  isProfile?: boolean; 
};

const gridContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

function ProductsGrid({ products = [], setActiveTag, onDelete, isProfile = false }: Props) {
  const { viewMode } = useViewStore();
  if (!products.length) return null;

  const isGrid = viewMode === "grid";

  return (
    <motion.div
      variants={gridContainerVariants}
      initial="hidden"
      animate="visible"
      className={`w-full gap-8 ${
        isGrid 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 justify-items-center" 
          : "flex flex-col items-center space-y-8 max-w-[1600px] mx-auto" 
      }`}
    >
      {products.map((product, index) => (
        <motion.div 
          key={product.id} 
          layout 
          className={`w-full flex justify-center ${isGrid ? "max-w-[340px]" : "max-w-full"}`}
        >
          <UniversalCard
            product={product}
            viewMode={viewMode}
            onTagClick={setActiveTag}
            onDelete={onDelete}
            isProfile={isProfile}
            priority={index === 0}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

export default memo(ProductsGrid);