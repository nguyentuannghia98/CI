"use server";

import { requireUser } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Tham gia / rời cộng đồng.
 * user_id lấy từ session, KHÔNG nhận từ client.
 * Dùng RPC atomic (join_community_tx / leave_community_tx).
 */
export async function toggleCommunityMembership(communityId: string, isMember: boolean) {
  const { supabase, user } = await requireUser();

  if (isMember) {
    const { error } = await supabase.rpc("leave_community_tx", {
      p_community_id: communityId,
      p_user_id: user.id,
    });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.rpc("join_community_tx", {
      p_community_id: communityId,
      p_user_id: user.id,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/communities/${communityId}`);
  return { success: true };
}

/**
 * Xóa cộng đồng. Chỉ owner/admin mới được phép.
 */
export async function deleteCommunityAction(communityId: string) {
  const { supabase, user } = await requireUser();

  const { data: member } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .maybeSingle();

  const role = (member as { role?: string | null } | null)?.role ?? null;
  if (role !== "owner" && role !== "admin") {
    throw new Error("Bạn không có quyền xóa cộng đồng này.");
  }

  // Dùng admin client để dọn các bản ghi con (products/tags/reports...) một cách
  // nhất quán — RLS không cho phép owner sửa bài của thành viên khác.
  // Đã kiểm tra quyền owner/admin ở trên nên bước này an toàn.
  const admin = await createAdminClient();
  const nowIso = new Date().toISOString();

  // 1. Gỡ bài viết khỏi cộng đồng + đánh dấu xoá mềm (tránh chặn FK fk_community).
  const { error: productError } = await admin
    .from("products")
    .update({ community_id: null, deleted_at: nowIso, deleted_by: user.id })
    .eq("community_id", communityId);
  if (productError) throw new Error(`Không dọn được bài viết: ${productError.message}`);

  // 2. Xoá thành viên + tag của cộng đồng.
  const { error: memberError } = await admin
    .from("community_members")
    .delete()
    .eq("community_id", communityId);
  if (memberError) throw new Error(`Không xoá được thành viên: ${memberError.message}`);

  const { error: tagError } = await admin
    .from("community_tags")
    .delete()
    .eq("community_id", communityId);
  if (tagError) throw new Error(`Không xoá được tag: ${tagError.message}`);

  // 3. Xoá báo cáo gắn với cộng đồng (tránh chặn FK và dọn lịch sử kiểm duyệt).
  await admin.from("reports").delete().eq("community_id", communityId);
  await admin.from("comment_reports").delete().eq("community_id", communityId);

  // 4. Xoá cộng đồng.
  const { error } = await admin.from("communities").delete().eq("id", communityId);
  if (error) throw new Error(error.message);

  revalidatePath("/communities");
  revalidatePath("/discovery");
  return { success: true };
}
