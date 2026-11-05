"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { SupabaseClient } from "@supabase/supabase-js"; // Import type này

/**
 * Helper để xử lý lỗi TypeScript một cách an toàn
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Helper kiểm tra xem User hiện tại có quyền quản trị cộng đồng không.
 * Owner và mod đều có quyền (thống nhất mô hình phân quyền).
 */
async function checkIsCommunityAdmin(supabase: SupabaseClient, communityId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: member } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .maybeSingle();

  const role = (member as { role?: string | null } | null)?.role;
  return role === "mod" || role === "owner" || role === "admin";
}

/**
 * 1. CẬP NHẬT BANNER
 */
export async function updateCommunityBanner(communityId: string, formData: FormData) {
  const supabase = await createClient();
  const isMod = await checkIsCommunityAdmin(supabase, communityId);
  if (!isMod) return { success: false, error: "Bạn không có quyền quản trị cộng đồng này." };

  const file = formData.get("banner") as File;
  if (!file || !communityId) return { success: false, error: "Dữ liệu không hợp lệ." };

  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${communityId}-${Date.now()}.${fileExt}`;
    const filePath = `banners/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("community-banners")
      .upload(filePath, file, { cacheControl: "3600", upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from("community-banners").getPublicUrl(filePath);

    const { error: dbError } = await supabase
      .from("communities")
      .update({ banner_url: publicUrl })
      .eq("id", communityId);

    if (dbError) throw dbError;

    revalidatePath(`/communities/${communityId}`);
    return { success: true, url: publicUrl };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * 2. CẬP NHẬT AVATAR
 */
export async function updateCommunityAvatar(communityId: string, formData: FormData) {
  const supabase = await createClient();
  const isMod = await checkIsCommunityAdmin(supabase, communityId);
  if (!isMod) return { success: false, error: "Bạn không có quyền quản trị cộng đồng này." };

  const file = formData.get("avatar") as File;
  if (!file) return { success: false, error: "Thiếu file ảnh." };

  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `avatar-${Date.now()}.${fileExt}`;
    const filePath = `communities/${communityId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("community-avatar-url")
      .upload(filePath, file, { cacheControl: "3600", upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from("community-avatar-url").getPublicUrl(filePath);

    const { error: dbError } = await supabase
      .from("communities")
      .update({ avatar_url: publicUrl })
      .eq("id", communityId);

    if (dbError) throw dbError;

    revalidatePath(`/communities/${communityId}`);
    return { success: true, url: publicUrl };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * 4. TẠO TAG LẺ (Server Action)
 */
export async function createCommunityTag(communityId: string, name: string) {
  const supabase = await createClient();

  // 1. Kiểm tra quyền Mod (dùng helper có sẵn của bạn)
  const isMod = await checkIsCommunityAdmin(supabase, communityId);
  if (!isMod) {
    return { success: false, error: "Chỉ quản trị viên cộng đồng mới có quyền tạo Tag." };
  }

  // 2. Lấy User ID từ Session
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Vui lòng đăng nhập để tiếp tục." };

  try {
    const { error } = await supabase.from("community_tags").insert({
      name: name.trim(),
      community_id: communityId,
      created_by: user.id,
    });

    if (error) throw error;

    // Làm mới dữ liệu tại trang cộng đồng
    revalidatePath(`/communities/${communityId}`);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}