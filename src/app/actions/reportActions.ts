"use server";

// Dùng chung cái utils mà bạn đã có sẵn
import { createClient } from "@/lib/supabase/server"; // Đường dẫn tùy theo project của bạn

export async function submitReportAction(formData: {
  productId: string;
  reason: string;
  details: string;
  communityId?: string | null;
}) {
  // Dùng await createClient() giống hệt bên reportComment
  const supabase = await createClient();

  // 1. Kiểm tra user (Dùng getUser() sẽ bảo mật hơn getSession())
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { success: false, error: "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại." };
  }

  try {
    // 2. Insert vào database
    // Chỉnh sửa: Bỏ dấu [] để insert 1 object đơn lẻ và xử lý ép kiểu cho community_id
    const { error } = await supabase
      .from('reports')
      .insert({
          product_id: formData.productId,
          reporter_id: user.id, // Dùng user.id lấy từ getUser()
          community_id: formData.communityId as string, // Ép kiểu string để khớp với Overload của TS
          reason: formData.reason,
          details: formData.details || "",
          status: 'pending'
      });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Report Action Error:", message);
    return { 
      success: false, 
      error: message.includes("row-level security") 
        ? "Lỗi hệ thống (RLS). Vui lòng liên hệ admin." 
        : "Không thể gửi báo cáo lúc này." 
    };
  }
}