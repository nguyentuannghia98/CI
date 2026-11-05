"use client";

import React, { useEffect, memo } from "react";
import Link from "next/link";
import { X, ChevronRight, LayoutGrid, Loader2, Gavel, Swords, Info, Phone, ShieldCheck, Briefcase } from "lucide-react";

type Branch = {
  id: string;
  name: string;
};

interface CategoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  onSelectBranch: (id: string) => void;
}

export const CategoryPanel = memo(({ 
  isOpen, 
  onClose, 
  branches, 
  onSelectBranch 
}: CategoryPanelProps) => {

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleEsc);
      return () => {
        document.body.style.overflow = "unset";
        window.removeEventListener("keydown", handleEsc);
      };
    }
  }, [isOpen, onClose]);

  return (
    <>
      <div 
        className={`fixed inset-0 z-[100] bg-black/40 backdrop-blur-[2px] transition-all duration-500 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside 
        className={`fixed inset-y-0 left-0 z-[110] w-[80%] max-w-[300px] bg-white flex flex-col transform transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header - Phẳng, tối giản */}
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <LayoutGrid size={20} className="text-gray-900" />
            <span className="text-lg font-semibold text-gray-900 tracking-tight">Danh mục</span>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Đóng danh mục"
            className="p-2.5 text-gray-400 hover:text-gray-900 transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* List nội dung - Không border, không background */}
        <nav className="flex-1 overflow-y-auto px-4 py-2 overscroll-contain">
          {branches.length > 0 ? (
            branches.map((branch) => (
              <button
                key={branch.id}
                type="button"
                onClick={() => {
                  onSelectBranch(branch.id);
                  onClose();
                }}
                className="group w-full flex items-center justify-between py-4 transition-all duration-200"
              >
                <span className="text-[15px] text-gray-500 group-hover:text-[#ff4500] group-active:text-[#ff4500] transition-colors">
                  {branch.name}
                </span>
                
                <ChevronRight 
                  size={16} 
                  className="text-gray-300 group-hover:text-[#ff4500] group-hover:translate-x-1 transition-all duration-300 ease-out" 
                />
              </button>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-10 text-gray-400">
              <Loader2 className="animate-spin text-gray-200 mb-2" size={24} />
              <p className="text-xs">Đang tải...</p>
            </div>
          )}

          {/* Liên kết điều hướng bổ sung — trước đây chỉ có trên desktop nên
              mobile không vào được Đấu giá / Sàn đấu / các trang tĩnh. */}
          <div className="mt-2 pt-2 border-t border-gray-100">
            {[
              { href: "/auction", label: "Đấu giá", Icon: Gavel },
              { href: "/arena", label: "Sàn đấu", Icon: Swords },
              { href: "/about", label: "Giới thiệu", Icon: Info },
              { href: "/contact", label: "Liên hệ", Icon: Phone },
              { href: "/policies", label: "Chính sách", Icon: ShieldCheck },
              { href: "/careers", label: "Tuyển dụng", Icon: Briefcase },
            ].map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="group w-full flex items-center gap-3 py-3.5 transition-all duration-200"
              >
                <Icon size={18} className="text-gray-400 group-hover:text-[#ff4500] transition-colors" />
                <span className="text-[15px] text-gray-500 group-hover:text-[#ff4500] transition-colors">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </nav>
        
        <div className="p-8">
           <p className="text-[10px] tracking-widest text-gray-300 font-medium text-center uppercase">
             {new Date().getFullYear()} Signature
           </p>
        </div>
      </aside>
    </>
  );
});

CategoryPanel.displayName = "CategoryPanel";