import { create } from "zustand";
import { Database } from "@/types/supabase";

// Định nghĩa Type từ Database của bạn
type Community = Database["public"]["Tables"]["communities"]["Row"];

interface CommunityState {
  currentCommunity: Community | null;
  communityId: string | null;
  isMod: boolean; 
  isCommunityPage: boolean; // Công tắc để UniversalCard biết đang ở trong Group
  userRole: "member" | "mod" | "guest"; // Thêm guest cho an toàn
  membersCount: number;

  // Hàm này sẽ được gọi ở Layout hoặc Page của Community
  setCommunityMetadata: (community: Community, role: string | null) => void;
  // Hàm này gọi khi unmount trang (cleanup)
  resetCommunity: () => void;
}

export const useCommunityStore = create<CommunityState>((set) => ({
  currentCommunity: null,
  communityId: null,
  isMod: false,
  isCommunityPage: false,
  userRole: 'guest',
  membersCount: 0,

  setCommunityMetadata: (community, role) => {
    // Chuẩn hóa role về lowercase để tránh lỗi MOD/mod
    const normalizedRole = role?.toLowerCase();
    const finalRole = normalizedRole === "mod" ? "mod" : (role ? "member" : "guest");

    set({ 
      currentCommunity: community, 
      communityId: community.id,
      userRole: finalRole as "member" | "mod" | "guest",
      isMod: finalRole === "mod",
      isCommunityPage: true, // Bật công tắc "Đang ở địa bàn Community"
      membersCount: Number(community.members_count || 0),
    });
  },

  resetCommunity: () => set({ 
    currentCommunity: null, 
    communityId: null,
    isMod: false, 
    isCommunityPage: false, // Tắt công tắc khi thoát trang
    userRole: 'guest',
    membersCount: 0
  }),
}));