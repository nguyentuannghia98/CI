"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitUserRating({
  reviewerId,
  reviewedUserId,
  rating,
  comment,
}: {
  reviewerId: string;
  reviewedUserId: string;
  rating: number;
  comment: string;
}) {
  // THÊM AWAIT Ở ĐÂY
  const supabase = await createClient(); 

  // Kiểm tra auth an toàn (Vì dùng Anon Key + Cookies)
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user || user.id !== reviewerId) {
    throw new Error("Xác thực không hợp lệ");
  }

  const { data, error } = await supabase
    .from("user_ratings")
    .upsert({
      reviewer_id: reviewerId,
      reviewed_user_id: reviewedUserId,
      rating,
      comment: comment.trim(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}