"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ReportType = "post" | "comment";

interface ResolveInput {
  reportId: string;
  type: ReportType;
  action: "keep" | "delete";
}

interface ResolveResult {
  success: boolean;
  error?: string;
}

/**
 * Xử lý báo cáo vi phạm của cộng đồng.
 *
 * Trước đây client cập nhật bảng reports/comment_reports và xoá products/comments
 * trực tiếp. Vì RLS của products/comments chỉ cho xoá "của chính mình", nút XÓA
 * của mod luôn thất bại âm thầm. Hàm này chạy phía server:
 *   1) xác thực người dùng,
 *   2) xác minh họ là MOD của đúng cộng đồng chứa báo cáo,
 *   3) chỉ khi hợp lệ mới xoá nội dung + đánh dấu báo cáo đã xử lý.
 */
export async function resolveReportAction({ reportId, type, action }: ResolveInput): Promise<ResolveResult> {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại." };
  }

  // 1) Đọc báo cáo (RLS cho phép mod đọc báo cáo thuộc cộng đồng của mình)
  const readResult = type === "post"
    ? await supabase.from("reports").select("*").eq("id", reportId).maybeSingle()
    : await supabase.from("comment_reports").select("*").eq("id", reportId).maybeSingle();

  if (readResult.error || !readResult.data) {
    return { success: false, error: "Không tìm thấy báo cáo hoặc bạn không có quyền truy cập." };
  }

  const record = readResult.data as unknown as Record<string, string | null>;
  const communityId = record.community_id;
  const targetId = type === "post" ? record.product_id : record.comment_id;

  // 2) Xác minh quyền mod của cộng đồng chứa báo cáo
  const { data: member } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId as string)
    .eq("user_id", user.id)
    .eq("role", "mod")
    .maybeSingle();

  if (!member) {
    return { success: false, error: "Bạn không có quyền kiểm duyệt cộng đồng này." };
  }

  // 3) Thực thi bằng admin client (đã xác minh quyền ở trên)
  const admin = await createAdminClient();

  if (action === "delete" && targetId) {
    const deleteError = type === "post"
      ? (await admin.from("products").delete().eq("id", targetId)).error
      : (await admin.from("comments").delete().eq("id", targetId)).error;

    if (deleteError) {
      return { success: false, error: "Không thể xoá nội dung vi phạm: " + deleteError.message };
    }
  }

  const patch = {
    status: "resolved",
    resolved_by: user.id,
    resolved_at: new Date().toISOString(),
  };

  const updateError = type === "post"
    ? (await admin.from("reports").update(patch).eq("id", reportId)).error
    : (await admin.from("comment_reports").update(patch).eq("id", reportId)).error;

  if (updateError) {
    return { success: false, error: "Không thể cập nhật trạng thái báo cáo: " + updateError.message };
  }

  revalidatePath("/");
  return { success: true };
}
