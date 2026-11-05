"use client";

import { useUser } from "@/components/auth/store/AuthStore";

/**
 * Lấy id của người dùng hiện tại từ AuthStore — nguồn dữ liệu duy nhất,
 * đã được hydrate sẵn qua `getUser()` + `onAuthStateChange` và chặn render
 * ở ClientRootWrapper cho tới khi khởi tạo xong.
 *
 * Trước đây hook này dùng React Query + `auth.getUser()` với `staleTime`
 * 10 phút. Nếu lần gọi đầu chạy trước khi session sẵn sàng, giá trị `null`
 * sẽ bị cache suốt 10 phút, khiến các hành động cần đăng nhập (đăng bài,
 * nhắn tin, tham gia cộng đồng...) báo nhầm "chưa đăng nhập".
 */
export function useCurrentUser() {
  const user = useUser();
  return user?.id ?? null;
}
