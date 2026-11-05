"use client";

import React from "react";
import { Mail, Phone, MapPin, Send, MessageCircle, Facebook, Globe, Sparkles } from "lucide-react";

/**
 * CẤU HÌNH THÔNG TIN LIÊN HỆ TẠI ĐÂY
 * Khi nào bạn có thông tin chính thức, chỉ cần thay đổi các giá trị trong object này.
 */
const CONTACT_DATA = {
  email: "đang cập nhật...", // Ví dụ: contact@tencongty.com
  phone: "đang cập nhật...", // Ví dụ: 0901 234 567
  address: "đang cập nhật...", // Ví dụ: Số 1, Đường ABC, Quận X, Hà Nội
  socials: [
    { name: "Facebook", link: "#", icon: <Facebook size={20} /> },
    { name: "Zalo", link: "#", icon: <MessageCircle size={20} /> },
    { name: "Website", link: "#", icon: <Globe size={20} /> },
  ],
};

export default function ContactPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Cảm ơn bạn! Tin nhắn đã được gửi đi thành công.");
  };

  return (
    <div className="min-h-screen bg-[rgb(var(--bg-main))] text-[rgb(var(--text-main))] py-12 md:py-20 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300 relative overflow-hidden">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-0 inset-x-0 h-[500px] pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[100px] right-[20%] w-[45%] h-[450px] bg-gradient-to-bl from-orange-500/15 via-amber-500/10 to-transparent rounded-full blur-[140px]" />
        <div className="absolute top-[200px] left-[10%] w-[35%] h-[350px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-16 space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-bold uppercase tracking-widest shadow-sm">
            <Sparkles size={14} className="animate-pulse" />
            Hỗ trợ 24/7 & Hợp tác
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight uppercase">
            Kết Nối Với <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 bg-clip-text text-transparent">Chúng Tôi</span>
          </h1>
          <p className="text-[rgb(var(--text-muted))] text-base sm:text-lg leading-relaxed font-normal">
            Chúng tôi luôn sẵn sàng lắng nghe mọi ý kiến đóng góp hoặc yêu cầu hợp tác từ bạn. 
            Hãy để lại lời nhắn, chúng tôi sẽ phản hồi sớm nhất có thể!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Card Thông tin (Bên trái) */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="h-full p-8 sm:p-10 rounded-[2.5rem] border border-orange-400/20 bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white shadow-2xl shadow-orange-500/20 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl font-extrabold mb-8 tracking-tight uppercase">Thông tin liên hệ</h2>
                
                <div className="space-y-7">
                  {/* Email */}
                  <div className="flex items-center gap-4 group/item">
                    <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 shadow-md group-hover/item:scale-110 transition-transform">
                      <Mail size={22} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-widest text-orange-100 font-bold">Gửi thư cho chúng tôi</p>
                      <p className="font-semibold text-base sm:text-lg text-white truncate">{CONTACT_DATA.email}</p>
                    </div>
                  </div>

                  {/* Hotline */}
                  <div className="flex items-center gap-4 group/item">
                    <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 shadow-md group-hover/item:scale-110 transition-transform">
                      <Phone size={22} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-widest text-orange-100 font-bold">Đường dây nóng</p>
                      <p className="font-semibold text-base sm:text-lg text-white truncate">{CONTACT_DATA.phone}</p>
                    </div>
                  </div>

                  {/* Địa chỉ */}
                  <div className="flex items-center gap-4 group/item">
                    <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0 shadow-md group-hover/item:scale-110 transition-transform">
                      <MapPin size={22} className="text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-widest text-orange-100 font-bold">Địa chỉ văn phòng</p>
                      <p className="font-semibold text-sm sm:text-base text-white leading-snug">{CONTACT_DATA.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div className="mt-12 pt-8 border-t border-white/20 relative z-10">
                <p className="text-xs font-bold mb-4 uppercase tracking-widest text-orange-100">Mạng xã hội</p>
                <div className="flex gap-3">
                  {CONTACT_DATA.socials.map((social, idx) => (
                    <a 
                      key={idx}
                      href={social.link}
                      className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center hover:bg-white hover:text-orange-600 text-white transition-all duration-300 shadow-md hover:scale-110 cursor-pointer"
                      title={social.name}
                    >
                      {social.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Form liên hệ (Bên phải) */}
          <div className="lg:col-span-7 flex flex-col">
            <form 
              onSubmit={handleSubmit}
              className="h-full p-8 sm:p-12 rounded-[2.5rem] border border-[rgba(var(--border-main),0.2)] bg-[rgb(var(--bg-card))]/80 backdrop-blur-xl shadow-2xl space-y-6 flex flex-col justify-between"
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-main))] ml-1">
                      Họ và tên của bạn
                    </label>
                    <input 
                      type="text" 
                      placeholder="Nhập họ tên..."
                      className="w-full px-5 py-3.5 rounded-2xl border border-[rgba(var(--border-main),0.3)] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-main))] text-sm placeholder:text-[rgb(var(--text-muted))] focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-main))] ml-1">
                      Địa chỉ Email
                    </label>
                    <input 
                      type="email" 
                      placeholder="example@gmail.com"
                      className="w-full px-5 py-3.5 rounded-2xl border border-[rgba(var(--border-main),0.3)] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-main))] text-sm placeholder:text-[rgb(var(--text-muted))] focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-main))] ml-1">
                    Chủ đề cần hỗ trợ
                  </label>
                  <input 
                    type="text" 
                    placeholder="Hợp tác kinh doanh, hỗ trợ kỹ thuật..."
                    className="w-full px-5 py-3.5 rounded-2xl border border-[rgba(var(--border-main),0.3)] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-main))] text-sm placeholder:text-[rgb(var(--text-muted))] focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[rgb(var(--text-main))] ml-1">
                    Lời nhắn của bạn
                  </label>
                  <textarea 
                    rows={5}
                    placeholder="Bạn đang nghĩ gì? Hãy chia sẻ với chúng tôi nhé..."
                    className="w-full px-5 py-3.5 rounded-2xl border border-[rgba(var(--border-main),0.3)] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-main))] text-sm placeholder:text-[rgb(var(--text-muted))] focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all resize-none font-medium leading-relaxed"
                    required
                  ></textarea>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="group w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-xl shadow-orange-500/25 hover:scale-[1.02] active:scale-95 cursor-pointer"
                >
                  <span>Gửi tin nhắn ngay</span>
                  <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
