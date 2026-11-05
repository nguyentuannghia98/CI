// src/components/MiniChat/ChatContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";

type ChatContextValue = {
  openChats: string[];
  focusedId: string | null;
  openChat: (partnerId: string) => void;
  closeChat: (partnerId: string) => void;
  toggleChat: (partnerId: string) => void;
  focusChat: (partnerId: string) => void;
  isOpen: (partnerId: string) => boolean;
};

// 1. Khởi tạo context với giá trị mặc định an toàn thay vì undefined
// Điều này giúp các component con không bị crash ngay cả khi provider chưa sẵn sàng
const ChatContext = createContext<ChatContextValue>({
  openChats: [],
  focusedId: null,
  openChat: () => {},
  closeChat: () => {},
  toggleChat: () => {},
  focusChat: () => {},
  isOpen: () => false,
});

export function ChatProvider({ children }: { children: React.ReactNode }) {
  // Luôn đảm bảo giá trị khởi tạo là một mảng rỗng []
  const [openChats, setOpenChats] = useState<string[]>([]);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const lastOpenAtRef = useRef<Record<string, number>>({});

  // Tối ưu: Chỉ log ở môi trường development để tránh làm chậm trang production
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("[ChatProvider] state change", { openChats, focusedId });
    }
  }, [openChats, focusedId]);

  const openChat = useCallback((partnerId: string) => {
    if (!partnerId) return;
    setOpenChats((prev) => {
      if (prev.includes(partnerId)) {
        setFocusedId(partnerId);
        return prev;
      }
      lastOpenAtRef.current[partnerId] = Date.now();
      setFocusedId(partnerId);
      return [...prev, partnerId];
    });
  }, []);

  const closeChat = useCallback((partnerId: string) => {
    const now = Date.now();
    const lastOpenAt = lastOpenAtRef.current[partnerId] ?? 0;

    if (now - lastOpenAt < 250) return;

    setOpenChats((prev) => prev.filter((id) => id !== partnerId));
    setFocusedId((prev) => (prev === partnerId ? null : prev));
    delete lastOpenAtRef.current[partnerId];
  }, []);

  const toggleChat = useCallback((partnerId: string) => {
    if (!partnerId) return;
    const now = Date.now();
    
    setOpenChats((prev) => {
      if (prev.includes(partnerId)) {
        const lastOpenAt = lastOpenAtRef.current[partnerId] ?? 0;
        if (now - lastOpenAt < 250) return prev;
        
        setFocusedId((f) => (f === partnerId ? null : f));
        delete lastOpenAtRef.current[partnerId];
        return prev.filter((id) => id !== partnerId);
      } else {
        lastOpenAtRef.current[partnerId] = now;
        setFocusedId(partnerId);
        return [...prev, partnerId];
      }
    });
  }, []);

  const focusChat = useCallback((partnerId: string) => {
    if (!partnerId) return;
    setFocusedId(partnerId);
    setOpenChats((prev) => {
      if (!prev.includes(partnerId)) return [...prev, partnerId];
      // Đưa partnerId lên cuối mảng (thường dùng để hiển thị box chat ngoài cùng bên phải)
      return [...prev.filter((id) => id !== partnerId), partnerId];
    });
  }, []);

  const isOpen = useCallback(
    (partnerId: string) => Array.isArray(openChats) && openChats.includes(partnerId),
    [openChats]
  );

  const value = useMemo(
    () => ({
      openChats,
      focusedId,
      openChat,
      closeChat,
      toggleChat,
      focusChat,
      isOpen,
    }),
    [openChats, focusedId, openChat, closeChat, toggleChat, focusChat, isOpen]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  // Không throw error nữa mà trả về context mặc định để tránh sập trang web
  return ctx;
}