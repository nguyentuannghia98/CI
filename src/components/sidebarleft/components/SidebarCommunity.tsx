"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client"; // Helper chuẩn mới
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthModalStore } from "@/components/auth/store/useAuthModalStore";
import { useCurrentUser } from "@/components/MiniChat/MiniChatBox/hooks/useCurrentUser"; // Hook lấy ID đã cập nhật trước đó

interface Community {
  id: string;
  title: string | null;
  avatar_url: string | null;
}

interface CommunityMemberRow {
  communities: Community | null;
}

export default function SidebarCommunity() {
  const router = useRouter();
  const supabase = createClient();
  
  // Sử dụng hook useCurrentUser đã được tối ưu hóa với TanStack Query
  const currentUserId = useCurrentUser();
  const openLogin = useAuthModalStore((state) => state.openLogin);

  const { data: communities = [], isLoading } = useQuery({
    queryKey: ["user-communities", currentUserId],
    queryFn: async () => {
      if (!currentUserId) return [];

      const { data, error } = await supabase
        .from("community_members")
        .select(`
          communities (
            id,
            title,
            avatar_url
          )
        `)
        .eq("user_id", currentUserId);

      if (error) throw error;

      const rows = (data as unknown as CommunityMemberRow[]) || [];
      return rows
        .map((row) => row.communities)
        .filter((c): c is Community => c !== null);
    },
    // Chỉ chạy query khi thực sự có ID người dùng
    enabled: !!currentUserId,
    staleTime: 1000 * 60 * 5, // Cache 5 phút
  });

  const handleCreateCommunity = () => {
    if (!currentUserId) {
      openLogin();
      return;
    }
    router.push("/create-community");
  };

  return (
    <>
      <div className="px-4 mb-6 mt-3">
        <div className="flex items-center justify-between text-[11px] uppercase text-gray-600 font-bold tracking-widest py-2">
          Cộng đồng của bạn
        </div>

        {/* Thêm cursor-pointer vào button dưới đây */}
        <button
          onClick={handleCreateCommunity}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-orange-50 text-gray-600 hover:text-orange-600 transition-all group mb-2 text-left cursor-pointer"
        >
          <div className="w-6 h-6 rounded-md bg-gray-100 group-hover:bg-orange-100 flex items-center justify-center transition-colors">
            <Plus className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Tạo cộng đồng</span>
        </button>

        <div className="space-y-0.5">
          {isLoading && currentUserId ? (
            <SidebarSkeleton />
          ) : !currentUserId ? (
            <div className="px-2 py-4 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              <p className="text-[11px] text-gray-600">Đăng nhập để xem cộng đồng</p>
            </div>
          ) : communities.length === 0 ? (
            <div className="px-2 py-4 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-[11px] text-gray-600 leading-relaxed px-2">
                Bạn chưa tham gia cộng đồng nào.
              </p>
            </div>
          ) : (
            communities.map((c) => (
              <Link
                key={c.id}
                href={`/communities/${c.id}`}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 group transition-colors cursor-pointer"
              >
                <div className="relative w-6 h-6 shrink-0 rounded-full overflow-hidden border border-gray-100 bg-gray-50">
                  <Image
                    src={c.avatar_url || "/default-community.png"}
                    alt={c.title || "Community"}
                    fill
                    className="object-cover"
                    sizes="24px"
                  />
                </div>
                <span className="truncate text-sm font-medium text-gray-700 group-hover:text-black">
                  {c.title}
                </span>
                <Star className="w-3.5 h-3.5 text-gray-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity hover:text-yellow-400" />
              </Link>
            ))
          )}
        </div>
      </div>
    </>
  );
}

const SidebarSkeleton = () => (
  <div className="space-y-2">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center gap-3 px-2 py-2 animate-pulse">
        <div className="w-6 h-6 bg-gray-200 rounded-full" />
        <div className="h-4 bg-gray-200 rounded w-24" />
      </div>
    ))}
  </div>
);