"use server";

import { createClient } from "@/lib/supabase/server"; // Đường dẫn tùy theo project của bạn
import { revalidatePath } from "next/cache";

/**
 * ACTION: Chỉnh sửa nội dung bình luận.
 * Chỉ chủ sở hữu bình luận mới sửa được.
 */
export async function updateComment(commentId: string, newContent: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Bạn cần đăng nhập để sửa bình luận.");

  const { data, error } = await supabase
    .from("comments")
    .update({
      content: newContent,
      updated_at: new Date().toISOString(),
    })
    .eq("id", commentId)
    .eq("user_id", user.id)
    .select();

  if (error) {
    console.error("Error updating comment:", error.message);
    throw new Error("Không thể cập nhật bình luận");
  }

  revalidatePath("/");
  return data;
}
