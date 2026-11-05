"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-xl font-semibold">Đã xảy ra lỗi</h2>
      <p className="text-sm opacity-70">Vui lòng thử lại. Nếu lỗi tiếp diễn, hãy tải lại trang.</p>
      <button
        onClick={() => reset()}
        className="rounded-full border px-5 py-2 text-sm transition-colors hover:opacity-80"
        style={{ borderColor: "rgba(var(--border-main), 0.5)" }}
      >
        Thử lại
      </button>
    </div>
  );
}
