"use client";
import React from "react";
import { Search } from "lucide-react";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onFocus?: () => void;
};

export default function SearchInput({ value, onChange, onSubmit, onFocus }: Props) {
  return (
    <form 
      onSubmit={onSubmit} 
      className="group relative flex w-full items-center p-[2px] rounded-[6px] overflow-hidden transition-all duration-300 shadow-md"
    >
      {/* 1. Viền Gradient */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(45deg,#ff2400,#e81d1d,#e8b71d,#1de840,#1ddde8,#2b1de8,#dd00f3,#ff2400)] bg-[length:200%_200%] animate-gradient-move" 
      />

      {/* 2. Ruột (Nền của ô input) */}
      <div 
        className="relative flex w-full items-center rounded-[4px] px-3 h-[38px] z-10 transition-colors duration-300"
        style={{ backgroundColor: 'rgb(var(--bg-card))' }}
      >
        <input
          type="text"
          placeholder="Bạn muốn tìm gì?"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          className="w-full bg-transparent border-none outline-none text-[15px] h-full font-sans"
          style={{ color: 'rgb(var(--text-main))' }}
        />
        
        {/* Icon Search */}
        <div className="flex items-center justify-center ml-2 relative">
           <span className="absolute -top-1 -right-1 text-[8px] text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity">✦</span>
           <span className="absolute -bottom-1 -left-1 text-[8px] text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">✦</span>
           
           <Search 
             size={20} 
             className="stroke-[2.5px] cursor-pointer transition-colors duration-300" 
             style={{ color: 'rgb(var(--text-main))' }} 
           />
        </div>
      </div>

      <style jsx global>{`
        @keyframes gradient-move {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-move {
          animation: gradient-move 4s linear infinite;
        }
        input::placeholder {
          color: rgb(var(--text-muted)) !important;
          opacity: 0.6;
        }
      `}</style>
    </form>
  );
}