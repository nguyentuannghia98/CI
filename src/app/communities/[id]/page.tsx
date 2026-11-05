import { Suspense } from "react";
import type { Metadata } from "next";
import CommunityDetailView from "@/components/communities/CommunityDetailView";
import LoadingState from "@/components/communities/Components/LoadingState";
import { getProductsByCommunityAction } from "@/app/actions/Product-actions"; 
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("communities")
    .select("title, description, avatar_url")
    .eq("id", id)
    .single();

  if (!data) {
    return { title: "Cộng đồng không tồn tại", robots: { index: false, follow: true } };
  }

  const title = data.title || "Cộng đồng";
  const description =
    data.description?.slice(0, 160) || `Tham gia cộng đồng ${title} trên NexLoot để mua bán và giao thương.`;

  return {
    title,
    description,
    alternates: { canonical: `/communities/${id}` },
    openGraph: {
      type: "website",
      title,
      description,
      images: data.avatar_url ? [{ url: data.avatar_url, alt: title }] : undefined,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // 1. Khởi tạo Supabase bản Server
  const supabase = await createClient();

  // 2. Fetch song song
  const [communityRes, products] = await Promise.all([
    supabase.from("communities").select("*").eq("id", id).single(),
    getProductsByCommunityAction(id), 
  ]);

  // 3. Nếu không tìm thấy cộng đồng thì bắn ra trang 404 ngay
  if (communityRes.error || !communityRes.data) {
    notFound(); 
  }

  return (
    <main className="min-h-screen transition-colors duration-300">
      <Suspense fallback={<LoadingState />}>
        <CommunityDetailView 
          communityId={id} 
          initialCommunity={communityRes.data}
          initialProducts={products} 
        />
      </Suspense>
    </main>
  );
}
