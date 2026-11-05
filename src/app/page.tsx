import type { Metadata } from "next";
import { redirect } from "next/navigation";
import HomePageClient from "@/app/home/HomePageClient";

export const metadata: Metadata = {
  title: "NexLoot — Đấu trường săn deal 0đ & Sàn giao dịch Gaming",
  description:
    "Khám phá NexLoot: Sàn giao dịch thiết bị và vật phẩm gaming nguyên bản, tham gia các phiên đấu giá kịch tính và săn deal 0đ độc quyền.",
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Nếu Supabase fallback về Site URL kèm ?code=? của luồng OAuth/PKCE,
  // chuyển ngay sang /auth/callback để đổi code lấy session, giữ nguyên query.
  const params = await searchParams;
  if (params?.code) {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) value.forEach((v) => qs.append(key, v));
      else if (value !== undefined) qs.append(key, value);
    }
    redirect(`/auth/callback?${qs.toString()}`);
  }

  return (
    <main className="min-h-screen">
      <HomePageClient />
    </main>
  );
}