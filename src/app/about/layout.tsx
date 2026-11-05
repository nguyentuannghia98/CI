import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Giới thiệu",
  description:
    "Tìm hiểu về NexLoot — chợ cộng đồng nơi bạn mua bán, đấu giá và kết nối với những người sáng tạo.",
  alternates: { canonical: "/about" },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
