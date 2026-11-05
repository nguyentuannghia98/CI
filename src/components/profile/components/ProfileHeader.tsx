"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Edit3,
  Save,
  X,
  UserPlus,
  UserCheck,
  MessageCircle,
  Flag,
  Info,
  Star,
  ShieldCheck,
  Users,
  Loader2,
} from "lucide-react";
import { toggleFollow } from "@/app/actions/Follows";

export default function ProfileHeader({
  isEditing,
  onEdit,
  onSave,
  onCancel,
  isFollowing: initialIsFollowing,
  isOwnProfile,
  onMessage,
  onReport,
  activeTab,
  onTabChange,
  followingId,
  onSuccess,
}: {
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void | Promise<void>;
  onCancel: () => void;
  isFollowing: boolean;
  isOwnProfile: boolean;
  onMessage?: () => void;
  onReport?: () => void;
  displayName: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  followingId: string;
  onSuccess?: () => void;
}) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPending) return;

    const previousState = isFollowing;
    setIsFollowing(!previousState);

    startTransition(async () => {
      try {
        const result = await toggleFollow(followingId);
        
        if (result.success) {
          onSuccess?.();
        } else {
          setIsFollowing(previousState);
          console.error("Follow error:", result.error);
        }
      } catch (error) {
        setIsFollowing(previousState);
        console.error("Network error:", error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-4 w-full pb-2 transition-colors duration-300">
      <div className="flex flex-nowrap items-center justify-between gap-3 overflow-x-auto pb-3 scrollbar-hide w-full">
        
        {/* NHÓM 1: Tabs */}
        <div 
          className="flex flex-nowrap items-center gap-1.5 p-1 rounded-xl border shrink-0 transition-colors duration-300"
          style={{ 
            backgroundColor: 'rgba(var(--border-main), 0.1)', 
            borderColor: 'rgba(var(--border-main), 0.2)' 
          }}
        >
          {[
            { id: "info", label: "Thông tin", icon: Info },
            { id: "rating", label: "Đánh giá", icon: Star },
            { id: "policy", label: "Chính sách", icon: ShieldCheck },
            { id: "about", label: "Về chúng tôi", icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange?.(tab.id)}
              className={`px-3 py-2 rounded-lg text-xs md:text-sm font-normal flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "shadow-sm border"
                  : "hover:bg-white/10"
              }`}
              style={{
                backgroundColor: activeTab === tab.id ? 'rgb(var(--bg-card))' : 'transparent',
                color: activeTab === tab.id ? '#c2410c' : 'rgb(var(--text-muted))',
                borderColor: activeTab === tab.id ? 'rgba(var(--border-main), 0.3)' : 'transparent'
              }}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* NHÓM 2: Tương tác */}
        <div className="flex flex-nowrap items-center gap-2 shrink-0 ml-auto">
          {!isOwnProfile && (
            <>
              <button
                type="button"
                onClick={handleFollowClick}
                disabled={isPending}
                className={`h-10 px-3.5 flex items-center justify-center gap-1.5 rounded-xl transition-all cursor-pointer shadow-sm shrink-0 border whitespace-nowrap text-[13px] font-normal
                  ${
                    isFollowing
                      ? "hover:bg-white/5"
                      : "bg-[#9b4de0] text-white border-transparent hover:bg-[#8239c4]"
                  } ${isPending ? "opacity-70" : ""}
                `}
                style={isFollowing ? {
                  backgroundColor: 'rgb(var(--bg-card))',
                  color: 'rgb(var(--text-main))',
                  borderColor: 'rgba(var(--border-main), 0.3)'
                } : {}}
              >
                {isPending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : isFollowing ? (
                  <UserCheck size={18} />
                ) : (
                  <UserPlus size={18} />
                )}
                <span>
                  {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                </span>
              </button>

              {onMessage && (
                <button
                  type="button"
                  onClick={onMessage}
                  className="h-10 px-3.5 border rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-[13px] font-normal shadow-sm shrink-0 hover:border-orange-400 hover:text-orange-500 whitespace-nowrap"
                  style={{
                    backgroundColor: 'rgb(var(--bg-card))',
                    borderColor: 'rgba(var(--border-main), 0.3)',
                    color: 'rgb(var(--text-main))'
                  }}
                >
                  <MessageCircle size={18} />
                  <span>Nhắn tin</span>
                </button>
              )}

              {onReport && (
                <button
                  type="button"
                  onClick={onReport}
                  className="h-10 px-3.5 border rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer text-[13px] font-normal shadow-sm shrink-0 hover:bg-red-500 hover:text-white whitespace-nowrap"
                  style={{
                    backgroundColor: 'rgb(var(--bg-card))',
                    borderColor: 'rgba(239, 68, 68, 0.4)', // Viền đỏ đặc trưng cho Tố cáo
                    color: 'rgb(var(--text-main))' // Chữ theo màu hệ thống
                  }}
                >
                  <Flag size={18} className="text-red-500" /> {/* Chỉ Icon giữ màu đỏ */}
                  <span>Tố cáo</span>
                </button>
              )}
            </>
          )}

          {isOwnProfile && (
            isEditing ? (
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={onSave} 
                  className="h-10 px-4 bg-green-600 text-white rounded-xl text-xs font-normal flex items-center gap-2 hover:bg-green-700 cursor-pointer shadow-md whitespace-nowrap"
                >
                  <Save size={18} /> Lưu
                </button>
                <button 
                  type="button" 
                  onClick={onCancel} 
                  className="h-10 px-4 border rounded-xl text-xs font-normal flex items-center gap-2 hover:bg-white/10 cursor-pointer shadow-sm whitespace-nowrap"
                  style={{
                    backgroundColor: 'rgb(var(--bg-card))',
                    borderColor: 'rgba(var(--border-main), 0.3)',
                    color: 'rgb(var(--text-main))'
                  }}
                >
                  <X size={18} /> Hủy
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onEdit}
                className="h-10 px-4 border rounded-xl text-xs font-normal flex items-center gap-2 transition-all cursor-pointer shadow-sm whitespace-nowrap"
                style={{
                  backgroundColor: 'rgb(var(--bg-card))',
                  borderColor: 'rgba(var(--border-main), 0.3)',
                  color: 'rgb(var(--text-main))'
                }}
              >
                <Edit3 size={18} /> Chỉnh sửa hồ sơ
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}