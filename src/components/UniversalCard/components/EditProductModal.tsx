"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Save, ShoppingBag, Type, AlignLeft } from "lucide-react";
import type { Product } from "../types/type";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSuccess?: (updatedData: { title: string; description: string }) => void;
  isLoading?: boolean;
}

export const EditProductModal = ({ 
  isOpen, 
  onClose, 
  product, 
  onSuccess, 
  isLoading: externalLoading 
}: EditProductModalProps) => {
  // Bỏ displayPrice khỏi state
  const [formData, setFormData] = useState({
    title: product.title,
    description: product.description || "",
  });

  // Đồng bộ lại data khi product prop thay đổi
  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: product.title,
        description: product.description || "",
      });
    }
  }, [isOpen, product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess?.(formData);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl border"
            style={{ 
              backgroundColor: 'rgb(var(--bg-card))', 
              borderColor: 'rgba(var(--border-main), 0.1)' 
            }}
          >
            {/* Header */}
            <div 
              className="p-6 border-b flex justify-between items-center"
              style={{ 
                backgroundColor: 'rgba(var(--border-main), 0.03)',
                borderColor: 'rgba(var(--border-main), 0.1)'
              }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-500 rounded-2xl text-white shadow-lg shadow-orange-500/20">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h2 
                    className="text-lg font-normal uppercase tracking-tight leading-none"
                    style={{ color: 'rgb(var(--text-main))' }}
                  >
                    Chỉnh sửa
                  </h2>
                  <p 
                    className="text-[10px] font-normal uppercase mt-1"
                    style={{ color: 'rgb(var(--text-muted))' }}
                  >
                    Cập nhật nội dung bài viết
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-orange-500/10 rounded-full transition-all active:scale-90 cursor-pointer"
              >
                <X size={20} style={{ color: 'rgb(var(--text-muted))' }} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-5">
                {/* Title Input */}
                <div className="relative">
                  <label 
                    className="flex items-center gap-2 text-[11px] font-normal uppercase mb-2 ml-1"
                    style={{ color: 'rgb(var(--text-muted))' }}
                  >
                    <Type size={14} /> Tiêu đề bài viết
                  </label>
                  <input
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Nhập tiêu đề mới..."
                    className="w-full px-5 py-4 rounded-[20px] border-2 focus:border-orange-500 outline-none transition-all font-normal cursor-text"
                    style={{ 
                      backgroundColor: 'rgba(var(--border-main), 0.05)',
                      borderColor: 'rgba(var(--border-main), 0.1)',
                      color: 'rgb(var(--text-main))'
                    }}
                  />
                </div>

                {/* Description Input */}
                <div className="relative">
                  <label 
                    className="flex items-center gap-2 text-[11px] font-normal uppercase mb-2 ml-1"
                    style={{ color: 'rgb(var(--text-muted))' }}
                  >
                    <AlignLeft size={14} /> Nội dung mô tả
                  </label>
                  <textarea
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Nhập nội dung chi tiết bài viết..."
                    className="w-full px-5 py-4 rounded-[20px] border-2 focus:border-orange-500 outline-none transition-all resize-none font-normal leading-relaxed cursor-text"
                    style={{ 
                      backgroundColor: 'rgba(var(--border-main), 0.05)',
                      borderColor: 'rgba(var(--border-main), 0.1)',
                      color: 'rgb(var(--text-main))'
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-4 rounded-2xl font-normal transition-all uppercase text-[12px] tracking-wider hover:bg-white/5 cursor-pointer"
                  style={{ color: 'rgb(var(--text-muted))' }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={externalLoading}
                  className="flex-[2] py-4 rounded-[20px] bg-orange-500 hover:bg-orange-600 text-white font-normal transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2 uppercase text-[12px] tracking-widest disabled:opacity-50 disabled:grayscale cursor-pointer disabled:cursor-not-allowed"
                >
                  {externalLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      <Save size={18} strokeWidth={2} />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};