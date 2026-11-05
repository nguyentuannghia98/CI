"use server";

import { createClient } from "@/lib/supabase/server"; // Đường dẫn tùy theo project của bạn

export async function reportComment(commentId: string, reason: string) {
  const supabase = await createClient();

  // 1. Lấy user hiện tại đang đăng nhập
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Bạn cần đăng nhập để thực hiện tính năng này");
  }

  // 2. Kiểm tra xem comment này có phải của chính họ không
  const { data: comment, error: commentError } = await supabase
    .from("comments")
    .select("user_id, product_id")
    .eq("id", commentId)
    .single();

  if (commentError || !comment) {
    throw new Error("Bình luận không tồn tại");
  }

  if (String(comment.user_id) === String(user.id)) {
    throw new Error("Bạn không thể tự tố cáo chính mình :>");
  }

  // Suy ra cộng đồng từ sản phẩm của bình luận — nếu thiếu, mod sẽ không thấy
  // báo cáo này trong danh sách kiểm duyệt (đã lọc theo community_id).
  let communityId: string | null = null;
  if (comment.product_id) {
    const { data: product } = await supabase
      .from("products")
      .select("community_id")
      .eq("id", comment.product_id)
      .maybeSingle();
    communityId = product?.community_id ?? null;
  }

  // 3. comment_reports yêu cầu reason_id (FK bắt buộc) -> lấy 1 lý do đang hoạt động.
  //    Nội dung tự do người dùng nhập được lưu ở cột details.
  const { data: reasonRow, error: reasonError } = await supabase
    .from("report_reasons")
    .select("id")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (reasonError) console.error("report_reasons error:", reasonError.message);

  if (!reasonRow?.id) {
    throw new Error("Hệ thống chưa cấu hình lý do báo cáo");
  }

  const { error } = await supabase.from("comment_reports").insert({
    comment_id: commentId,
    reporter_id: user.id,
    reason_id: reasonRow.id,
    details: reason,
    community_id: communityId,
  });

  if (error) {
    console.error("Report Error:", error.message);
    throw new Error("Gửi tố cáo thất bại, vui lòng thử lại sau");
  }

  return { success: true };
}
