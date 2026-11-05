"use client";

import React, { JSX, useCallback } from "react";
import Portal from "@/components/Portal/Portal"; // Import component Portal dùng chung của bạn
import MiniChatBox from "@/components/MiniChat/MiniChatBox";
import { useChat } from "@/components/MiniChat/ChatContext";

export default function GlobalMiniChat(): JSX.Element | null {
  const { openChats = [], closeChat } = useChat();

  const handleClose = useCallback((partnerId: string) => {
    closeChat(partnerId);
  }, [closeChat]);

  // Nếu không có ô chat nào mở thì không cần render Portal luôn
  if (openChats.length === 0) return null;

  return (
    <Portal>
      {/* Z-index ở đây nên thấp hơn QuickPostModal một chút (ví dụ 100001) 
          để nếu đang chat mà mở Modal đăng bài thì Modal vẫn đè lên trên được.
      */}
      <div className="fixed bottom-0 right-0 z-[100001] pointer-events-none flex flex-row-reverse items-end px-4 gap-2 pb-4">
        {openChats.map((partnerId, index) => (
          <div
            key={partnerId}
            // Trên mobile (< sm) chỉ hiện khung chat mới nhất để không chồng/tràn.
            className={`pointer-events-auto ${index < openChats.length - 1 ? "hidden sm:block" : ""}`}
          >
            <MiniChatBox
              partnerId={partnerId}
              index={index}
              onClose={() => handleClose(partnerId)}
            />
          </div>
        ))}
      </div>
    </Portal>
  );
}