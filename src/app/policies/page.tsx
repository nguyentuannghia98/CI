"use client";

import React from "react";
import { ShieldCheck, Eye, Lock, FileText, Bell, Scale, ArrowUp, Sparkles, CheckCircle2 } from "lucide-react";

const sections = [
  {
    icon: <Eye className="text-orange-500" size={24} />,
    title: "Thu thập thông tin",
    description: "Chúng tôi thu thập các thông tin cơ bản như địa chỉ email, tên và dữ liệu sử dụng để cải thiện trải nghiệm cá nhân hóa của bạn trên nền tảng.",
    glow: "hover:border-orange-500/40"
  },
  {
    icon: <Lock className="text-amber-500" size={24} />,
    title: "Bảo mật dữ liệu",
    description: "Mọi dữ liệu của bạn được mã hóa bằng giao thức SSL/TLS và lưu trữ trên hệ thống máy chủ bảo mật cao, hạn chế tối đa sự can thiệp từ bên ngoài.",
    glow: "hover:border-amber-500/40"
  },
  {
    icon: <Bell className="text-purple-400" size={24} />,
    title: "Thông báo thay đổi",
    description: "Các chính sách có thể được cập nhật định kỳ. Chúng tôi sẽ thông báo cho bạn qua email hoặc thông báo trực tiếp trên ứng dụng trước khi thay đổi có hiệu lực.",
    glow: "hover:border-purple-500/40"
  },
  {
    icon: <Scale className="text-blue-400" size={24} />,
    title: "Quyền hạn của bạn",
    description: "Bạn có quyền yêu cầu truy xuất, sửa đổi hoặc xóa hoàn toàn dữ liệu cá nhân của mình khỏi hệ thống của chúng tôi bất cứ lúc nào.",
    glow: "hover:border-blue-500/40"
  }
];

export default function PoliciesPage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--bg-main))] text-[rgb(var(--text-main))] py-12 md:py-20 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-0 inset-x-0 h-[500px] pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[120px] left-1/2 -translate-x-1/2 w-[60%] h-[450px] bg-gradient-to-b from-orange-500/10 via-purple-600/5 to-transparent rounded-full blur-[140px]" />
      </div>

      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16 space-y-4">
          <div className="p-4 rounded-3xl bg-orange-500/10 border border-orange-500/30 text-orange-500 shadow-lg shadow-orange-500/10 mb-2">
            <ShieldCheck size={40} className="animate-pulse" />
          </div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={12} /> Điều khoản & Bảo mật
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight uppercase">
            Chính Sách & <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 bg-clip-text text-transparent">Quyền Riêng Tư</span>
          </h1>

          <p className="text-sm font-medium text-[rgb(var(--text-muted))] bg-[rgb(var(--bg-card))] px-4 py-1.5 rounded-full border border-[rgba(var(--border-main),0.2)]">
            Cập nhật lần cuối: ngày 13 tháng 4, 2026
          </p>
        </div>

        {/* Highlight Cards (Bento Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {sections.map((item, index) => (
            <div 
              key={index} 
              className={`p-7 rounded-3xl border border-[rgba(var(--border-main),0.2)] bg-[rgb(var(--bg-card))]/80 backdrop-blur-xl shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ${item.glow}`}
            >
              <div className="flex items-center gap-3.5 mb-3.5">
                <div className="p-2.5 rounded-2xl bg-[rgb(var(--bg-surface))] border border-[rgba(var(--border-main),0.3)] shadow-sm shrink-0">
                  {item.icon}
                </div>
                <h2 className="font-bold text-lg text-[rgb(var(--text-main))]">{item.title}</h2>
              </div>
              <p className="text-sm text-[rgb(var(--text-muted))] leading-relaxed font-normal">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Detailed Content */}
        <div className="space-y-10">
          
          {/* Section 1 */}
          <section className="p-8 sm:p-10 rounded-[2.5rem] border border-[rgba(var(--border-main),0.2)] bg-[rgb(var(--bg-card))]/80 backdrop-blur-xl shadow-xl space-y-4">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight flex items-center gap-3 text-[rgb(var(--text-main))]">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
                <FileText size={20} />
              </div>
              1. Điều khoản sử dụng
            </h2>
            
            <div className="p-6 rounded-2xl bg-[rgb(var(--bg-surface))] border-l-4 border-orange-500 border border-[rgba(var(--border-main),0.2)]">
              <p className="text-[rgb(var(--text-muted))] leading-relaxed text-sm sm:text-base font-normal">
                Bằng cách truy cập vào trang web của chúng tôi, bạn đồng ý tuân thủ các điều khoản dịch vụ, 
                tất cả các luật và quy định hiện hành. Nếu bạn không đồng ý với bất kỳ điều khoản nào, 
                bạn sẽ bị cấm sử dụng hoặc truy cập vào trang web này.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="p-8 sm:p-10 rounded-[2.5rem] border border-[rgba(var(--border-main),0.2)] bg-[rgb(var(--bg-card))]/80 backdrop-blur-xl shadow-xl space-y-4">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight flex items-center gap-3 text-[rgb(var(--text-main))]">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <CheckCircle2 size={20} />
              </div>
              2. Cookies và Công nghệ theo dõi
            </h2>
            
            <p className="text-[rgb(var(--text-muted))] leading-relaxed text-sm sm:text-base font-normal">
              Chúng tôi sử dụng cookies để lưu trữ thông tin về sở thích của khách truy cập, 
              ghi lại thông tin cụ thể của người dùng về các trang mà người dùng truy cập hoặc truy cập:
            </p>
            
            <ul className="space-y-3 pt-2">
              {[
                "Cá nhân hóa nội dung quảng cáo dựa trên hành vi.",
                "Phân tích lưu lượng truy cập để cải thiện tốc độ tải trang.",
                "Ghi nhớ trạng thái đăng nhập để bạn không phải nhập lại mật khẩu nhiều lần."
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-3 text-sm sm:text-base text-[rgb(var(--text-muted))] font-medium">
                  <div className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 3 */}
          <section className="p-8 sm:p-10 rounded-[2.5rem] border border-[rgba(var(--border-main),0.2)] bg-[rgb(var(--bg-card))]/80 backdrop-blur-xl shadow-xl space-y-4">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight flex items-center gap-3 text-[rgb(var(--text-main))]">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Lock size={20} />
              </div>
              3. Liên hệ giải quyết khiếu nại
            </h2>
            
            <div className="p-6 rounded-2xl bg-[rgb(var(--bg-surface))] border border-[rgba(var(--border-main),0.2)]">
              <p className="text-[rgb(var(--text-muted))] leading-relaxed text-sm sm:text-base font-normal">
                Nếu bạn có bất kỳ câu hỏi hoặc khiếu nại nào liên quan đến chính sách bảo mật này, 
                vui lòng liên hệ với bộ phận Pháp lý của chúng tôi tại: 
                <span className="text-orange-500 font-bold ml-1.5 underline decoration-orange-500/40 underline-offset-4">privacy@yourbrand.com</span>.
              </p>
            </div>
          </section>
        </div>

        {/* Back to top CTA */}
        <div className="mt-16 pt-10 border-t border-[rgba(var(--border-main),0.2)] text-center">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-orange-500/30 bg-orange-500/10 text-xs font-bold text-orange-400 hover:bg-orange-500 hover:text-white transition-all uppercase tracking-widest shadow-md hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span>Trở lên đầu trang</span>
            <ArrowUp size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}
