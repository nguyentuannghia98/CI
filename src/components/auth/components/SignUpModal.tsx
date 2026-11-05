"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignUpSchema, SignUpInput } from "@/components/auth/types/schema";
import { useAuthActions } from "@/components/auth/hooks/useAuth"; 
import { useAuthModalStore } from "@/components/auth/store/useAuthModalStore";
import { Loader2, ChevronLeft, ShieldCheck, X, Mail, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function SignUpModal() {
  const { openLogin, closeModal } = useAuthModalStore();
  
  // NÂNG CẤP: Lấy thêm trạng thái error trực tiếp từ Hook hành động
  const { handleSignUp, isSigningUp, isSignUpSuccess, isSignUpError, signUpError } = useAuthActions();
  
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [countdown, setCountdown] = useState(0);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const isPendingVerification = isSignUpSuccess;

  const onSubmit = (data: SignUpInput) => {
    setSubmittedEmail(data.email);
    handleSignUp(data);
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = () => {
    if (countdown === 0) {
      handleSignUp(getValues());
      setCountdown(60);
    }
  };

  return (
    <div className="modal-container w-full md:max-w-md bg-main rounded-[32px] md:rounded-3xl p-8 md:p-10 shadow-2xl relative z-10 animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 md:zoom-in-95 duration-500 ease-out border border-holder/10">
      
      {/* Nút đóng UI */}
      <button onClick={closeModal} className="hidden md:flex absolute right-6 top-6 p-2 text-holder hover:text-main transition-colors z-20 cursor-pointer">
        <X size={20} strokeWidth={2.5} />
      </button>

      <div className="md:hidden w-12 h-1.5 bg-holder/20 rounded-full mx-auto mb-8" />

      {!isPendingVerification ? (
        /* --- VIEW 1: ĐĂNG KÝ --- */
        <div className="animate-in fade-in duration-500">
          <div className="mb-8 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
              <div className="p-1.5 bg-accent/10 rounded-lg">
                <ShieldCheck className="text-accent w-4 h-4" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent italic">NexLoot Security</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight text-main leading-tight italic">Tạo tài khoản</h2>
            <p className="text-holder mt-2 font-medium text-sm md:text-base italic">Gia nhập cộng đồng NexLoot ngay hôm nay.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {[
              { id: "email", label: "Địa chỉ Email", type: "email" },
              { id: "password", label: "Mật khẩu", type: "password" },
              { id: "confirmPassword", label: "Xác nhận mật khẩu", type: "password" }
            ].map((field) => (
              <div key={field.id} className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-holder ml-1">{field.label}</label>
                <input 
                  {...register(field.id as keyof SignUpInput)}
                  type={field.type}
                  disabled={isSigningUp}
                  className={`w-full px-5 py-3.5 rounded-2xl border bg-main text-main transition-all font-medium outline-none ${
                    errors[field.id as keyof SignUpInput] ? "border-red-500 ring-4 ring-red-500/10" : "border-holder focus:ring-4 focus:ring-accent/10 focus:border-accent"
                  }`}
                />
                {errors[field.id as keyof SignUpInput] && (
                  <p className="text-red-500 text-[11px] font-bold mt-1 ml-1 animate-in slide-in-from-left-2">{errors[field.id as keyof SignUpInput]?.message}</p>
                )}
              </div>
            ))}

            {/* BẢO VỆ CHỐT HẠ: Nếu hệ thống báo lỗi EMAIL_TAKEN, hiện cảnh báo đỏ trực tiếp lên Form */}
            {isSignUpError && signUpError?.message === "EMAIL_TAKEN" && (
              <div className="flex items-start gap-2 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold animate-in fade-in duration-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p>Email này đã được đăng ký hệ thống!</p>
                  <p className="text-[11px] font-medium opacity-80 mt-0.5">Vui lòng quay lại Đăng nhập bằng Google hoặc mật khẩu.</p>
                </div>
              </div>
            )}

            <button type="submit" disabled={isSigningUp} className="btn-primary w-full py-4 rounded-2xl text-lg font-black shadow-xl shadow-accent/20 mt-6 flex items-center justify-center gap-3 transition-transform active:scale-95 cursor-pointer disabled:cursor-not-allowed">
              {isSigningUp ? <Loader2 className="w-5 h-5 animate-spin" /> : "ĐĂNG KÝ NGAY"}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-holder/20 pt-6">
            <button onClick={openLogin} className="group inline-flex items-center gap-2 text-xs text-holder hover:text-accent font-black transition-all uppercase tracking-widest cursor-pointer">
              <ChevronLeft size={16} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
              Quay lại đăng nhập
            </button>
          </div>
        </div>
      ) : (
        /* --- VIEW 2: XÁC THỰC --- */
        <div className="text-center py-4 animate-in fade-in zoom-in-95 duration-500">
          <div className="relative mx-auto w-20 h-20 mb-8">
            <div className="absolute inset-0 bg-accent/20 rounded-3xl rotate-12 animate-pulse" />
            <div className="relative w-full h-full bg-accent rounded-3xl flex items-center justify-center shadow-lg shadow-accent/30">
              <Mail className="text-white w-10 h-10" />
            </div>
          </div>

          <h2 className="text-3xl font-black tracking-tight text-main italic mb-4">Xác thực Email</h2>
          <p className="text-holder text-base font-medium leading-relaxed mb-8 px-2">
            Link xác nhận đã được gửi đến: <br />
            <span className="text-main font-bold border-b border-accent/30 italic">{submittedEmail}</span>
          </p>

          <div className="space-y-4">
            <button onClick={openLogin} className="btn-primary w-full py-4 rounded-2xl text-base font-black flex items-center justify-center gap-2 group shadow-xl shadow-accent/20 active:scale-95 cursor-pointer">
              TỚI TRANG ĐĂNG NHẬP <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            
            <div className="pt-4">
              <button 
                onClick={handleResend}
                disabled={countdown > 0 || isSigningUp}
                className="text-[11px] text-holder/60 font-bold uppercase tracking-[0.2em] hover:text-accent disabled:opacity-50 transition-colors flex items-center justify-center gap-2 mx-auto cursor-pointer disabled:cursor-not-allowed"
              >
                {countdown > 0 ? `Gửi lại sau ${countdown}s` : (
                  <> <RefreshCw size={12} className={isSigningUp ? "animate-spin" : ""} /> Gửi lại email xác nhận </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}