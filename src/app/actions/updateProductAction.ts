"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server"; // Đường dẫn tùy theo project của bạn
import { z } from "zod";

// 1. Định nghĩa Schema bằng Zod để validate dữ liệu đầu vào
const UpdateProductSchema = z.object({
  id: z.string().uuid({ message: "ID không hợp lệ" }),
  title: z
    .string()
    .min(3, { message: "Tiêu đề phải có ít nhất 3 ký tự" })
    .max(100, { message: "Tiêu đề quá dài" }),
  description: z
    .string()
    .max(500, { message: "Mô tả không được vượt quá 500 ký tự" })
    .optional(),
});

export async function updateProductAction(id: string, rawData: {
  title: string;
  description?: string;
}) {
  try {
    const supabase = await createClient();

    // 2. Kiểm tra phiên đăng nhập (Authentication)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return { success: false, error: "Bạn cần đăng nhập để thực hiện thao tác này" };
    }

    // 3. Validate dữ liệu với Zod
    const validatedFields = UpdateProductSchema.safeParse({
      id,
      ...rawData,
    });

    if (!validatedFields.success) {
      // Trả về lỗi validate đầu tiên cho Client
      return { 
        success: false, 
        error: validatedFields.error.flatten().fieldErrors 
      };
    }

    const { title, description } = validatedFields.data;

    // 4. Thực hiện Update vào Supabase
    const { error: dbError } = await supabase
      .from("products")
      .update({
        title: title.trim(),
        description: description?.trim(),
        // updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (dbError) {
      console.error("Supabase Update Error:", dbError);
      return { success: false, error: "Không thể cập nhật sản phẩm vào DB" };
    }

    // 5. Làm mới cache
    revalidatePath("/");
    revalidatePath(`/product/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Critical Error:", error);
    return { success: false, error: "Lỗi kết nối server" };
  }
}