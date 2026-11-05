import type { Metadata } from "next";

// Các trang xác thực (callback/update) mang token — không lập chỉ mục.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
