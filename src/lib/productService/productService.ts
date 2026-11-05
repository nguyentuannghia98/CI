// services/productService.ts
import { createClient } from "@/lib/supabase/client"; // File này dùng client component
import { mapToProductList, RawProductData } from "@/lib/mapper/productMapper";

export const PRODUCT_QUERY = `
  *,
  users:user_id (id, username, avatar_url),
  communities:community_id (id, title, avatar_url),
  product_tags (tags:tag_id (name)),
  product_likes (count),
  comments (
    id, content, created_at,
    user:user_id (username, avatar_url)
  )
`;

export const fetchProducts = async (communityId?: string) => {
  const supabase = createClient();
  let query = supabase
    .from("products")
    .select(PRODUCT_QUERY)
    .order("created_at", { ascending: false });

  if (communityId) {
    query = query.eq("community_id", communityId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const result = mapToProductList(data as unknown as RawProductData[]);
  return result.products;
};