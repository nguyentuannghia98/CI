import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tuyển dụng",
  description: "Cơ hội nghề nghiệp tại NexLoot — cùng xây dựng chợ cộng đồng cho người sáng tạo.",
  alternates: { canonical: "/careers" },
};

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
