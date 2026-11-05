import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Danh sách route tĩnh công khai (ưu tiên cao).
const STATIC_ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "/", priority: 1, changeFrequency: "hourly" },
  { path: "/giao-thuong", priority: 0.9, changeFrequency: "hourly" },
  { path: "/discovery", priority: 0.8, changeFrequency: "daily" },
  { path: "/auction", priority: 0.6, changeFrequency: "daily" },
  { path: "/arena", priority: 0.6, changeFrequency: "daily" },
  { path: "/about", priority: 0.4, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.3, changeFrequency: "monthly" },
  { path: "/policies", priority: 0.3, changeFrequency: "yearly" },
  { path: "/careers", priority: 0.3, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${siteUrl}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Route động (cộng đồng, danh mục) — nếu DB không sẵn sàng thì bỏ qua, không làm hỏng sitemap.
  const dynamicEntries: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createClient();

    const [{ data: communities }, { data: branches }] = await Promise.all([
      supabase.from("communities").select("id, created_at").limit(1000),
      supabase.from("community_branches").select("id, slug").limit(1000),
    ]);

    for (const c of communities ?? []) {
      if (!c?.id) continue;
      dynamicEntries.push({
        url: `${siteUrl}/communities/${c.id}`,
        lastModified: c.created_at ? new Date(c.created_at) : now,
        changeFrequency: "daily",
        priority: 0.7,
      });
    }

    for (const b of branches ?? []) {
      if (!b?.id) continue;
      dynamicEntries.push({
        url: `${siteUrl}/category/${b.id}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  } catch {
    // Bỏ qua lỗi khi build không có mạng/DB.
  }

  return [...staticEntries, ...dynamicEntries];
}
