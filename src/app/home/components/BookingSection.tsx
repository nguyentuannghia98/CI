"use client";

import Link from "next/link";

export default function BookingSection() {
  return (
    <section className="relative py-16 z-[2]">
      <div className="max-w-3xl mx-auto text-center space-y-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-orange-500 font-bold">
            03 / THAM GIA CỘNG ĐỒNG
          </p>
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight" style={{ color: "rgb(var(--text-main))" }}>
            Sẵn Sàng Săn Deal <br /> Cùng NexLoot?
          </h2>
        </div>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="p-6 md:p-8 rounded-3xl border space-y-4 text-left"
          style={{
            backgroundColor: "rgb(var(--bg-card))",
            borderColor: "rgba(var(--border-main), 0.3)",
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold" style={{ color: "rgb(var(--text-muted))" }}>Tên hiển thị</label>
              <input
                type="text"
                placeholder="Ví dụ: GamerPro99"
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none bg-transparent"
                style={{
                  borderColor: "rgba(var(--border-main), 0.3)",
                  color: "rgb(var(--text-main))",
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold" style={{ color: "rgb(var(--text-muted))" }}>Email liên hệ</label>
              <input
                type="email"
                placeholder="nghieudev@nexloot.com"
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none bg-transparent"
                style={{
                  borderColor: "rgba(var(--border-main), 0.3)",
                  color: "rgb(var(--text-main))",
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-orange-500 text-white font-bold text-xs uppercase tracking-wider hover:bg-orange-600 transition-all cursor-pointer shadow-lg shadow-orange-500/20"
          >
            Đăng Ký Nhận Thông Báo Deal Hot
          </button>
        </form>

        <footer className="pt-8 border-t flex flex-col md:flex-row items-center justify-between text-xs gap-4" style={{ borderColor: "rgba(var(--border-main), 0.2)", color: "rgb(var(--text-muted))" }}>
          <p>© 2026 NEXLOOT. BẢO LƯU MỌI QUYỀN.</p>
          <div className="flex items-center gap-6 font-medium">
            <Link href="/giao-thuong" className="hover:text-orange-500 transition-colors">Giao Thương</Link>
            <Link href="/auction" className="hover:text-orange-500 transition-colors">Đấu Giá</Link>
          </div>
        </footer>
      </div>
    </section>
  );
}