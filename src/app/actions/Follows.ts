"use server";

import { createClient } from "@/lib/supabase/server"; // Đảm bảo bạn đã cấu hình supabase server client
import { revalidatePath } from "next/cache";

export async function toggleFollow(followingId: string) {
  const supabase = await createClient();

  // 1. Lấy thông tin user hiện tại (người đi follow)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Bạn cần đăng nhập để theo dõi" };

  const followerId = user.id;

  // Không cho phép tự follow chính mình
  if (followerId === followingId) return { success: false, error: "Bạn không thể theo dõi chính mình" };

  // 2. Kiểm tra xem đã follow chưa
  const { data: existingFollow } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .single();

  if (existingFollow) {
    // Nếu đã follow rồi thì Unfollow (Xóa dòng đó)
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("id", existingFollow.id);

    if (error) return { success: false, error: error.message };
  } else {
    // Nếu chưa follow thì tiến hành Follow (Thêm dòng mới)
    const { error } = await supabase
      .from("follows")
      .insert([
        { 
          follower_id: followerId, 
          following_id: followingId 
        }
      ]);

    if (error) return { success: false, error: error.message };
  }

  // Làm mới dữ liệu trang profile
  revalidatePath("/profile/[id]", "page");
  return { success: true, isFollowing: !existingFollow };
}