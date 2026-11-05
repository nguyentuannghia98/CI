"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // createPortal(nội dung_cần_vẽ, nơi_vẽ_ra)
  // document.body đảm bảo nó nằm ở cấp cao nhất của trang web
  return mounted ? createPortal(children, document.body) : null;
}