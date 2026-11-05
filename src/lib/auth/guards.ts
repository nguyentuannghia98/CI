import type { User, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
export { isSafeInternalPath } from "@/lib/auth/safe-path";

/**
 * Lỗi xác thực dùng chung cho Server Actions / API Routes.
 * Bắt lỗi này ở tầng route để trả về 401 thay vì 500.
 */
export class AuthError extends Error {
  code = "UNAUTHENTICATED" as const;
  constructor(message = "Bạn cần đăng nhập để thực hiện thao tác này.") {
    super(message);
    this.name = "AuthError";
  }
}

type ServerClient = Awaited<ReturnType<typeof createClient>>;

/** Lấy user đã xác minh từ session (không dùng getSession). */
export async function getSessionUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

/**
 * Bắt buộc có session. Trả về cả supabase client để tránh tạo lại.
 * Ném AuthError nếu chưa đăng nhập.
 */
export async function requireUser(): Promise<{ supabase: ServerClient; user: User }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new AuthError();
  return { supabase, user };
}

const STAFF_ROLES: readonly string[] = ["owner", "admin", "mod"];

/** Lấy role của user trong cộng đồng, hoặc null nếu không phải thành viên. */
export async function getCommunityRole(
  supabase: SupabaseClient,
  communityId: string,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .maybeSingle();
  const role = (data as { role?: string | null } | null)?.role ?? null;
  return role;
}

/** Bắt buộc user là owner/admin/mod của cộng đồng. */
export async function requireCommunityStaff(communityId: string) {
  const { supabase, user } = await requireUser();
  const role = await getCommunityRole(supabase, communityId, user.id);
  if (!role || !STAFF_ROLES.includes(role)) {
    throw new AuthError("Bạn không có quyền quản trị trong cộng đồng này.");
  }
  return { supabase, user, role };
}

/**
 * Chỉ cho phép đường dẫn nội bộ (same-origin relative path).
 * Chặn open redirect: "//evil.com", "https://evil.com", "http:\\evil.com".
 */
