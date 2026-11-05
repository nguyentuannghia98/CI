"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createComment(productId: string, content: string) {
  // 1. Khởi tạo trực tiếp Server Client bốc toàn bộ Cookie mới nhất từ trình duyệt
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Có thể bỏ qua nếu được gọi từ Server Component tĩnh
          }
        },
      },
    }
  );

  // 2. Kiểm tra session người dùng thời gian thực
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error("❌ Auth Error tại Server Action:", authError?.message);
    return { success: false, error: "Bạn cần đăng nhập để thực hiện chức năng này." };
  }

  const trimmedContent = content.trim();
  if (!trimmedContent) {
    return { success: false, error: "Nội dung bình luận không được để trống." };
  }

  // 3. Insert dữ liệu vào bảng comments
  const { data, error } = await supabase
    .from("comments")
    .insert([
      {
        product_id: productId,
        user_id: user.id,
        content: trimmedContent,
      },
    ])
    .select(`
      id,
      content,
      created_at,
      user:users (
        id,
        username,
        avatar_url
      )
    `)
    .single();

  if (error) {
    console.error("❌ Error adding comment tại Database:", error.message);
    return { success: false, error: "Không thể lưu bình luận vào hệ thống." };
  }

  // Trả về dữ liệu vừa tạo thành công để Client cập nhật UI tức thì
  return { success: true, data };
}