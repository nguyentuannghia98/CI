import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client"; // Đường dẫn đến file của bạn

export function useBranchProducts(branchId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["products", "branch", branchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          communities!inner (
            id,
            title,
            branch_id
          ),
          product_tags (
            id,
            tag_id
          ),
          product_likes (
            id,
            user_id
          ),
          comments (
            id,
            content,
            created_at,
            user_id
          )
        `)
        .eq("communities.branch_id", branchId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      console.log(`Kết quả trả về cho branch ${branchId}:`, data?.length);
      return data;
    },
    enabled: !!branchId,
  });
}