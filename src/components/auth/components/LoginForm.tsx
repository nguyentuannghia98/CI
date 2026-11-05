"use client";

import { useState } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useAuthModalStore } from "@/components/auth/store/useAuthModalStore";
import { useAuthActions } from "@/components/auth/hooks/useAuth"; 
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, LoginInput } from "@/components/auth/types/schema";

export default function LoginForm() {
  const [showPass, setShowPass] = useState(false);
  const { openSignUp, openForgotPassword } = useAuthModalStore();
  const { handleLogin, isLoggingIn } = useAuthActions();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <div className="w-full bg-main rounded-[32px] md:rounded-3xl p-8 md:p-10 shadow-2xl relative z-10 animate-in fade-in slide-in-from-right-4 duration-500 border border-holder/10">
      {/* Mobile Handle Bar */}
      <div className="md:hidden w-12 h-1.5 bg-holder/20 rounded-full mx-auto mb-8" />

      <div className="mb-8 text-center md:text-left">
        <h2 className="text-3xl font-black tracking-tight text-main leading-tight italic">
          Chào mừng trở lại
        </h2>
        <p className="text-holder mt-2 font-medium">
          Vui lòng nhập thông tin để truy cập hệ thống
        </p>
      </div>
      
      <form onSubmit={handleSubmit((data) => handleLogin(data))} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-holder ml-1">
            Tài khoản Email
          </label>
          <input
            {...register("email")}
            id="email"
            type="email"
            disabled={isLoggingIn}
            placeholder="your@email.com"
            className={`w-full px-5 py-4 rounded-2xl border bg-main text-main outline-none transition-all placeholder:text-holder/30 font-medium text-base ${
              errors.email 
                ? "border-red-500 ring-4 ring-red-500/10" 
                : "border-holder focus:ring-4 focus:ring-accent/10 focus:border-accent"
            }`}
          />
          {errors.email && (
            <p className="text-red-500 text-[11px] font-bold mt-1 ml-1 animate-in fade-in">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-holder">
              Mật khẩu
            </label>
            <button 
              type="button" 
              onClick={openForgotPassword}
              className="text-[11px] font-black text-holder hover:text-accent transition-colors tracking-tight uppercase cursor-pointer"
            >
              Quên mật khẩu?
            </button>
          </div>
          <div className="relative">
            <input
              {...register("password")}
              id="password"
              type={showPass ? "text" : "password"}
              disabled={isLoggingIn}
              placeholder="••••••••"
              className={`w-full px-5 py-4 rounded-2xl border bg-main text-main pr-14 outline-none transition-all placeholder:text-holder/30 font-medium text-base ${
                errors.password 
                  ? "border-red-500 ring-4 ring-red-500/10" 
                  : "border-holder focus:ring-4 focus:ring-accent/10 focus:border-accent"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-holder hover:text-main p-2 transition-colors cursor-pointer"
            >
              {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-[11px] font-bold mt-1 ml-1 animate-in fade-in">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoggingIn}
          className="btn-primary w-full py-4 rounded-2xl text-lg font-black shadow-xl shadow-accent/20 disabled:opacity-70 active:scale-[0.98] transition-transform cursor-pointer disabled:cursor-not-allowed"
        >
          {isLoggingIn ? (
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="animate-spin" size={22} />
              <span className="tracking-widest uppercase text-sm">Đang xác thực...</span>
            </div>
          ) : (
            "ĐĂNG NHẬP NGAY"
          )}
        </button>

        <div className="pt-6 border-t border-holder/30">
          <p className="text-center text-sm font-medium text-holder">
            Chưa có tài khoản?{" "}
            <button
              type="button"
              className="text-accent font-black hover:underline decoration-2 underline-offset-4 ml-1 uppercase text-xs tracking-wider cursor-pointer"
              onClick={openSignUp}
            >
              Đăng ký ngay
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}