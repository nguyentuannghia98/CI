"use client";

import React from "react";
import CommunityBanner from "@/components/communities/Components/banner"; 
import CommunityAvatar from "@/components/communities/Components/Avatar"; 
import { Database } from "@/types/supabase";

type Community = Database["public"]["Tables"]["communities"]["Row"];

interface CommunityHeaderProps {
  community: Community;
  role: string; 
}

export default function CommunityHeader({ community, role }: CommunityHeaderProps) {
  return (
    <div className="relative w-full">
      {/* 1. BANNER COMPONENT */}
      <CommunityBanner 
        communityId={community.id}
        bannerUrl={community.banner_url}
        title={community.title}
        role={role} 
      />

      {/* 2. THÔNG TIN CHI TIẾT CỘNG ĐỒNG */}
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="relative flex items-end gap-4 md:gap-6 pb-6">
          
          <div className="z-10 relative">
            <CommunityAvatar
              communityId={community.id}
              url={community.avatar_url}
              alt={community.title || "Avatar"}
              role={role} 
            />
          </div>
          
          {/* TÊN VÀ ID CỘNG ĐỒNG */}
          <div className="flex-1 mb-2">
            {/* ĐÃ CHỈNH SỬA: Dùng font-extralight để đảm bảo chữ mỏng nhất có thể, bỏ hoàn toàn độ đậm */}
            <h1 className="text-2xl md:text-4xl font-extralight text-gray-900 dark:text-white leading-tight drop-shadow-sm">
              {community.title}
            </h1>
            
            <div className="flex items-center gap-2 mt-1">
              {/* ĐÃ XÓA DÒNG HIỂN THỊ ID CỘNG ĐỒNG Ở ĐÂY */}

              {/* Hiển thị badge role */}
              {role === "owner" && (
                <span className="text-[10px] uppercase tracking-wider bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full font-normal">
                  Chủ sở hữu
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}