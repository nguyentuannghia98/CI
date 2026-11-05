import { Product, ProductSpecs, Comment } from "@/components/UniversalCard/types/type";

/**
 * Định nghĩa kiểu dữ liệu linh hoạt từ Supabase cho Comments và Likes
 */
type CountOrDetailData = 
  | Array<{ id: string; [key: string]: unknown }> 
  | Array<{ count: number }>                  
  | { count: number }                         
  | number 
  | null 
  | undefined;

/**
 * Interface cho dữ liệu thô từ Supabase
 */
export interface RawProductData {
  id: string;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  is_private?: boolean;
  condition?: string | null;
  specs?: ProductSpecs | Record<string, unknown> | null;
  image_url?: string | null;
  images?: string | string[] | null; // Nguồn dữ liệu thô có thể là mảng
  video_url?: string | null;
  price?: string | number | null;
  quantity?: number | null;
  sku?: string | null;
  enable_offers?: boolean;
  min_offer?: number | null;
  return_policy?: string | null;
  user_id?: string | null;
  community_id?: string | null;
  created_at?: string | null;
  is_completed?: boolean;
  upvotes?: number | null;
  views?: number | null;

  users?: { 
    id?: string | null;
    username?: string | null; 
    avatar_url?: string | null 
  } | null;
  
  communities?: { 
    id?: string | null;
    title?: string | null; 
    avatar_url?: string | null 
  } | null;
  
  product_tags?: Array<{
    tags?: { name: string } | null;
    community_tags?: { name: string } | null;
  }> | null;

  comments?: CountOrDetailData;
  product_likes?: CountOrDetailData;
  
  [key: string]: unknown;
}

interface ValidatedComment {
  id: string;
  content: string;
  created_at: string;
  user_id?: string;
  user?: { id: string; username: string | null; avatar_url: string | null };
  users?: { id: string; username: string | null; avatar_url: string | null };
}

export const mapToProduct = (raw: RawProductData): Product => {
  
  const getCount = (field: CountOrDetailData): number => {
    if (typeof field === 'number') return field;
    if (Array.isArray(field)) {
      if (field.length === 0) return 0;
      const firstItem = field[0];
      if (firstItem && typeof firstItem === 'object' && 'count' in firstItem) {
        return (firstItem as { count: number }).count;
      }
      return field.length;
    }
    if (field && typeof field === 'object' && 'count' in field) {
      return (field as { count: number }).count;
    }
    return 0;
  };

  // --- XỬ LÝ HÌNH ẢNH (FIX LỖI MẢNG VS CHUỖI) ---
  let finalImageUrl: string = "/placeholder.png";
  let imagesData: string | null = null;

  if (raw.image_url) {
    finalImageUrl = raw.image_url;
  }

  if (raw.images) {
    try {
      const parsed = typeof raw.images === "string" ? JSON.parse(raw.images) : raw.images;
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Nếu là mảng, lấy phần tử đầu làm ảnh đại diện, và lưu mảng dưới dạng chuỗi JSON cho 'images'
        if (!raw.image_url) finalImageUrl = parsed[0];
        imagesData = JSON.stringify(parsed); 
      } else if (typeof parsed === "string") {
        if (!raw.image_url) finalImageUrl = parsed;
        imagesData = parsed;
      }
    } catch {
      imagesData = typeof raw.images === "string" ? raw.images : null;
    }
  }

  const priceValue = typeof raw.price === "number" ? raw.price : parseFloat(String(raw.price || "0"));
  const cleanPrice = isNaN(priceValue) ? 0 : priceValue;

  const rawComments = raw.comments;
  const mappedComments: Comment[] = (Array.isArray(rawComments) && rawComments.length > 0)
    ? (rawComments as unknown as ValidatedComment[]).map((c) => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        user_id: c.user?.id || c.users?.id || c.user_id || "",
        user: {
          id: c.user?.id || c.users?.id || c.user_id || "", 
          username: c.user?.username || c.users?.username || "Thành viên",
          avatar_url: c.user?.avatar_url || c.users?.avatar_url || null
        }
      }))
    : [];

  return {
    id: raw.id,
    title: raw.title || "Không có tiêu đề",
    description: raw.description ?? null,
    category: raw.category ?? null,
    is_private: Boolean(raw.is_private),
    condition: raw.condition ?? "Mới",
    specs: (raw.specs as ProductSpecs) || null,
    image_url: finalImageUrl,
    images: imagesData, // Đảm bảo gán kiểu string | null vào đây
    video_url: raw.video_url ?? null,
    price: cleanPrice,
    quantity: Number(raw.quantity || 0),
    sku: raw.sku ?? null,
    enable_offers: Boolean(raw.enable_offers),
    min_offer: raw.min_offer ? Number(raw.min_offer) : null,
    return_policy: raw.return_policy ?? null,
    user_id: raw.user_id ?? null,
    community_id: raw.community_id ?? null,
    created_at: raw.created_at ?? null,
    is_completed: Boolean(raw.is_completed),

    upvotes: getCount(raw.product_likes),
    views: Number(raw.views || 0),
    comments_count: getCount(raw.comments), 
    comments: mappedComments, 

    tags: raw.product_tags
      ?.map((pt) => pt.tags?.name || pt.community_tags?.name)
      .filter((name): name is string => !!name) || [],
    
    author: raw.users?.username ?? "Thành viên",
    avatar_url: raw.users?.avatar_url ?? null,
    
    communityName: raw.communities?.title ?? null,
    communityIcon: raw.communities?.avatar_url ?? null,

    displayPrice: cleanPrice > 0 
      ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(cleanPrice)
      : "Liên hệ",
    is_out_of_stock: Number(raw.quantity || 0) <= 0,
  } as Product;
};

export const mapToProductList = (rawItems: RawProductData[] | null | undefined) => {
  if (!rawItems || !Array.isArray(rawItems)) return { products: [], allAvailableTags: [] };
  const products = rawItems.map(mapToProduct);
  const tagsSet = new Set<string>();
  products.forEach(p => {
    p.tags.forEach(t => tagsSet.add(t));
  });
  return { products, allAvailableTags: Array.from(tagsSet).sort() };
};