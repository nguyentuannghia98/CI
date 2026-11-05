"use server";

import { createClient } from "@/lib/supabase/server"; // Hoặc đường dẫn tạo supabase client của bạn
import { revalidatePath } from "next/cache";

/**
 * Hàm xóa mềm bài viết (Soft Delete)
 * @param productId ID của bài viết cần xóa
 */
export async function deleteProductAction(productId: string) {
  const supabase = await createClient();

  try {
    // 1. Kiểm tra người dùng đã đăng nhập chưa
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Bạn cần đăng nhập để thực hiện hành động này." };
    }

    // 2. Thực hiện Update cột deleted_at thay vì dùng lệnh .delete()
    // Lưu ý: RLS trong Supabase nên được cấu hình để chỉ chủ sở hữu mới được update
    const { error } = await supabase
      .from("products")
      .update({ 
        deleted_at: new Date().toISOString() 
      })
      .eq("id", productId)
      .eq("user_id", user.id); // Bảo mật thêm 1 lớp: chỉ xóa nếu đúng chủ sở hữu

    if (error) {
      console.error("Lỗi khi xóa bài viết:", error.message);
      return { success: false, error: "Không thể xóa bài viết. Vui lòng thử lại." };
    }

    // 3. Làm mới cache của Next.js để UI cập nhật ngay lập tức
    revalidatePath("/"); 
    revalidatePath("/profile");
    revalidatePath(`/communities/${productId}`); // Nếu có trang cộng đồng

    return { success: true };
  } catch {
    return { success: false, error: "Đã xảy ra lỗi hệ thống." };
  }
}