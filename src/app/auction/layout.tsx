import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đấu giá",
  description:
    "Tham gia các phiên đấu giá trên NexLoot — đặt giá, theo dõi và sở hữu những món đồ độc đáo.",
  alternates: { canonical: "/auction" },
};

export default function AuctionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
