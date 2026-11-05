"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { mapToProductList, RawProductData } from "@/lib/mapper/productMapper";
import { useUser } from "@/components/auth/store/AuthStore";
import { useCommunityStore } from "@/lib/Zustard/CommunityStore/CommunityStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Product } from "@/components/UniversalCard/types/type";
import type { Database } from "@/types/supabase";

type Community = Database["public"]["Tables"]["communities"]["Row"];

export function useCommunityData(
  communityId: string,
  initialCommunity: Community,
  initialProducts: Product[]
) {
  const supabase = createClient();
  const currentUser = useUser();
  const queryClient = useQueryClient();
  const setCommunityMetadata = useCommunityStore((state) => state.setCommunityMetadata);
  const isMod = useCommunityStore(state => state.isMod);

  // 1. Lấy thông tin Community
  const communityQuery = useQuery({
    queryKey: ["community", communityId],
    queryFn: async () => {
      const { data, error } = await supabase.from("communities").select("*").eq("id", communityId).single();
      if (error) throw error;
      return data as Community;
    },
    initialData: initialCommunity,
  });

  // 2. Lấy Role (Chỉ có mod hoặc member)
  const roleQuery = useQuery({
    queryKey: ["community-role", communityId, currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return "member";
      const { data } = await supabase
        .from("community_members")
        .select("role")
        .eq("community_id", communityId)
        .eq("user_id", currentUser.id)
        .maybeSingle();
      
      return data?.role === "mod" ? "mod" : "member";
    },
    enabled: !!currentUser,
  });

  // Đồng bộ Store
  useEffect(() => {
    if (communityQuery.data) {
      setCommunityMetadata(communityQuery.data, roleQuery.data || "member");
    }
  }, [communityQuery.data, roleQuery.data, setCommunityMetadata]);

  // 3. Lấy bài viết
  const productsQuery = useQuery({
    queryKey: ["community-products", communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`*, users:user_id(id, username, avatar_url), communities:community_id(id, title, avatar_url), product_tags(tags:tag_id(name)), product_likes(count), comments(count)`)
        .eq("community_id", communityId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const { products } = mapToProductList(data as unknown as RawProductData[]);
      return products;
    },
    initialData: initialProducts,
  });

  // 4. Lấy báo cáo (Chỉ dành cho Mod)
  const reportsQuery = useQuery({
    queryKey: ["community-reports", communityId],
    queryFn: async () => {
      const [pRes, cRes] = await Promise.all([
        supabase.from("reports").select("*, products(title), reporter:reporter_id(username)").eq("community_id", communityId).eq("status", "pending"),
        supabase.from("comment_reports").select("*, comments(content), reporter:reporter_id(username)").eq("community_id", communityId).eq("status", "pending")
      ]);

      return [
        ...(pRes.data || []).map(r => ({ ...r, type: 'post' as const, displayContent: r.products?.title, targetId: r.product_id })),
        ...(cRes.data || []).map(r => ({ ...r, type: 'comment' as const, displayContent: r.comments?.content, targetId: r.comment_id }))
      ].sort((a, b) => {
        // FIX LỖI Ở ĐÂY: Dùng toán tử || "" để đảm bảo không truyền null vào new Date()
        const timeA = new Date(a.created_at || "").getTime();
        const timeB = new Date(b.created_at || "").getTime();
        return timeB - timeA;
      });
    },
    enabled: isMod && !!communityId, 
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["community-products", communityId] });
    queryClient.invalidateQueries({ queryKey: ["community-reports", communityId] });
  };

  return {
    community: communityQuery.data,
    products: productsQuery.data || [],
    reports: reportsQuery.data || [],
    user: currentUser,
    loading: communityQuery.isLoading || roleQuery.isFetching,
    refreshData
  };
}