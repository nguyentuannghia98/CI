/**
 * Client-safe helper: chỉ cho phép đường dẫn nội bộ (same-origin relative path).
 * Chặn open redirect: "//evil.com", "https://evil.com", "http:\\evil.com".
 * KHÔNG import module server nào ở đây để dùng được trong client component.
 */
export function isSafeInternalPath(path: unknown): path is string {
  if (typeof path !== "string" || path.length === 0) return false;
  if (!path.startsWith("/")) return false;
  if (path.startsWith("//")) return false;
  if (path.startsWith("/\\")) return false;
  return true;
}
