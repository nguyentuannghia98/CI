"use server";

import { createClient } from "@/lib/supabase/server"; // Đường dẫn tùy theo project của bạn
import { mapToProductList, RawProductData } from "@/lib/mapper/productMapper";
import type { Product } from "@/components/UniversalCard/types/type";

/**
 * Định nghĩa cấu trúc query dùng chung cho tất cả các action liên quan đến Product
 * Đảm bảo lấy đầy đủ thông tin User, Community, Tags, Likes, và Comments
 */
// Trong file product-actions.ts
const PRODUCT_QUERY = `
  *,
  users:user_id (id, username, avatar_url),
  communities:community_id (id, title, avatar_url),
  product_tags (tags:tag_id (name)),
  product_likes (count),
  comments (
    id,
    content,
    created_at,
    user:user_id (
      id,
      username,
      avatar_url
    )
  )
`;
// --- 1. ACTION LẤY TẤT CẢ SẢN PHẨM (Feed chung) ---
export async function getProductsAction(): Promise<Product[]> {
  const supabase = await createClient();
  
  console.log("--- [START] GET ALL PRODUCTS ---");

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_QUERY)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("❌ LỖI FETCH ALL PRODUCTS:", error?.message);
    return [];
  }

  const result = mapToProductList(data as unknown as RawProductData[]);
  console.log("✅ SUCCESS: Đã load", result.products.length, "sản phẩm chung");
  return result.products; 
}

// --- 2. ACTION RIÊNG LẤY SẢN PHẨM THEO COMMUNITY ID ---
export async function getProductsByCommunityAction(communityId: string): Promise<Product[]> {
  const supabase = await createClient();
  
  console.log(`--- [START] GET PRODUCTS FOR COMMUNITY: ${communityId} ---`);

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_QUERY)
    .eq("community_id", communityId) // Filter chính xác theo ID cộng đồng
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error(`❌ LỖI FETCH PRODUCTS CHO COMMUNITY ${communityId}:`, error?.message);
    return [];
  }

  const result = mapToProductList(data as unknown as RawProductData[]);
  console.log(`✅ SUCCESS: Đã load ${result.products.length} sản phẩm cho Community ${communityId}`);
  
  return result.products;
}