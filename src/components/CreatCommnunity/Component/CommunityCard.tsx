"use client";

import type { Database } from "@/types/supabase";

type Community = Database["public"]["Tables"]["communities"]["Row"];

type Props = {
  c: Community;
  onOpen: (id: string) => void;
};

export default function CommunityCard({ c, onOpen }: Props) {
  return (
    <div
      onClick={() => onOpen(c.id)}
      className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition cursor-pointer min-w-0"
    >
      <h3 className="text-lg font-semibold text-gray-800 break-words">{c.title}</h3>
      <p className="text-sm text-gray-500 mt-1">{c.category}</p>
      <p className="text-sm text-gray-600 line-clamp-2 mt-2 break-words">
        {c.description || "Chưa có mô tả."}
      </p>
      
    </div>
  );
}