"use client";

import { Shield, Zap, RefreshCw, Trophy } from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Realtime Bidding",
    desc: "Cập nhật thời gian thực tức thì nhờ công nghệ WebSockets.",
  },
  {
    icon: Shield,
    title: "Giao Dịch Đảm Bảo",
    desc: "Cơ chế ký quỹ bảo vệ an toàn 100% dòng tiền của người dùng.",
  },
  {
    icon: RefreshCw,
    title: "Sàn Trao Đổi Tự Do",
    desc: "Đăng tin giao thương vật phẩm nhanh chóng, người mua gặp người bán.",
  },
  {
    icon: Trophy,
    title: "Sự Kiện Arena 0Đ",
    desc: "Thử thách trí tuệ và may mắn nhận phần quà Gaming Gear hàng tuần.",
  },
];

export default function ExperiencesSection() {
  return (
    <section className="relative py-16 z-[2]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.3em] text-orange-500 font-bold">
            02 / TÍNH NĂNG VƯỢT TRỘI
          </p>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-tight" style={{ color: "rgb(var(--text-main))" }}>
            Nền Tảng Gaming <br />
            <span className="text-orange-500">Thế Hệ Mới</span>
          </h2>
          <p className="text-base font-normal leading-relaxed max-w-md" style={{ color: "rgb(var(--text-muted))" }}>
            NexLoot mang đến trải nghiệm đấu giá trực tuyến minh bạch, tốc độ phản hồi cực nhanh và cộng đồng uy tín.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div
                key={i}
                className="p-5 rounded-2xl border space-y-3 transition-all duration-300"
                style={{
                  backgroundColor: "rgb(var(--bg-card))",
                  borderColor: "rgba(var(--border-main), 0.3)",
                }}
              >
                <div className="p-2.5 w-fit rounded-xl bg-orange-500/10 text-orange-500">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold" style={{ color: "rgb(var(--text-main))" }}>{feat.title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "rgb(var(--text-muted))" }}>
                  {feat.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}