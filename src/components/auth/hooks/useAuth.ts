"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/AuthService";
import { useAuthModalStore } from "@/components/auth/store/useAuthModalStore";
import { useAuthActions as useGlobalAuthActions } from "@/components/auth/store/AuthStore";
import { useRouter } from "next/navigation";
import { AuthError } from "@supabase/supabase-js";
import { toast } from "sonner";
import { LoginInput, SignUpInput, ForgotPasswordInput } from "../types/schema";
import { isSafeInternalPath } from "@/lib/auth/safe-path";

export const useAuthActions = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const { setAuth } = useGlobalAuthActions();
  // SỬA TẠI ĐÂY: Lấy đúng hàm openLogin từ Store để tránh crash luồng JS
  const { closeModal, openLogin } = useAuthModalStore();

  const signUpMutation = useMutation({
    mutationFn: async (values: SignUpInput) => {
      // 1. Quét trùng qua RPC nâng cấp
      await authService.checkEmailExists(values.email);

      // 2. Gửi lệnh tạo user lên Supabase Auth
      const data = await authService.signUp(values);

      // 3. Chặn kịch bản "User ảo" ẩn danh của gói Free
      if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
        throw new Error("EMAIL_TAKEN");
      }

      return data;
    },
    onSuccess: () => {
      toast.success("Đăng ký thành công!", {
        description: "Hãy kiểm tra hộp thư đến để xác thực tài khoản.",
      });
    },
    onError: (error: Error) => {
      console.error("Mutation Đăng ký thất bại:", error.message);
      
      if (error?.message === "EMAIL_TAKEN") {
        toast.error("Email này đã được đăng ký.", {
          description: "Vui lòng đăng nhập hoặc sử dụng phương thức Google Auth!",
          action: {
            label: "Đăng nhập",
            onClick: () => openLogin(), // SỬA TẠI ĐÂY: Gọi chuẩn hàm openLogin của bạn
          },
        });
      } else {
        toast.error(error?.message || "Có lỗi xảy ra khi đăng ký");
      }
    }
  });

  const loginMutation = useMutation({
    mutationFn: (values: LoginInput) => authService.login(values),
    onSuccess: (data) => {
      if (data.user) {
        setAuth(data.user);
        closeModal();
        queryClient.clear();
        
        const params = new URLSearchParams(window.location.search);
        const nextPath = params.get("next");

        router.refresh();
        router.push(isSafeInternalPath(nextPath) ? nextPath : "/");
        toast.success("Chào mừng bạn quay trở lại!");
      }
    },
    onError: (error: AuthError) => {
      const msg = error.status === 400 ? "Email hoặc mật khẩu không chính xác" : error.message;
      toast.error(msg);
    }
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (values: ForgotPasswordInput) => authService.resetPassword(values.email),
    onSuccess: () => {
      toast.success("Link đặt lại mật khẩu đã được gửi!");
    },
    onError: (error: AuthError) => {
      toast.error(error.message || "Không thể thực hiện yêu cầu");
    }
  });

  const loginWithGoogle = async () => {
    try {
      await authService.signInWithGoogle();
    } catch {
      toast.error("Lỗi kết nối với tài khoản Google");
    }
  };

  return {
    handleLogin: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    
    handleSignUp: signUpMutation.mutate,
    isSigningUp: signUpMutation.isPending,
    isSignUpSuccess: signUpMutation.isSuccess,
    isSignUpError: signUpMutation.isError, // BỔ SUNG: Trả ra trạng thái lỗi để Modal kiểm soát
    signUpError: signUpMutation.error,     // BỔ SUNG: Trả ra chi tiết thông điệp lỗi
    resetSignUp: signUpMutation.reset,

    handleForgotPassword: forgotPasswordMutation.mutate,
    isSendingReset: forgotPasswordMutation.isPending,
    isResetSuccess: forgotPasswordMutation.isSuccess,
    resetForgotPassword: forgotPasswordMutation.reset,

    loginWithGoogle
  };
};