"use server";

import { requireUser } from "@/lib/auth/guards";
import { revalidatePath } from "next/cache";

/**
 * Bước 1: Tạo bản ghi nháp để lấy UUID.
 * user_id lấy từ session; bắt buộc là thành viên cộng đồng.
 */
export async function reserveProductIdAction(communityId: string) {
  const { supabase, user } = await requireUser();

  const { data: membership } = await supabase
    .from("community_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("community_id", communityId)
    .maybeSingle();

  if (!membership) {
    throw new Error("Bạn không có quyền đăng bài trong cộng đồng này.");
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      title: "",
      user_id: user.id,
      community_id: communityId,
      status: "draft",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id;
}

/**
 * Bước 2: Cập nhật nội dung cuối cùng.
 * Chỉ cập nhật được sản phẩm do chính user sở hữu.
 */
export async function finalizeProductAction({
  productId,
  title,
  description,
  tagId,
  communityId,
}: {
  productId: string;
  title: string;
  description: string;
  tagId: string | null;
  communityId: string;
}) {
  const { supabase, user } = await requireUser();

  const { error: productError } = await supabase
    .from("products")
    .update({
      title: title,
      description: description,
      status: "published",
    })
    .eq("id", productId)
    .eq("user_id", user.id);

  if (productError) throw new Error(productError.message);

  if (tagId) {
    const { error: tagError } = await supabase.from("product_tags").insert({
      product_id: productId,
      tag_id: tagId,
    });
    if (tagError) console.error("Lỗi gắn tag:", tagError.message);
  }

  revalidatePath(`/communities/${communityId}`);
  return { success: true };
}
