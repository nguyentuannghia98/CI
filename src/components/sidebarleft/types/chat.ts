export type Conversation = {
  partner_id: string;
  username: string;
  avatar_url: string;
  last_message: string;
  last_time: string;
  is_read?: boolean;
};

export type MessageRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean | null;
  created_at: string | null;
  type?: string | null;
};

export type UserRow = {
  id: string;
  username?: string | null;
  avatar_url?: string | null;
};