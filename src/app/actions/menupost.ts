"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Đăng bài trong cộng đồng.
 * user_id lấy từ session, KHÔNG nhận từ client.
 */
export async function createProductAction(data: {
  title: string;
  description: string;
  images: string[];
  communityId: string;
  tagId?: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Bạn cần đăng nhập để đăng bài.");

  // 1. BƯỚC KIỂM TRA: user phải là thành viên cộng đồng này
  const { data: membership, error: memberError } = await supabase
    .from("community_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("community_id", data.communityId)
    .maybeSingle();

  if (memberError || !membership) {
    throw new Error("Bạn không có quyền đăng bài trong cộng đồng này.");
  }

  // 2. ĐĂNG BÀI (user_id lấy từ session)
  const { data: newProduct, error } = await supabase
    .from("products")
    .insert({
      title: data.title,
      description: data.description,
      images: data.images,
      user_id: user.id,
      community_id: data.communityId,
      views: 0,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Insert Error:", error);
    throw new Error(error.message);
  }

  // 3. THÊM TAG (nếu có)
  if (data.tagId && newProduct) {
    const { error: tagError } = await supabase.from("product_tags").insert({
      product_id: newProduct.id,
      tag_id: data.tagId,
    });

    if (tagError) {
      console.error("Lỗi khi thêm tag vào product_tags:", tagError.message);
    }
  }

  revalidatePath(`/communities/${data.communityId}`);
  revalidatePath("/");

  return { success: true };
}
