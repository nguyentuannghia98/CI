import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import ProductsList from "@/components/ProductsList/ProductsList";
import { notFound } from "next/navigation";
import { Product, ProductSpecs } from "@/components/UniversalCard/types/type";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_branches")
    .select("name")
    .eq("id", id)
    .single();

  const name = data?.name;
  return {
    title: name ? `Danh mục ${name}` : "Danh mục",
    description: name
      ? `Khám phá sản phẩm thuộc danh mục ${name} trên NexLoot — mua bán và giao thương trong cộng đồng.`
      : "Khám phá sản phẩm theo danh mục trên NexLoot.",
    alternates: { canonical: `/category/${id}` },
  };
}

// 1. Định nghĩa chuẩn Database Response
interface RawProductRow {
  id: string;
  title: string | null;
  description: string | null;
  price: number | string | null;
  quantity: number | null;
  images: string | null;
  tags: string[] | string | null;
  specs: ProductSpecs | null;
  condition: string | null;
  views: number | null;
  created_at: string | null;
  user_id: string | null;
  author: {
    username: string | null;
    avatar_url: string | null;
  } | null;
  upvotes: { count: number }[] | null;
  comments: { count: number }[] | null;
}

interface BranchInfo {
  id: string;
  name: string;
  slug: string;
}

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: branchId } = await params;
  const supabase = await createClient();

  // 2. Lấy thông tin Branch
  const { data: branchInfo, error: branchError } = await supabase
    .from('community_branches')
    .select('id, name, slug') 
    .eq('id', branchId)
    .single<BranchInfo>();

  if (branchError || !branchInfo) return notFound();

  // 3. Lấy danh sách sản phẩm
  const { data: rawData, error: productsError } = await supabase
    .from('products')
    .select(`
        *,
        author:users!user_id(username, avatar_url), 
        upvotes:product_likes(count),
        comments(count),
        communities!inner(branch_id)
      `)
    .eq('communities.branch_id', branchId)
    .order('created_at', { ascending: false })
    .returns<RawProductRow[]>();

  if (productsError) console.error("Database Error:", productsError.message);

  // 4. Mapping dữ liệu sang Interface Product của UI
  const products: Product[] = (rawData || []).map((raw) => {
    const getCount = (field: { count: number }[] | null): number => field?.[0]?.count ?? 0;
    const priceValue = Number(raw.price || 0);

    return {
      id: raw.id,
      title: raw.title || "Sản phẩm không tên",
      description: raw.description,
      price: priceValue,
      quantity: raw.quantity || 0,
      images: typeof raw.images === "string" ? [raw.images] : (raw.images ?? null),
      tags: Array.isArray(raw.tags) ? raw.tags : typeof raw.tags === 'string' ? [raw.tags] : [],
      specs: raw.specs,
      condition: raw.condition || "new",
      views: raw.views || 0,
      
      // SỬA LỖI: Đảm bảo không bao giờ trả về null cho các trường string bắt buộc
      created_at: raw.created_at || new Date().toISOString(), 
      user_id: raw.user_id || "", 
      image_url: raw.images || "", 
      community_id: branchId,
      
      // Counter
      upvotes: getCount(raw.upvotes),
      comments_count: getCount(raw.comments),
      comments: [], 

      // Join Data
      author: raw.author?.username || "Thành viên", 
      avatar_url: raw.author?.avatar_url || null,
      communityName: branchInfo.name, 
      communityIcon: null,

      // Formatters
      displayPrice: priceValue > 0 
        ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(priceValue)
        : "Liên hệ",
      is_out_of_stock: (raw.quantity || 0) <= 0,
    };
  });

  return (
    <main className="max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight capitalize">
          {branchInfo.name}
        </h1>
        <p className="text-gray-500 mt-3 text-lg">
          Khám phá <span className="text-black font-semibold">{products.length}</span> sản phẩm trong danh mục này.
        </p>
      </div>

      <hr className="mb-10 border-gray-100" />

      {/* Grid */}
      {products.length === 0 ? (
        <div className="p-20 text-center border-2 border-dashed border-gray-200 rounded-3xl">
          <p className="text-gray-500 italic font-medium">Chưa có sản phẩm nào.</p>
        </div>
      ) : (
        <ProductsList products={products} showFilter={true} isLoading={false} />
      )}
    </main>
  );
}