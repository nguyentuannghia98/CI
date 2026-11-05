/**
 * Chuẩn hoá thời gian đọc từ Supabase về đúng UTC.
 *
 * Bối cảnh: một số cột trong DB vẫn là `timestamp` (không có timezone) — ví dụ
 * `notifications.created_at`, `products.created_at`, `comments.created_at`,
 * `users.created_at` — và Postgres lưu giá trị đó theo giờ UTC (session timezone
 * của Supabase mặc định là UTC). PostgREST trả về chuỗi KHÔNG kèm offset, ví dụ
 * "2026-10-16T16:27:49", khiến `new Date()` của trình duyệt hiểu nhầm thành giờ
 * ĐỊA PHƯƠNG và hiển thị lệch (ví dụ +7h ở Việt Nam).
 *
 * Helper này gắn hậu tố "Z" khi chuỗi chưa có thông tin timezone để luôn parse
 * đúng theo UTC. An toàn với cả chuỗi đã có timezone (timestamptz trả về
 * "...+00:00") vì khi đó giữ nguyên.
 */
export function parseDbDate(
  value: string | number | Date | null | undefined
): Date | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value;

  if (typeof value === "number") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const raw = value.trim();
  if (!raw) return null;

  // Đã có timezone (Z hoặc +/-hh:mm) => giữ nguyên.
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw);
  if (hasTimezone) {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // Chỉ có ngày (YYYY-MM-DD) => ISO date-only đã được hiểu là UTC.
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(`${raw}T00:00:00Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  // Có giờ nhưng thiếu timezone => coi là UTC.
  const normalized = `${raw.replace(" ", "T")}Z`;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}
