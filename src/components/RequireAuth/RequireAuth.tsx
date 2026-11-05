"use client";

import React, { useState, HTMLAttributes } from "react";
import { useAuth } from "@/hooks/use-auth";
import LoginModal from "@/components/auth/components/LoginModal";

interface RequireAuthProps {
  // Chỉ chấp nhận ReactElement có các thuộc tính HTML cơ bản
  children: React.ReactElement<HTMLAttributes<HTMLElement>>;
  fallback?: React.ReactNode;
}

export function RequireAuth({ children, fallback }: RequireAuthProps) {
  const { isAuthenticated, isInitialLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  const handleProtectedAction = (e: React.MouseEvent) => {
    if (!isAuthenticated) {
      // Chặn mọi hành động lan tỏa và hành động mặc định
      e.preventDefault();
      e.stopPropagation();
      
      setShowLogin(true);
    }
  };

  if (isInitialLoading && fallback) return <>{fallback}</>;

  return (
    <>
      {/* Sử dụng React.isValidElement để đảm bảo an toàn trước khi clone */}
      {React.isValidElement(children) 
        ? React.cloneElement(children, {
            // Ép kiểu onClickCapture để TypeScript không than phiền
            onClickCapture: handleProtectedAction,
          } as HTMLAttributes<HTMLElement>)
        : children}

      {showLogin && (
        <LoginModal />
      )}
    </>
  );
}