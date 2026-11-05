"use client";

import React from "react";
import { Target, Rocket, ShieldCheck, Users, RefreshCw, Cpu, CheckCircle, Sparkles, Award, ArrowUpRight } from "lucide-react"; 

const values = [
  {
    icon: <Rocket className="group-hover:text-white transition-colors" size={26} />,
    title: "Đổi mới",
    description: "Luôn tiên phong áp dụng công nghệ mới để mang lại giá trị tốt nhất cho cộng đồng."
  },
  {
    icon: <Target className="group-hover:text-white transition-colors" size={26} />,
    title: "Mục tiêu",
    description: "Tập trung vào trải nghiệm người dùng và xây dựng hệ sinh thái bền vững."
  },
  {
    icon: <ShieldCheck className="group-hover:text-white transition-colors" size={26} />, 
    title: "Tin cậy",
    description: "Bảo mật thông tin và sự minh bạch luôn là ưu tiên hàng đầu của chúng tôi."
  },
  {
    icon: <Users className="group-hover:text-white transition-colors" size={26} />,
    title: "Cộng đồng",
    description: "Gắn kết mọi người thông qua các giải pháp tương tác thông minh."
  }
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg-main))] text-[rgb(var(--text-main))] transition-colors duration-300 relative overflow-hidden pb-24 font-sans">
      
      {/* Background Glow Orbs */}
      <div className="absolute top-0 inset-x-0 h-[600px] pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[100px] left-1/4 w-[50%] h-[500px] bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-transparent rounded-full blur-[140px]" />
        <div className="absolute top-[200px] right-[10%] w-[35%] h-[400px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      {/* SECTION 1: HERO */}
      <section className="relative pt-16 md:pt-24 pb-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="relative z-10 max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-widest shadow-sm">
            <Sparkles size={14} className="animate-pulse" />
            Giới thiệu hệ sinh thái
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] uppercase">
            Về <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 bg-clip-text text-transparent">Chúng Tôi</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-[rgb(var(--text-muted))] leading-relaxed max-w-3xl mx-auto font-normal">
            Chúng tôi là đội ngũ đam mê sáng tạo, cam kết xây dựng những nền tảng công nghệ 
            giúp kết nối con người và kiến tạo tương lai số bền vững.
          </p>
        </div>
      </section>

      {/* SECTION 2: GIỚI THIỆU SÀN CÔNG NGHỆ ĐỒ CŨ */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="p-8 sm:p-12 rounded-[2.5rem] border border-[rgba(var(--border-main),0.2)] bg-[rgb(var(--bg-card))]/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-orange-500/10 via-transparent to-transparent rounded-bl-full pointer-events-none" />

            <div className="grid lg:grid-cols-12 gap-10 items-center relative z-10">
              {/* Nội dung bên trái */}
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-orange-500 flex items-center gap-1.5">
                    <Award size={14} /> Minh bạch & Uy tín
                  </span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                    Giao Dịch <span className="text-orange-500">Công Nghệ Đã Qua Sử Dụng</span>
                  </h2>
                </div>

                <p className="text-[rgb(var(--text-muted))] leading-relaxed text-base sm:text-lg font-normal">
                  Chúng tôi tự hào mang đến nền tảng mua bán thiết bị công nghệ cũ uy tín, 
                  nơi các sản phẩm như Smartphone, Laptop, Linh kiện máy tính được trao đổi một cách minh bạch và an toàn.
                </p>

                <ul className="space-y-3.5 pt-2">
                  {[
                    "Kiểm định chất lượng nghiêm ngặt trước khi đăng bán.",
                    "Chính sách bảo hành và bảo vệ người mua tối đa.",
                    "Góp phần giảm thiểu rác thải điện tử cho môi trường."
                  ].map((text, i) => (
                    <li key={i} className="flex items-center gap-3.5 group/item">
                      <div className="p-1.5 bg-orange-500/15 border border-orange-500/30 rounded-xl text-orange-500 shrink-0 group-hover/item:scale-110 transition-transform">
                        <CheckCircle size={18} />
                      </div>
                      <span className="text-[rgb(var(--text-main))] text-sm sm:text-base font-medium">
                        {text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* 2 Card thống kê bên phải */}
              <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-7 bg-[rgb(var(--bg-surface))] border border-[rgba(var(--border-main),0.2)] rounded-3xl flex flex-col items-center text-center shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="p-4 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 mb-4 shadow-sm">
                    <Cpu size={32} />
                  </div>
                  <h3 className="font-bold text-lg text-[rgb(var(--text-main))] mb-1.5">Đồ Cũ Tốt</h3>
                  <p className="text-xs text-[rgb(var(--text-muted))] leading-relaxed">Linh kiện zin, hiệu năng chuẩn.</p>
                </div>

                <div className="p-7 bg-[rgb(var(--bg-surface))] border border-[rgba(var(--border-main),0.2)] rounded-3xl flex flex-col items-center text-center shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-4 shadow-sm">
                    <RefreshCw size={32} />
                  </div>
                  <h3 className="font-bold text-lg text-[rgb(var(--text-main))] mb-1.5">Giá Tốt</h3>
                  <p className="text-xs text-[rgb(var(--text-muted))] leading-relaxed">Tiết kiệm đến 50% so với mua mới.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: GIÁ TRỊ CỐT LÕI */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[rgb(var(--text-main))] uppercase">
              Giá Trị Cốt Lõi
            </h2>
            <p className="text-[rgb(var(--text-muted))] text-base max-w-xl mx-auto">
              Nền tảng của sự phát triển bền vững.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {values.map((val, idx) => (
              <div 
                key={idx} 
                className="p-8 rounded-3xl border border-[rgba(var(--border-main),0.2)] bg-[rgb(var(--bg-card))]/80 backdrop-blur-md hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1.5 hover:border-orange-500/40 transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="mb-6 inline-flex p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-amber-500 group-hover:text-white transition-all duration-300 shadow-md">
                    {val.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-[rgb(var(--text-main))] group-hover:text-orange-500 transition-colors">
                    {val.title}
                  </h3>
                  <p className="text-[rgb(var(--text-muted))] text-sm leading-relaxed font-normal">
                    {val.description}
                  </p>
                </div>

                <div className="pt-4 mt-6 border-t border-[rgba(var(--border-main),0.1)] flex justify-end">
                  <ArrowUpRight size={16} className="text-[rgb(var(--text-muted))] group-hover:text-orange-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
