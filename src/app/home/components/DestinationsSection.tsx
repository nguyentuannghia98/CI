"use client";

import Link from "next/link";
import { ArrowUpRight, Gavel, Sparkles, Monitor } from "lucide-react";

const LOOT_ITEMS = [
  {
    title: "Bàn Phím Cơ Custom Cyberpunk",
    tag: "Đấu Giá Hot",
    desc: "Switch Tactile cao cấp, Keycap PBT dập nổi, bảo hành chính hãng 12 tháng.",
    price: "1.200.000đ",
    icon: Sparkles,
  },
  {
    title: "Card Đồ Họa RTX 4090 OC",
    tag: "Siêu Siêu Hiếm",
    desc: "Fullbox 99%, đã cân chỉnh tản nhiệt keo gốm, sẵn sàng cho mọi tựa game AAA.",
    price: "35.500.000đ",
    icon: Monitor,
  },
  {
    title: "Màn Hình OLED 240Hz Gaming",
    tag: "Giao Thương 0Đ",
    desc: "Độ phân giải 2K, thời gian phản hồi 0.03ms, chuẩn màu đồ họa chuyên nghiệp.",
    price: "14.800.000đ",
    icon: Gavel,
  },
];

export default function DestinationsSection() {
  return (
    <section className="relative py-16 z-[2]">
      <div className="space-y-12">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-orange-500 font-bold">
            01 / TÀI SẢN GAMING NỔI BẬT
          </p>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight" style={{ color: "rgb(var(--text-main))" }}>
            Vật Phẩm Độc Bản <br /> Đang Đấu Giá
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {LOOT_ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="group relative p-6 rounded-3xl border transition-all duration-500 flex flex-col justify-between h-[380px] overflow-hidden"
                style={{
                  backgroundColor: "rgb(var(--bg-card))",
                  borderColor: "rgba(var(--border-main), 0.3)",
                }}
              >
                <div className="space-y-4 z-10">
                  <div className="flex items-center justify-between">
                    <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-orange-500/10 text-orange-500 border border-orange-500/20">
                      {item.tag}
                    </span>
                    <Icon className="w-5 h-5 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-bold tracking-wide" style={{ color: "rgb(var(--text-main))" }}>
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgb(var(--text-muted))" }}>
                    {item.desc}
                  </p>
                </div>

                <div className="flex items-center justify-between z-10 pt-4 border-t" style={{ borderColor: "rgba(var(--border-main), 0.2)" }}>
                  <div>
                    <p className="text-[10px] uppercase font-mono" style={{ color: "rgb(var(--text-muted))" }}>Giá hiện tại</p>
                    <span className="text-lg font-black text-orange-500">{item.price}</span>
                  </div>
                  <Link
                    href="/auction"
                    className="p-3 rounded-full bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors duration-300"
                  >
                    <ArrowUpRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}