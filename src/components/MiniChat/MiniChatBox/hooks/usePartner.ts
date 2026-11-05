"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { User } from "@/components/MiniChat/MiniChatBox/type/types";
import { normalizePartner } from "@/components/MiniChat/MiniChatBox/util/utils";

export function usePartner(partnerId: string | null) {
  const supabase = createClient();

  const { data: partner = null } = useQuery({
    // Cache dựa trên partnerId, nếu ID thay đổi query sẽ tự chạy lại
    queryKey: ["chatPartner", partnerId],
    queryFn: async () => {
      if (!partnerId) return null;

      const { data, error } = await supabase
        .from("users")
        .select("id, username, avatar_url")
        .eq("id", partnerId)
        .single();

      if (error) {
        console.error("[usePartner] error:", error);
        return null;
      }

      return normalizePartner(data) as User;
    },
    // Chỉ chạy query khi partnerId có giá trị
    enabled: !!partnerId,
    // Thông tin người dùng ít thay đổi, có thể giữ cache lâu một chút
    staleTime: 1000 * 60 * 30, // 30 phút
    gcTime: 1000 * 60 * 60,    // Giữ trong bộ nhớ 1 tiếng
  });

  return partner;
}