"use client";

import { Users } from "lucide-react";
import type { Database } from "@/types/supabase";
import CommunityCard from "./CommunityCard";

type Community = Database["public"]["Tables"]["communities"]["Row"];

type Props = {
  communities: Community[];
  onOpen: (id: string) => void;
};

export default function CommunityList({ communities, onOpen }: Props) {
  return (
    /* ĐÃ LOẠI BỎ DARK MODE: 
       Bỏ bg-white và shadow để nó hòa tan hoàn toàn vào nền của CreateCommunityPage.
    */
    <div className="w-full max-w-4xl p-2">
      
      {/* Tiêu đề sạch sẽ, không dùng font đậm, dùng biến màu hệ thống */}
      <h2 
        className="text-2xl font-light mb-6 flex items-center" 
        style={{ color: 'rgb(var(--text-main))' }}
      >
        <Users className="w-7 h-7 text-orange-400 mr-3" />
        Cộng đồng đã tạo
      </h2>

      {communities.length === 0 ? (
        /* Text khi trống - mờ nhẹ trên nền trang */
        <div 
          className="text-center py-10 border-2 border-dashed rounded-2xl"
          style={{ borderColor: 'rgba(var(--border-main), 0.3)' }}
        >
           <p className="font-normal" style={{ color: 'rgb(var(--text-muted))' }}>
             Chưa có cộng đồng nào được hiển thị.
           </p>
        </div>
      ) : (
        /* Grid danh sách card */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((c) => (
            <CommunityCard key={c.id} c={c} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}