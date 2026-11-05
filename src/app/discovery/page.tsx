import CommunitiesView from "@/components/Discover/CommunitiesView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Khám phá Cộng đồng Gaming & Công Nghệ | NexLoot",
  description: "Tham gia các cộng đồng thú vị, giao lưu kết nối và cùng chia sẻ kinh nghiệm trên NexLoot.",
};

export default function CommunitiesPage() {
  return (
    <div className="min-h-screen transition-colors duration-300">
      <CommunitiesView />
    </div>
  );
}
