import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chính sách",
  description:
    "Các chính sách của NexLoot về quyền riêng tư, điều khoản sử dụng và quy tắc cộng đồng.",
  alternates: { canonical: "/policies" },
};

export default function PoliciesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
