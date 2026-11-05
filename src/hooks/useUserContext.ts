// hooks/useUserContext.ts
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useUserContext() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["userContext"],
    queryFn: async () => {
      // Dùng getUser() (đã xác minh) thay vì getSession() (không xác minh)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const [userRes, likesRes] = await Promise.all([
        supabase
          .from("users")
          // THÊM "id" VÀO ĐÂY
          .select("id, username, avatar_url")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("product_likes")
          .select("product_id")
          .eq("user_id", user.id),
      ]);

      // Không nuốt lỗi: log để dễ chẩn đoán thay vì trả dữ liệu rỗng im lặng
      if (userRes.error) console.error("useUserContext users error:", userRes.error.message);
      if (likesRes.error) console.error("useUserContext likes error:", likesRes.error.message);

      const meta = user.user_metadata;

      return {
        user: {
          // Gán id từ DB hoặc fallback về id của session
          id: userRes.data?.id ?? user.id,
          username: userRes.data?.username ?? meta.full_name ?? meta.user_name ?? "Thành viên",
          avatar_url: userRes.data?.avatar_url ?? meta.avatar_url ?? null,
        },
        likedIds: (likesRes.data?.map((l) => l.product_id).filter(Boolean) as string[]) ?? [],
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}
