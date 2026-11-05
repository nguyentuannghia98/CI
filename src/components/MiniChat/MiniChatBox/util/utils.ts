// src/components/MiniChat/MiniChatBox/util/utils.ts
import { Message, User } from "@/components/MiniChat/MiniChatBox/type/types";

/**
 * Normalize a raw DB / realtime payload into a safe Message object.
 */
export function normalizeMessage(raw: unknown): Message {
  const r = (raw ?? {}) as Record<string, unknown>;

  const id = r.id ?? "";
  const sender_id = r.sender_id ?? "";
  const receiver_id = r.receiver_id ?? undefined;
  const content = r.content ?? "";
  
  // XỬ LÝ THỜI GIAN: Đảm bảo luôn trả về chuỗi ISO chuẩn
  let created_at: string | null = null;
  if (r.created_at) {
    // Ép kiểu về Date rồi mới toISOString để đảm bảo có múi giờ (Z)
    created_at = new Date(r.created_at as string).toISOString();
  }

  const type = r.type ?? null;
  const is_read = typeof r.is_read === "boolean" ? (r.is_read as boolean) : null;

  const normalized: Message = {
    id: String(id),
    sender_id: String(sender_id),
    receiver_id: receiver_id === undefined ? undefined : String(receiver_id),
    content: String(content),
    created_at: created_at,
    type: type === null ? null : String(type),
    is_read,
  };

  // QUAN TRỌNG: Không dùng { ...normalized, ...r } vì r sẽ ghi đè created_at vừa sửa
  // Chỉ lấy thêm các trường khác nếu có, nhưng giữ nguyên các trường đã normalize
  return { ...r, ...normalized } as Message;
}

/**
 * Normalize a raw DB row into a safe User object.
 */
export function normalizePartner(data: unknown): User {
  const d = (data ?? {}) as Record<string, unknown>;

  const id = d.id ?? "";
  const username = d.username ?? null;
  const avatar_url = d.avatar_url ?? null;

  const normalized: User = {
    id: String(id),
    username: username === null ? null : String(username),
    avatar_url: avatar_url === null ? null : String(avatar_url),
  };

  return normalized;
}

/**
 * Build the Supabase OR filter string for two participant ids.
 */
export function buildOrFilter(a: string, b: string) {
  return `and(sender_id.eq.${a},receiver_id.eq.${b}),and(sender_id.eq.${b},receiver_id.eq.${a})`;
}