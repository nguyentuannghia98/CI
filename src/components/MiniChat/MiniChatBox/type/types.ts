import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";

export interface User {
  id: string;
  username?: string | null;
  avatar_url?: string | null;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id?: string;
  content: string;
  created_at?: string | null;
  type?: string | null;
  is_read?: boolean | null;
  optimistic?: boolean;
  error?: boolean;
}

export type MessagePayload = RealtimePostgresChangesPayload<Message>;
export type ChannelRef = RealtimeChannel | null;
