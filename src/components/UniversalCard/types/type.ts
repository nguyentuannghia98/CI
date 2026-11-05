/**
 * Định nghĩa thông số kỹ thuật sản phẩm (Specs)
 * Tùy biến theo từng loại mặt hàng (ví dụ: CS2 Skins, Đồ điện tử, Handmade)
 */
export interface ProductSpec {
  label: string;
  value: string;
  icon?: string; // Tên icon từ lucide để hiển thị dynamic
}

/** Danh sách specs (giữ tên cũ để tương thích mapper/category page) */
export type ProductSpecs = ProductSpec[];

/**
 * Cấu trúc Comment đi kèm sản phẩm
 */
export interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
    role?: string; 
  };
}

/**
 * ĐỊNH NGHĨA PRODUCT - CHUẨN THEO SCHEMA DATABASE & MAPPER
 */
export interface Product {
  // 1. Khớp chính xác với Database (Supabase / Postgres)
  id: string;                    
  title: string;                 
  description: string | null;    
  image_url: string;             // Thumbnail chính
  images: string[] | null;       // Đã parse từ JSONB
  user_id: string;               
  created_at: string;            
  community_id: string | null;   
  views: number;                 
  status?: string; // Trạng thái (draft/published/...) — optional vì mapper không luôn set
  
  // 2. Các trường bổ sung từ Mapper / Logic kinh doanh
  specs?: ProductSpec[] | null;         // Thông số kỹ thuật chi tiết
  upvotes: number;
  comments_count: number;
  tags: string[];                

  // Thông tin liên kết (Join từ profiles & communities)
  author: string;                // profile.username
  avatar_url: string | null;     // profile.avatar_url
  communityName: string | null;  
  communityIcon: string | null;  
  
  // Trạng thái kho hàng & Thương mại
  price?: number;                // Nên có giá nếu là e-commerce
  currency?: string;             
  quantity: number;
  is_out_of_stock: boolean;      // Đồng bộ snake_case từ DB
}

/**
 * PROPS CHO UNIVERSAL CARD
 */
export interface UniversalCardProps {
  product: Product;
  viewMode?: "grid" | "list";
  
  // Kiểm tra quyền & ngữ cảnh hiển thị
  isProfile?: boolean; 
  
  // Các hàm xử lý sự kiện (Optional vì có thể dùng Store trực tiếp)
  onDelete?: (id: string) => void;
  onEdit?: (product: Product) => void;
  onTagClick?: (tag: string | null) => void;
}