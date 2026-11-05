import type { Metadata } from "next";

// Không cho công cụ tìm kiếm lập chỉ mục trang đặt lại mật khẩu (có token trong URL).
export const metadata: Metadata = {
  title: "Đặt lại mật khẩu",
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
