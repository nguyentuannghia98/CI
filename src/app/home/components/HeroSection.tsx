"use client";

import Link from "next/link";
import { ChevronDown, ShieldCheck, Gavel, ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-[85vh] w-full flex flex-col justify-between py-8 z-[2] pointer-events-none">
      <div className="max-w-4xl mx-auto text-center space-y-6 my-auto pointer-events-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-500 text-xs font-black tracking-widest uppercase">
          <ShieldCheck className="w-4 h-4" />
          HỆ THỐNG GIAO DỊCH VẬT PHẨM GAMING NGUYÊN BẢN
        </div>

        <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tight leading-none" style={{ color: "rgb(var(--text-main))" }}>
          ĐẤU TRƯỜNG <br />
          <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600 bg-clip-text text-transparent drop-shadow-xl">
            SĂN DEAL 0Đ
          </span>
        </h1>

        <p className="text-sm md:text-lg font-medium max-w-xl mx-auto leading-relaxed" style={{ color: "rgb(var(--text-muted))" }}>
          Nơi người chơi tự do trao đổi thiết bị hiếm, tham gia các phiên đấu giá kịch tính và chinh phục phần thưởng độc quyền.
        </p>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/giao-thuong"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-orange-500 text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-orange-500/20 hover:bg-orange-600 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            Khám Phá Vật Phẩm <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/auction"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl border border-orange-500/30 text-orange-500 font-bold text-sm uppercase tracking-wider hover:bg-orange-500/10 transition-all cursor-pointer"
          >
            <Gavel className="w-4 h-4" /> Tham Gia Đấu Giá
          </Link>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 pt-8" style={{ color: "rgb(var(--text-muted))" }}>
        <span className="text-[10px] uppercase tracking-[0.3em] font-mono text-orange-500 font-bold">
          Cuộn để xem tiếp
        </span>
        <ChevronDown className="w-4 h-4 animate-bounce text-orange-500" />
      </div>
    </section>
  );
}