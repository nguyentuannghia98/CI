"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, UserPlus, Trash2, LogOut } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/components/MiniChat/MiniChatBox/hooks/useCurrentUser";
import { useRouter } from "next/navigation";
import { toggleCommunityMembership, deleteCommunityAction } from "@/app/actions/ComunnitiesActions/JoinLeave";

interface JoinLeaveButtonProps {
  communityId: string;
  onChange?: (isMember: boolean) => void;
}

const JoinLeaveButton: React.FC<JoinLeaveButtonProps> = ({ communityId, onChange }) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const currentUserId = useCurrentUser();
  const router = useRouter();
  const [isHovering, setIsHovering] = useState(false);

  // 1. LẤY TRẠNG THÁI THÀNH VIÊN
  const { data: memberData, isLoading: isChecking } = useQuery({
    queryKey: ["community-membership", communityId, currentUserId],
    queryFn: async () => {
      if (!currentUserId) return null;
      const { data } = await supabase
        .from("community_members")
        .select("role")
        .eq("community_id", communityId)
        .eq("user_id", currentUserId)
        .maybeSingle();
      return data;
    },
    enabled: !!currentUserId,
  });

  const isMember = !!memberData;
  const isOwner = memberData?.role === "owner";

  // 2. MUTATION: THAM GIA / RỜI
  const { mutate: handleToggle, isPending } = useMutation({
    mutationFn: () => {
      if (!currentUserId) throw new Error("Vui lòng đăng nhập");
      return toggleCommunityMembership(communityId, isMember);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-membership", communityId] });
      queryClient.invalidateQueries({ queryKey: ["community", communityId] });
      onChange?.(!isMember);
    },
    onError: (err: Error) => alert(err.message),
  });

  // 3. MUTATION: XÓA CỘNG ĐỒNG
  const { mutate: handleDelete, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      if (!window.confirm("Xóa cộng đồng này?")) return;
      return deleteCommunityAction(communityId);
    },
    onSuccess: (data) => {
      if (data) {
        alert("Đã xóa cộng đồng.");
        router.push("/communities");
      }
    },
    onError: (err: Error) => alert(err.message),
  });

  if (isChecking) return <div className="w-28 h-9 animate-pulse rounded-full" style={{ backgroundColor: 'rgba(var(--border-main), 0.1)' }} />;
  if (!currentUserId) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => handleToggle()}
        disabled={isPending || isDeleting}
        className={`
          relative flex items-center justify-center gap-2 px-5 py-1.5 rounded-full font-normal text-sm transition-all duration-200 min-w-[120px] border shadow-sm cursor-pointer
        `}
        style={{
          // Nút "Tham gia" sẽ lấy màu nền của hệ thống để Sáng ra Sáng, Tối ra Tối
          backgroundColor: isMember 
            ? (isHovering ? 'rgba(239, 68, 68, 0.1)' : 'transparent') 
            : 'rgb(var(--bg-card))',
          
          // Màu chữ luôn đi theo màu chữ chính của hệ thống
          color: isMember 
            ? (isHovering ? 'rgb(239, 68, 68)' : 'rgb(var(--text-main))') 
            : 'rgb(var(--text-main))',
          
          // Viền để phân biệt nút với nền web
          borderColor: isMember 
            ? (isHovering ? 'rgba(239, 68, 68, 0.2)' : 'rgba(var(--border-main), 0.5)') 
            : 'rgba(var(--border-main), 0.8)'
        }}
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isMember ? (
          isHovering ? (
            <span className="flex items-center gap-1"><LogOut size={14}/> Rời nhóm</span>
          ) : (
            "Đã tham gia"
          )
        ) : (
          <span className="flex items-center gap-1"><UserPlus size={16} /> Tham gia</span>
        )}
      </button>

      {isOwner && (
        <button
          type="button"
          onClick={() => handleDelete()}
          disabled={isPending || isDeleting}
          className="p-2 rounded-full transition-colors cursor-pointer"
          style={{ color: 'rgb(var(--text-muted))' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'rgb(239, 68, 68)';
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgb(var(--text-muted))';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Xóa cộng đồng"
        >
          {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 size={18} />}
        </button>
      )}
    </div>
  );
};

export default JoinLeaveButton;