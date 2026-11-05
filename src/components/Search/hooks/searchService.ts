// src/lib/Search/searchService.ts
import { createClient } from "@/lib/supabase/client";
import type { SuggestionItem } from "@/components/Search/types/search";

/* =========================================================
    Raw DB row types
========================================================= */

type ProductSearchRow = { 
  id: string; 
  title: string; 
  images: string[] | string | null; 
};

type UserSearchRow = { 
  id: string; 
  username: string | null; 
  avatar_url: string | null 
};

type CommunitySearchRow = { 
  id: string; 
  title: string | null; 
  banner_url: string | null 
};

type SearchHistoryRow = { 
  query: string | null 
};

// Định nghĩa interface cho tag để thay thế any
interface CommunityTagRow {
  name: string;
}

/* =========================================================
    Fetchers
========================================================= */

export async function fetchProductsByTitle(q: string, limit = 5): Promise<ProductSearchRow[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("products")
      .select("id, title, images")
      .ilike("title", `%${q}%`)
      .limit(limit);

    if (error) throw error;
    // Sử dụng unknown trước khi ép kiểu để an toàn hơn
    return (data as unknown as ProductSearchRow[]) ?? [];
  } catch (err) {
    console.error("fetchProductsByTitle Error:", err instanceof Error ? err.message : err);
    return [];
  }
}

export async function fetchUsersByName(q: string, limit = 5): Promise<UserSearchRow[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, username, avatar_url")
      .ilike("username", `%${q}%`)
      .limit(limit);

    if (error) throw error;
    return (data as unknown as UserSearchRow[]) ?? [];
  } catch (err) {
    console.error("fetchUsersByName Error:", err instanceof Error ? err.message : err);
    return [];
  }
}

// FIX: Loại bỏ 'as any' và dùng CommunityTagRow
export async function fetchTags(q: string, limit = 10): Promise<string[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("community_tags") 
      .select("name")
      .ilike("name", `%${q}%`)
      .limit(limit);

    if (error) throw error;
    if (!data) return [];

    // Cast data về CommunityTagRow[]
    return (data as unknown as CommunityTagRow[]).map(t => t.name);
  } catch (err) {
    console.error("fetchTags Error:", err instanceof Error ? err.message : err);
    return [];
  }
}

export async function fetchCommunities(q: string, limit = 5): Promise<CommunitySearchRow[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("communities")
      .select("id, title, banner_url")
      .ilike("title", `%${q}%`)
      .limit(limit);

    if (error) throw error;
    return (data as unknown as CommunitySearchRow[]) ?? [];
  } catch (err) {
    console.error("fetchCommunities Error:", err instanceof Error ? err.message : err);
    return [];
  }
}

/* =========================================================
    Search history
========================================================= */

export async function upsertSearchHistory(userId: string, query: string) {
  if (!userId) return null;

  try {
    const supabase = createClient();
    const { data, error } = await supabase.from("search_history").upsert(
      {
        user_id: userId,
        query: query.trim(),
        searched_at: new Date().toISOString(),
      },
      { onConflict: "user_id,query" }
    ).select();

    if (error) throw error;
    return data;
  } catch (err) {
    // FIX: Dùng Error thay vì any
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("upsertSearchHistory Error:", message);
    return null;
  }
}

export async function loadSearchHistory(userId: string, limit = 5): Promise<{ query: string }[]> {
  if (!userId) return [];

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("search_history")
      .select("query")
      .eq("user_id", userId)
      .order("searched_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    // Ép kiểu qua unknown để khớp với cấu trúc SearchHistoryRow
    return (data as unknown as SearchHistoryRow[]).map((r) => ({ query: r.query || "" }));
  } catch (err) {
    console.error("loadSearchHistory Error:", err instanceof Error ? err.message : err);
    return [];
  }
}

/* =========================================================
    Normalize to SuggestionItem
========================================================= */

// Hàm normalize giữ nguyên vì các tham số đã có type rõ ràng ở trên
export function normalizeSuggestions({
  products,
  users,
  tags,
  communities,
}: {
  products: ProductSearchRow[];
  users: UserSearchRow[];
  tags: string[];
  communities: CommunitySearchRow[];
}): SuggestionItem[] {
  const out: SuggestionItem[] = [];

  // ... (Logic parse ảnh giữ nguyên) ...
  if (products?.length) {
    out.push(...products.map(p => {
      let displayImage: string | undefined = undefined;
      
      if (Array.isArray(p.images)) {
        displayImage = p.images[0];
      } else if (typeof p.images === "string") {
        if (p.images.startsWith('[') || p.images.startsWith('{')) {
          try {
            const parsed = JSON.parse(p.images);
            displayImage = Array.isArray(parsed) ? parsed[0] : parsed;
          } catch {
            displayImage = p.images;
          }
        } else {
          displayImage = p.images;
        }
      }

      return {
        type: "product" as const,
        id: p.id,
        title: p.title,
        image: displayImage || undefined,
        price: undefined,
      };
    }));
  }

  if (users?.length) {
    out.push(...users.map(u => ({
      type: "user" as const,
      id: u.id,
      title: u.username || "Người dùng",
      image: u.avatar_url || undefined,
    })));
  }

  if (tags?.length) {
    out.push(...tags.map(t => ({
      type: "tag" as const,
      id: t,
      title: t,
    })));
  }

  if (communities?.length) {
    out.push(...communities.map(c => ({
      type: "community" as const,
      id: c.id,
      title: c.title || "Cộng đồng",
      image: c.banner_url || undefined,
    })));
  }

  return out;
}