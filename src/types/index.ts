export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

export interface Product {
  id: string;
  user_id: string;
  title: string;
  category: string | null;
  is_private: boolean | null;
  condition: string | null;
  description: string | null;
  specs: Record<string, Json> | null; // ✅ fixed
  images: string[] | null;
  image_url: string | null;
  video_url: string | null;
  price: number | null;
  enable_offers: boolean | null;
  min_offer: number | null;
  quantity: number | null;
  sku: string | null;
  return_policy: string | null;
  created_at: string | null;
  community_id: string | null;
  upvotes: number | null;
  views: number | null;
  cpu?: string | null;
  gpu?: string | null;
}