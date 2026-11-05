"use client";

import React from "react";
import { Briefcase, Mail, Bell, GraduationCap, ArrowRight, Sparkles, HeartHandshake, Rocket } from "lucide-react";

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg-main))] text-[rgb(var(--text-main))] py-12 md:py-20 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-0 inset-x-0 h-[500px] pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[100px] left-1/3 w-[50%] h-[450px] bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-transparent rounded-full blur-[140px]" />
      </div>

      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-16 space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-widest shadow-sm">
            <GraduationCap size={15} />
            Cơ hội nghề nghiệp
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight uppercase">
            Gia Nhập Đội Ngũ <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 bg-clip-text text-transparent">Sáng Tạo</span>
          </h1>

          <p className="text-[rgb(var(--text-muted))] text-base sm:text-lg leading-relaxed font-normal">
            Chúng tôi luôn tìm kiếm những nhân tài có cùng đam mê để cùng nhau xây dựng những giá trị bền vững cho cộng đồng.
          </p>
        </div>

        {/* Empty State / No Jobs Found */}
        <div className="relative overflow-hidden p-8 sm:p-14 md:p-16 rounded-[2.5rem] border border-[rgba(var(--border-main),0.2)] bg-[rgb(var(--bg-card))]/80 backdrop-blur-xl text-center shadow-2xl">
          {/* Background Decor */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-52 h-52 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto">
            <div className="w-20 h-20 rounded-3xl bg-[rgb(var(--bg-surface))] flex items-center justify-center mb-6 border border-[rgba(var(--border-main),0.3)] shadow-inner">
              <Briefcase size={36} className="text-orange-400" />
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight mb-4 text-[rgb(var(--text-main))]">
              Hiện tại chưa có vị trí đang tuyển
            </h2>

            <p className="text-[rgb(var(--text-muted))] leading-relaxed mb-8 text-sm sm:text-base font-normal">
              Cảm ơn bạn đã quan tâm đến chúng tôi. Hiện tại đội ngũ của chúng tôi đã ổn định, 
              tuy nhiên chúng tôi luôn sẵn sàng đón nhận những hồ sơ tiềm năng cho các dự án trong tương lai.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <a 
                href="mailto:hr@yourbrand.com" 
                className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer border border-orange-400/30"
              >
                <span>Gửi CV cho chúng tôi</span>
                <Mail size={16} />
              </a>

              <button className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 border border-[rgba(var(--border-main),0.3)] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-main))] font-bold text-xs uppercase tracking-widest rounded-2xl hover:border-orange-500/40 hover:text-orange-500 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-sm">
                <span>Đăng ký nhận tin tuyển dụng</span>
                <Bell size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Culture/Benefits Teaser */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <div className="p-8 sm:p-10 rounded-3xl border border-[rgba(var(--border-main),0.2)] bg-[rgb(var(--bg-card))]/80 backdrop-blur-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 hover:border-orange-500/40 transition-all duration-300 group flex flex-col justify-between">
            <div>
              <div className="p-3 w-fit rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 mb-5 shadow-sm">
                <HeartHandshake size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[rgb(var(--text-main))] group-hover:text-orange-500 transition-colors">
                Văn hóa làm việc
              </h3>
              <p className="text-[rgb(var(--text-muted))] text-sm leading-relaxed mb-6 font-normal">
                Tại đây, chúng tôi đề cao sự sáng tạo, tinh thần tự chủ và sự cân bằng giữa công việc - cuộc sống.
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-orange-500 font-bold text-xs uppercase tracking-wider cursor-pointer group-hover:gap-3 transition-all pt-4 border-t border-[rgba(var(--border-main),0.1)]">
              <span>Tìm hiểu thêm về chúng tôi</span>
              <ArrowRight size={15} />
            </div>
          </div>
          
          <div className="p-8 sm:p-10 rounded-3xl border border-[rgba(var(--border-main),0.2)] bg-[rgb(var(--bg-card))]/80 backdrop-blur-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 hover:border-orange-500/40 transition-all duration-300 group flex flex-col justify-between">
            <div>
              <div className="p-3 w-fit rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 mb-5 shadow-sm">
                <Rocket size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-[rgb(var(--text-main))] group-hover:text-orange-500 transition-colors">
                Môi trường chuyên nghiệp
              </h3>
              <p className="text-[rgb(var(--text-muted))] text-sm leading-relaxed mb-6 font-normal">
                Làm việc với những công nghệ mới nhất và được hỗ trợ từ những chuyên gia giàu kinh nghiệm.
              </p>
            </div>
            
            <div className="flex items-center gap-2 text-orange-500 font-bold text-xs uppercase tracking-wider cursor-pointer group-hover:gap-3 transition-all pt-4 border-t border-[rgba(var(--border-main),0.1)]">
              <span>Xem các hoạt động cộng đồng</span>
              <ArrowRight size={15} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
