import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";

export interface UserProfileData {
  id: string;
  username: string | null;
  avatar_url: string | null;
  is_online: boolean; // ✅ Đã thêm để nhận trạng thái từ DB
}

export interface Branch {
  id: string;
  name: string;
}

export function useHeaderData() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // 1. Query lấy danh sách chi nhánh (Cache 1 tiếng vì ít thay đổi)
  const branchesQuery = useQuery({
    queryKey: ["community_branches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_branches")
        .select("id, name")
        .order("name")
        .limit(4);
      if (error) throw error;
      return data as Branch[];
    },
    staleTime: 1000 * 60 * 60, 
  });

  // 2. Query lấy thông tin User Profile
  const userQuery = useQuery({
    queryKey: ["userHeaderProfile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("users")
        .select("id, username, avatar_url, is_online") // ✅ Đã thêm is_online vào đây
        .eq("id", user.id)
        .single();
      
      if (error) return null;
      return data as UserProfileData;
    },
    // Không fetch lại liên tục nếu dữ liệu còn "tươi"
    staleTime: 1000 * 60 * 5, 
  });

  // 3. Lắng nghe thay đổi Auth để xóa cache hoặc fetch lại
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        queryClient.invalidateQueries({ queryKey: ["userHeaderProfile"] });
      }
      if (event === "SIGNED_OUT") {
        queryClient.setQueryData(["userHeaderProfile"], null);
        // Xóa sạch cache để đảm bảo an toàn bảo mật
        queryClient.clear(); 
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, queryClient]);

  return {
    userData: userQuery.data ?? null,
    branches: branchesQuery.data ?? [],
    loading: userQuery.isLoading || branchesQuery.isLoading,
    // Helper để update local nếu cần
    setUserData: (data: UserProfileData | null) => 
      queryClient.setQueryData(["userHeaderProfile"], data),
  };
}