// @/hooks/use-protected-action.ts
import { useAuthStore } from "@/components/auth/store/AuthStore";
import { useAuthModalStore } from "@/components/auth/store/useAuthModalStore";

export const useProtectedAction = () => {
  const user = useAuthStore((state) => state.user);
  
  // Lấy openLogin thay vì openModal
  const openLogin = useAuthModalStore((state) => state.openLogin);

  const runAction = (callback: () => void) => {
    if (!user) {
      // Gọi hàm đúng với định nghĩa trong store
      openLogin(); 
      return;
    }
    callback();
  };

  return { runAction };
};