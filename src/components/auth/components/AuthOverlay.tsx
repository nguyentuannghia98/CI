"use client";

import { useEffect } from "react";
import { useAuthModalStore } from "@/components/auth/store/useAuthModalStore";
import LoginModal from "./LoginModal";
import SignUpModal from "./SignUpModal";
import ForgotPasswordModal from "./ForgotPasswordModal";
import Portal from "@/components/Portal/Portal";

export default function AuthOverlay() {
  const { view, closeModal } = useAuthModalStore();

  useEffect(() => {
    const isModalOpen = view !== "NONE";
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "var(--scrollbar-width, 0px)";
    }
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };

    window.addEventListener("keydown", handleEsc);
    return () => {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [view, closeModal]);

  if (view === "NONE") return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-0 md:p-4">
        
        {/* BACKDROP */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-[2px] animate-in fade-in duration-300" 
          onClick={closeModal} 
        />

        {/* HUB CONTAINER */}
        <div className="
          relative z-10 w-full md:w-auto
          animate-in fade-in slide-in-from-bottom-10 md:slide-in-from-bottom-4 duration-300
        ">
          
          {/* GRID CONTAINER: 
              Bí quyết nằm ở 'display: grid' và 'grid-template-areas'.
              Các con sẽ cùng nằm trên 1 ô (cell) để khi transition, 
              cái mới sẽ che khít cái cũ nhờ bg-main mà không làm giật Layout.
          */}
          <div className="grid grid-cols-1 grid-rows-1 max-h-[98vh] md:max-h-[90vh] overflow-y-auto md:overflow-visible scrollbar-hide">
            
            {/* LOGIN VIEW */}
            {view === "LOGIN" && (
              <div className="col-start-1 row-start-1 animate-in fade-in zoom-in-95 slide-in-from-right-8 duration-300 ease-out">
                <LoginModal />
              </div>
            )}
            
            {/* SIGN UP VIEW */}
            {view === "SIGN_UP" && (
              <div className="col-start-1 row-start-1 animate-in fade-in zoom-in-95 slide-in-from-right-8 duration-300 ease-out">
                <SignUpModal />
              </div>
            )}
            
            {/* FORGOT PASSWORD VIEW */}
            {view === "FORGOT_PASSWORD" && (
              <div className="col-start-1 row-start-1 animate-in fade-in zoom-in-95 slide-in-from-right-8 duration-300 ease-out">
                <ForgotPasswordModal />
              </div>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}