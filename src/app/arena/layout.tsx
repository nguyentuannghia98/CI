import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sàn đấu",
  description:
    "Sàn đấu kiến thức của NexLoot — tranh tài, tích lũy điểm và nhận voucher từ các cửa hàng.",
  alternates: { canonical: "/arena" },
};

export default function ArenaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
