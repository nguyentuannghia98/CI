"use server";

import { createClient } from "@/lib/supabase/server"; // Đường dẫn tùy theo project của bạn
import { revalidatePath } from "next/cache";

/**
 * ACTION: Xóa tạm thời bình luận (Soft Delete).
 * Chỉ chủ sở hữu bình luận mới xóa được.
 */
export async function deleteComment(commentId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Bạn cần đăng nhập để xóa bình luận.");

  const { data, error } = await supabase
    .from("comments")
    .update({ is_deleted: true })
    .eq("id", commentId)
    .eq("user_id", user.id)
    .select();

  if (error) {
    console.error("Error deleting comment:", error.message);
    throw new Error("Không thể xóa bình luận");
  }

  revalidatePath("/");
  return data;
}
