'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ForgotPasswordSchema, ForgotPasswordInput } from '@/components/auth/types/schema';
import { useAuthActions } from '@/components/auth/hooks/useAuth';
import { useAuthModalStore } from '@/components/auth/store/useAuthModalStore';
import { Loader2, Mail, ChevronLeft } from 'lucide-react';

export default function ForgotPasswordModal() {
  const { openLogin } = useAuthModalStore();
  const { handleForgotPassword, isSendingReset } = useAuthActions();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    defaultValues: { email: "" },
  });

  return (
    /* THÊM LỚP NỀN BG-MAIN VÀ BO GÓC ĐỂ CHỐNG XUYÊN THẤU */
    <div className="w-full bg-main rounded-[32px] md:rounded-3xl p-8 md:p-10 shadow-2xl relative z-10 animate-in fade-in slide-in-from-right-4 duration-500 border border-holder/10">
      
      {/* Mobile Handle Bar - đặc trưng cho các ứng dụng NexLoot mobile */}
      <div className="md:hidden w-12 h-1.5 bg-holder/20 rounded-full mx-auto mb-8" />

      <div className="mb-8 text-center md:text-left">
        <h2 className="text-3xl font-black text-main tracking-tight italic">
          Quên mật khẩu?
        </h2>
        <p className="text-sm text-holder mt-2 font-medium leading-relaxed">
          Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu qua hệ thống xác thực.
        </p>
      </div>

      <form onSubmit={handleSubmit((data) => handleForgotPassword(data))} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-holder ml-1">
            Địa chỉ Email của bạn
          </label>
          <div className="relative">
            <input
              {...register("email")}
              type="email"
              autoComplete="email"
              disabled={isSendingReset}
              placeholder="name@example.com"
              className={`w-full px-5 py-4 rounded-2xl border bg-main text-main outline-none transition-all placeholder:text-holder/30 font-medium text-base ${
                errors.email 
                  ? "border-red-500 ring-4 ring-red-500/10" 
                  : "border-holder focus:ring-4 focus:ring-accent/10 focus:border-accent"
              }`}
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-[11px] mt-1 ml-1 font-bold animate-in fade-in">
              {errors.email.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSendingReset}
          className="btn-primary w-full py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-accent/20 disabled:opacity-70 active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          {isSendingReset ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-black tracking-widest uppercase">Đang gửi yêu cầu...</span>
            </>
          ) : (
            <>
              <Mail className="w-5 h-5" />
              <span className="text-lg font-black uppercase">Gửi link đặt lại</span>
            </>
          )}
        </button>

        <div className="pt-4 text-center border-t border-holder/20">
          <button
            type="button"
            onClick={openLogin}
            className="inline-flex items-center gap-2 text-xs text-holder hover:text-accent transition-colors font-black uppercase tracking-widest cursor-pointer"
          >
            <ChevronLeft size={16} strokeWidth={3} />
            Quay lại đăng nhập
          </button>
        </div>
      </form>
    </div>
  );
}