import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Liên hệ",
  description:
    "Liên hệ đội ngũ NexLoot để được hỗ trợ về mua bán, đấu giá, cộng đồng và tài khoản.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
