// src/app/actions/likeActions.ts
"use server";

import { createClient } from "@/lib/supabase/server"; // Đường dẫn tùy theo project của bạn

export async function toggleLikeAction(productId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Auth required" };

  // Kiểm tra Like tồn tại
  const { data: existing } = await supabase
    .from("product_likes")
    .select("id")
    .eq("product_id", productId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    // Unlike - Xóa dòng
    const { error } = await supabase.from("product_likes").delete().eq("id", existing.id);
    if (error) return { success: false };
    return { success: true, action: 'unliked' };
  } else {
    // Like - Thêm dòng
    const { error } = await supabase
      .from("product_likes")
      .insert({ product_id: productId, user_id: user.id });

    if (error) {
      // 23505 = unique_violation: một request khác vừa like trước đó (race) -> coi như đã like
      if ((error as { code?: string }).code === "23505") {
        return { success: true, action: 'liked' };
      }
      console.error("Like error:", error.message);
      return { success: false };
    }
    return { success: true, action: 'liked' };
  }
  // Tuyệt đối KHÔNG dùng revalidatePath ở đây để tránh load lại trang
}
