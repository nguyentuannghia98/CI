import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ProductsPageClient from "@/app/products/ProductsPageClient";
import { getProductsAction } from "@/app/actions/Product-actions";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Giao thương — Chợ cộng đồng NexLoot",
  description:
    "Sàn giao thương NexLoot: đăng bán, tìm mua và kết nối trong cộng đồng. Khám phá hàng nghìn sản phẩm đang được chào bán.",
  alternates: { canonical: "/giao-thuong" },
};

export const dynamic = "force-dynamic";

const PageLoading = () => (
  <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
    {/* Skeleton Banner */}
    <div 
      className="w-full rounded-3xl p-8 border"
      style={{
        backgroundColor: "rgb(var(--bg-card))",
        borderColor: "rgba(var(--border-main), 0.3)",
      }}
    >
      <div className="h-6 w-36 rounded-full bg-orange-500/20 mb-4" />
      <div className="h-9 w-72 rounded-2xl bg-orange-500/10 mb-3" />
      <div className="h-4 w-96 max-w-full rounded-lg bg-[rgb(var(--text-muted))]/20" />
    </div>

    {/* Center loader */}
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-orange-500">
      <Loader2 className="w-8 h-8 animate-spin" />
      <p className="text-xs font-bold uppercase tracking-widest text-[rgb(var(--text-muted))]">
        Đang tải chợ giao thương...
      </p>
    </div>
  </div>
);

export default async function GiaoThuongPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  if (params?.code) {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) value.forEach((v) => qs.append(key, v));
      else if (value !== undefined) qs.append(key, value);
    }
    redirect(`/auth/callback?${qs.toString()}`);
  }

  const products = await getProductsAction();

  if (process.env.NODE_ENV === "development") {
    console.log(`[Products] Fetched ${products?.length} items`);
  }

  return (
    <Suspense fallback={<PageLoading />}>
      <main className="min-h-screen pb-16">
        <ProductsPageClient initialProducts={products || []} />
      </main>
    </Suspense>
  );
}
