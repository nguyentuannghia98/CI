// Định nghĩa cấu trúc dữ liệu từ Table "users" trong Supabase
export type UserData = {
  id: string;
  username: string | null;
  full_name?: string;

  email: string | null;
  created_at: string | null;

  avatar_url: string | null;
  banner_url: string | null;

  karma: number | null;
  is_online: boolean | null;
  address: string | null;
  identity: number | null;
  phone: number | null;
  birth: string | null;
  updated_at?: string | null;

  // --- THÊM MỚI ---
  bio: string | null;
  selling_policy: string | null;
};

// Định nghĩa cấu trúc cho Form chỉnh sửa (string để dễ quản lý input)
export type ProfileFormData = {
  username: string;
  avatar_url: string;
  address: string;
  phone: string;
  birth: string;

  // --- THÊM MỚI ---
  bio: string;
  selling_policy: string;
};