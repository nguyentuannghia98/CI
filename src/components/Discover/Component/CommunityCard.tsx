"use client";

import Link from "next/link";
import Image from "next/image";
import type { Database } from "@/types/supabase";
import { useTransition, useState, useEffect } from "react"; 
import { Loader2, Check, Plus, Users, Sparkles } from "lucide-react";
import { toggleCommunityMembership } from "@/app/actions/ComunnitiesActions/JoinLeave";
import { createClient } from "@/lib/supabase/client";

type Community = Database["public"]["Tables"]["communities"]["Row"];

interface CommunityCardProps {
  community: Community;
}

export default function CommunityCard({ community }: CommunityCardProps) {
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  
  const [hasJoined, setHasJoined] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkJoinStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);

      const { data } = await supabase
        .from("community_members")
        .select("id")
        .eq("community_id", community.id)
        .eq("user_id", user.id)
        .maybeSingle(); 

      if (data) setHasJoined(true);
    };

    checkJoinStatus();
  }, [community.id, supabase]);

  const handleToggleJoin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      alert("Vui lòng đăng nhập để tham gia cộng đồng");
      return;
    }

    startTransition(async () => {
      try {
        const result = await toggleCommunityMembership(community.id, hasJoined);
        if (result.success) {
          setHasJoined(!hasJoined); 
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Đã có lỗi xảy ra";
        alert(message);
      }
    });
  };

  const memberCount = Math.max(0, (community.members_count || 0) + (hasJoined ? 1 : 0));

  return (
    <Link
      href={`/communities/${community.id}`}
      className="group relative p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between h-[210px] cursor-pointer overflow-hidden backdrop-blur-md shadow-lg hover:shadow-2xl hover:shadow-orange-500/10 hover:-translate-y-1.5"
      style={{ 
        backgroundColor: 'rgb(var(--bg-card))', 
        borderColor: 'rgba(var(--border-main), 0.4)' 
      }}
    >
      {/* Hiệu ứng hào quang góc trên khi Hover */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-500/10 via-amber-500/5 to-transparent rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Phần Header của Thẻ */}
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex gap-4 min-w-0">
          {/* Avatar Container với viền phát sáng */}
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 border shadow-md group-hover:scale-105 transition-transform duration-300 relative"
            style={{ 
              backgroundColor: 'rgb(var(--bg-surface))', 
              borderColor: 'rgba(var(--border-main), 0.6)' 
            }}
          >
            {community.avatar_url ? (
              <Image
                src={community.avatar_url}
                alt={community.title || ""}
                width={56}
                height={56}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-purple-600/20 flex items-center justify-center">
                <span className="text-orange-400 font-black text-xl tracking-tight">
                  {community.title?.charAt(0).toUpperCase() || "C"}
                </span>
              </div>
            )}
          </div>

          {/* Tên & Số lượng thành viên */}
          <div className="min-w-0 flex flex-col justify-center">
            <h3 
              className="text-[17px] font-bold group-hover:text-orange-400 transition-colors leading-snug truncate"
              style={{ color: 'rgb(var(--text-main))' }}
              title={community.title || ""}
            >
              {community.title}
            </h3>
            
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span 
                className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border"
                style={{ 
                  backgroundColor: 'rgb(var(--bg-surface))',
                  borderColor: 'rgba(var(--border-main), 0.4)',
                  color: 'rgb(var(--text-muted))' 
                }}
              >
                <Users size={12} className="text-orange-400 shrink-0" />
                <span>{memberCount.toLocaleString("vi-VN")} thành viên</span>
              </span>

              {community.category && (
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-500/90 dark:text-amber-400/90 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                  {community.category}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Nút Tham gia / Đã vào */}
        <button
          onClick={handleToggleJoin}
          disabled={isPending}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex-shrink-0 flex items-center gap-1.5 cursor-pointer shadow-md hover:scale-105 active:scale-95
            ${hasJoined 
              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-rose-500/15 hover:text-rose-400 hover:border-rose-500/30" 
              : "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/25 border border-orange-400/30"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={hasJoined ? "Nhấp để rời cộng đồng" : "Tham gia cộng đồng"}
        >
          {isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : hasJoined ? (
            <Check size={14} className="text-emerald-400 group-hover/btn:hidden" />
          ) : (
            <Plus size={14} />
          )}
          
          <span>
            {isPending ? "..." : hasJoined ? "Đã vào" : "Tham gia"}
          </span>
        </button>
      </div>

      {/* Mô tả cộng đồng */}
      <div className="relative z-10 pt-2 border-t border-dashed" style={{ borderColor: 'rgba(var(--border-main), 0.25)' }}>
        <p 
          className="text-[13px] line-clamp-2 leading-relaxed font-normal"
          style={{ color: 'rgb(var(--text-muted))' }}
        >
          {community.description || "Khám phá những điều thú vị cùng cộng đồng này."}
        </p>
      </div>
    </Link>
  );
}
