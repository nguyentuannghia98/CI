"use client";

import { useEffect, useRef } from "react";
import { useAuthActions } from "@/components/auth/store/AuthStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Vì useAuthActions là custom hook trả về object actions
  const { initialize } = useAuthActions(); 
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // initialize() trả về hàm cleanup
    cleanupRef.current = initialize();

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [initialize]);

  return <>{children}</>;
}