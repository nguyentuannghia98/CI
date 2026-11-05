"use client";

import { FcGoogle } from "react-icons/fc";
import Image from "next/image";
import { Eye, EyeOff, X, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, LoginInput } from "@/components/auth/types/schema";
import { useAuthActions } from "@/components/auth/hooks/useAuth"; 
import { useAuthModalStore } from "@/components/auth/store/useAuthModalStore";
import { useState } from "react";

export default function LoginModal() {
  const { closeModal, openSignUp, openForgotPassword } = useAuthModalStore();
  const [showPassword, setShowPassword] = useState(false);
  const { handleLogin, isLoggingIn, loginWithGoogle } = useAuthActions();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <div className="mx-auto w-full md:max-w-4xl grid grid-cols-1 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-10 duration-500 overflow-hidden bg-main rounded-[32px] md:rounded-3xl shadow-2xl border border-holder/10 relative z-10">
      
      {/* LEFT PANEL: Branding Image */}
      <div className="hidden md:block relative w-full h-full overflow-hidden border-r border-holder/10">
        <Image 
          src="/nen.png" 
          alt="NexLoot Auth" 
          fill 
          className="object-cover object-center hover:scale-110 transition-transform duration-[3000ms] ease-out" 
          priority 
          unoptimized 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />
        
        <div className="absolute bottom-12 left-12 text-white z-10">
          <div className="bg-accent w-12 h-1.5 rounded-full mb-6 animate-pulse" />
          <h1 className="text-5xl font-black tracking-tighter mb-2 italic">NEXLOOT</h1>
          <p className="text-white/70 text-[10px] font-black tracking-[0.3em] uppercase">Modern Trading Community</p>
        </div>
      </div>

      {/* RIGHT PANEL: Form Container */}
      <div className="flex flex-col justify-center p-8 md:p-12 bg-main relative">
        
        <div className="md:hidden w-12 h-1.5 bg-holder/20 rounded-full mx-auto mb-8" />

        <button 
          onClick={closeModal} 
          className="absolute top-4 right-4 md:top-6 md:right-6 p-2 rounded-full hover:bg-holder/10 text-holder hover:text-main transition-all active:scale-90 z-20 cursor-pointer"
        >
          <X size={22} strokeWidth={2.5} />
        </button>

        <div className="mb-10 text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-main leading-tight italic">
            Chào mừng trở lại
          </h2>
          <p className="text-holder mt-3 font-medium text-base">
            Tiếp tục hành trình sáng tạo của bạn
          </p>
        </div>

        <form onSubmit={handleSubmit((data) => handleLogin(data))} className="space-y-5">
          
          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-holder ml-1">
              Địa chỉ Email
            </label>
            <input
              type="email"
              {...register("email")}
              disabled={isLoggingIn}
              className={`w-full px-5 py-4 rounded-2xl border bg-main text-main transition-all placeholder:text-holder/30 font-medium text-base outline-none ${
                errors.email ? "border-red-500 ring-4 ring-red-500/10" : "border-holder focus:ring-4 focus:ring-accent/10 focus:border-accent"
              }`}
            />
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-holder ml-1">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                disabled={isLoggingIn}
                className={`w-full px-5 py-4 rounded-2xl border bg-main text-main pr-14 transition-all font-medium text-base outline-none ${
                  errors.password ? "border-red-500 ring-4 ring-red-500/10" : "border-holder focus:ring-4 focus:ring-accent/10 focus:border-accent"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-holder hover:text-main p-2 cursor-pointer"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isLoggingIn} 
            className="btn-primary w-full py-4 rounded-2xl text-lg font-black shadow-xl shadow-accent/20 flex items-center justify-center gap-3 transition-transform active:scale-95 cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoggingIn ? <Loader2 size={20} className="animate-spin" /> : "ĐĂNG NHẬP NGAY"}
          </button>

          <div className="flex items-center gap-4 py-2">
            <div className="h-[1px] flex-1 bg-holder/20" />
            <span className="text-[10px] font-black text-holder uppercase tracking-[0.1em]">Hoặc</span>
            <div className="h-[1px] flex-1 bg-holder/20" />
          </div>

          {/* GOOGLE BRANDING OPTIMIZED */}
          <button
            type="button"
            onClick={loginWithGoogle}
            disabled={isLoggingIn}
            className="group w-full flex items-center justify-center gap-3 py-4 rounded-2xl border border-holder bg-main font-black text-main hover:bg-white hover:text-black transition-all duration-300 active:scale-95 disabled:opacity-50 shadow-sm cursor-pointer disabled:cursor-not-allowed"
          >
            <div className="bg-white p-1 rounded-full shadow-sm group-hover:shadow-none transition-shadow">
               <FcGoogle size={20} />
            </div>
            <span className="text-sm uppercase tracking-widest">Tiếp tục với Google</span>
          </button>

          {/* Footer Links */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-holder/20 mt-6">
            <button 
              type="button" 
              onClick={openSignUp} 
              className="text-accent font-black text-[11px] uppercase tracking-widest hover:brightness-125 transition-all underline underline-offset-4 decoration-2 cursor-pointer"
            >
              Tạo tài khoản mới
            </button>
            <button 
              type="button" 
              onClick={openForgotPassword} 
              className="text-holder text-[11px] font-black hover:text-main transition-colors uppercase tracking-widest cursor-pointer"
            >
              Quên mật khẩu?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}