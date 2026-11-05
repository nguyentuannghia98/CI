"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="vi">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center font-sans">
          <h2 className="text-xl font-semibold">Có lỗi nghiêm trọng xảy ra</h2>
          <button
            onClick={() => reset()}
            className="rounded-full border px-5 py-2 text-sm transition-colors hover:opacity-80"
          >
            Thử lại
          </button>
        </div>
      </body>
    </html>
  );
}
