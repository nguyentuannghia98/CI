"use client";

import { useState, useEffect } from "react"; 
import { createClient } from "@/lib/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mapToProductList, RawProductData } from "@/lib/mapper/productMapper";
import type { UserData, ProfileFormData } from "@/components/profile/type/types";
import { useCurrentUser } from "@/components/MiniChat/MiniChatBox/hooks/useCurrentUser";

// --- INTERFACES ---
export interface UserReview {
  id: string; reviewer_id: string; reviewed_user_id: string; rating: number;
  comment: string; created_at: string; updated_at: string;
  user: { id: string; username: string | null; avatar_url: string | null; } | null;
}
interface RawRatingResponse {
  id: string; reviewer_id: string; reviewed_user_id: string; rating: number;
  comment: string | null; created_at: string; updated_at: string;
  user: { id: string; username: string | null; avatar_url: string | null; } | null;
}
export interface RatingStats { avgRating: number; totalReviews: number; reviews: UserReview[]; }
interface ProfileQueryResult { user: UserData; isFollowing: boolean; stats: RatingStats; }

export function useProfileData(profileId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const currentUserId = useCurrentUser();

  // 1. FETCH PROFILE
  const { data: profileData, isLoading: loadingProfile } = useQuery<ProfileQueryResult>({
    queryKey: ["profile", profileId, currentUserId],
    queryFn: async () => {
      const [profileRes, followRes, ratingsRes] = await Promise.all([
        supabase.from("users").select("*, is_online").eq("id", profileId).maybeSingle(),
        currentUserId && currentUserId !== profileId
          ? supabase.from("follows").select("*").eq("follower_id", currentUserId).eq("following_id", profileId).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        // Sửa câu lệnh select ở đây để ổn định hơn
        supabase.from("user_ratings")
          .select(`
            id, reviewer_id, reviewed_user_id, rating, comment, created_at, updated_at, 
            user:users!user_ratings_reviewer_id_fkey (id, username, avatar_url)
          `)
          .eq("reviewed_user_id", profileId)
          .order("created_at", { ascending: false }),
      ]);
      if (profileRes.error) throw profileRes.error;
      const rawReviews = (ratingsRes.data as unknown as RawRatingResponse[]) || [];
      const reviews: UserReview[] = rawReviews.map((r) => ({ ...r, comment: r.comment ?? "" }));
      const totalReviews = reviews.length;
      const avgRating = totalReviews > 0 ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews) * 10) / 10 : 0;
      return { user: profileRes.data as UserData, isFollowing: !!followRes.data, stats: { avgRating, totalReviews, reviews } };
    },
    enabled: !!profileId,
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 60 * 5, 
  });

  // 2. FETCH PRODUCTS
  const { data: productData } = useQuery({
    queryKey: ["user-products", profileId],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select(`*, users:user_id (id, username, avatar_url), communities:community_id (id, title, avatar_url), product_tags (tags:tag_id (name)), product_likes (count), comments (id, content, created_at, user:users (username, avatar_url))`).eq("user_id", profileId).order("created_at", { ascending: false });
      if (error) throw error;
      return mapToProductList(data as unknown as RawProductData[]);
    },
    enabled: !!profileId,
    placeholderData: (previousData) => previousData,
  });

  // 3. FORM STATE & LOGIC
  const [formData, setFormData] = useState<ProfileFormData>({
    username: "", avatar_url: "", address: "", phone: "", birth: "", bio: "", selling_policy: "",
  });

  useEffect(() => {
    if (profileData?.user && formData.username === "") { 
      setFormData({
        username: profileData.user.username ?? "",
        avatar_url: profileData.user.avatar_url ?? "",
        address: profileData.user.address ?? "",
        phone: profileData.user.phone?.toString() ?? "",
        birth: profileData.user.birth ?? "",
        bio: profileData.user.bio ?? "",
        selling_policy: profileData.user.selling_policy ?? "",
      });
    }
  }, [profileData?.user, formData.username]); 

  // 4. MUTATIONS
  const saveProfileMutation = useMutation({
    mutationFn: async (updatedData: ProfileFormData) => {
      const { error } = await supabase.from("users").update({
        username: updatedData.username, address: updatedData.address,
        phone: updatedData.phone ? Number(updatedData.phone) : null,
        birth: updatedData.birth || null, avatar_url: updatedData.avatar_url,
        bio: updatedData.bio, selling_policy: updatedData.selling_policy,
      }).eq("id", profileId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile", profileId] }),
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["user-products", profileId] }),
  });

  // 5. EXPORTS
  return {
    user: profileData?.user ?? null,
    ratingStats: profileData?.stats ?? { avgRating: 0, totalReviews: 0, reviews: [] },
    loading: loadingProfile && !profileData, 
    isOwnProfile: currentUserId === profileId,
    formData,
    setFormData,
    isFollowing: !!profileData?.isFollowing,
    updateAvatar: (url: string) => setFormData(prev => ({ ...prev, avatar_url: url })),
    saveProfile: async () => {
      try { await saveProfileMutation.mutateAsync(formData); return { error: null }; }
      catch (err) { return { error: err }; }
    },
    deleteUserProduct: (id: string) => deleteProductMutation.mutate(id),
    userProducts: productData?.products ?? [],
  };
}