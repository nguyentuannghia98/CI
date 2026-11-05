import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tạo cộng đồng",
  description: "Tạo cộng đồng của riêng bạn trên NexLoot và mời mọi người cùng giao thương.",
  alternates: { canonical: "/create-community" },
  robots: { index: false, follow: true },
};

export default function CreateCommunityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
