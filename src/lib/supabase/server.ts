import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase";

/**
 * Client dành cho các tác vụ thông thường (tuân thủ RLS)
 * Dùng trong Server Components, Server Actions, API Routes
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component có thể ném lỗi nếu set cookie ở đây.
            // Điều này là bình thường trong Next.js App Router.
          }
        },
      },
    }
  );
}

/**
 * Client dành cho tác vụ Admin (Bypass RLS)
 * CHỈ DÙNG TRÊN SERVER - KHÔNG ĐƯỢC LỘ SERVICE_ROLE_KEY
 */
export async function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        // Admin thường không cần đọc/ghi cookie của user
        getAll() { return []; },
        setAll() {},
      },
    }
  );
}

// Giữ cái này nếu bạn lỡ dùng tên "getServerClient" ở đâu đó, nếu không thì xóa cho sạch.
export const getServerClient = createClient;