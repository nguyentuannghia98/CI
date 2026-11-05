# Kế hoạch hoàn tất (2026-10-17, đợt 2)

Làm lần lượt, mỗi mục theo quy trình systematic-debugging (điều tra root cause trước khi sửa).

## A. Bug chức năng
- [x] A1. Arena "0 Vé" — ĐÃ SỬA + verified (dùng AuthStore reactive; "2 Vé" đúng)
- [x] A2. Auction chỉ demo — migration `2026-10-17_auctions_realtime.sql` ĐÃ apply + verify; trang dùng DB thật, fallback demo có banner (không còn kích hoạt)
- [x] A3. Realtime hội thoại sidebar (F2) — ĐÃ SỬA + verified (channel topic trùng do SidebarLeft render 2 lần; + lắng nghe `messages` INSERT)
- [x] A4. LiveFeedback luôn `user_name="Khách"` — ĐÃ SỬA + verified (ghi đúng user)

## B. Hiệu năng / chuẩn Google
- [x] B1. `<img>` → `next/image` (logo, PostModal×2, ProductDetailModal); giữ `<img>` cho preview blob; thêm `ui-avatars.com` vào remotePatterns
- [x] B2. Dọn sạch toàn bộ ESLint: **58 → 0 warnings, 0 errors** (bỏ import/biến không dùng, thay `any` bằng type cụ thể, sửa `exhaustive-deps` bằng `useCallback`/`useMemo`/disable có chú thích, `aria-selected` cho suggestion list, disable `no-img-element` có lý do cho preview blob)

## C. Blocked / vận hành (không code được)
- [x] C1. Cấu hình email provider (Resend SMTP) — ĐÃ CẤU HÌNH + verify (Supabase `smtp_host=smtp.resend.com`, port 587, user `resend`, `smtp_pass` set; `external_email_enabled=true`; `mailer_autoconfirm=false`; rate limit email = 100/giờ; SMTP AUTH tới Resend trả 235 OK). From đang là `onboarding@resend.dev` (chỉ gửi tới email chủ tài khoản Resend) — **CHỐT: đủ cho test, không verify domain** (quyết định 2026-10-17).
- [x] C2. Migration `2026-10-16_timezone_fk_phone.sql` — ĐÃ APPLY + verify (created_at→timestamptz ×6 bảng, users.phone→text, fk_community ON DELETE SET NULL)
- [ ] C3. Rotate `SUPABASE_SERVICE_ROLE_KEY` + DB password + token management đã lộ trong chat (thao tác vận hành)
- [x] C4. Ảnh Supabase trả 400 — ĐÃ SỬA: quét toàn bộ cột ảnh (`products.images`, `users.avatar_url`, `communities.avatar_url`, `arena_rooms.product_image`) đối chiếu 26 object storage; 2 sản phẩm trỏ object đã xoá (tiền tố `user_` cũ) → đặt `images=[]` để UI dùng placeholder nội bộ; còn lại 0 tham chiếu hỏng
- [x] C5. Migration `2026-10-17_auctions_realtime.sql` — ĐÃ APPLY + verify (bảng auctions/auction_bids, RPC place_bid, publication realtime conversations/feedbacks/auctions); trang `/auction` hiển thị dữ liệu DB thật, không còn banner demo

## Gates mỗi lần sửa
- `npx tsc --noEmit` = 0 · `npm run build` = EXIT 0 · verify live (dev/prod) · cập nhật manual-test-log

---

## Đợt 5 (2026-10-17) — accessibility, SEO, mobile thật
Chi tiết: `2026-10-17-dot5-accessibility-responsive.md`.
- [x] Dựng công cụ test mobile thật (Edge headless + CDP `Emulation.setDeviceMetricsOverride`) — thay cho việc không emulate được thiết bị.
- [x] Sửa 10 nhóm lỗi contrast/tên-nút (Lighthouse Accessibility 1.00 toàn bộ route đã đo).
- [x] Sửa 2 lỗi responsive thật: `/create-community` (grid min-content) + `/profile` (flex child thiếu `min-w-0`).
- [x] G4/G5 verify thật (đổi mật khẩu qua session recovery). G6 verify redirect Google OAuth. H25 = N/A. G10 = by design.
- [x] Kết luận SEO 0.83 ở route động là cơ chế streaming metadata của Next.js 15 (đã chứng minh bằng UA Googlebot/Bingbot).
- [x] Gates: tsc 0 · lint 0 · build EXIT 0.
- [x] Email: chốt dừng ở chế độ TEST theo quyết định người dùng (2026-10-17). Resend SMTP đã chạy
  (`onboarding@resend.dev`, chỉ tới hộp thư chủ Resend) — đủ để test, KHÔNG verify domain, KHÔNG đổi `smtp_admin_email`.
  Muốn gửi cho mọi user về sau: mua domain → verify Resend → đổi `smtp_admin_email` (xem `scripts/setup-supabase-email.sh`).
- [ ] Còn lại duy nhất: C3 — rotate `SUPABASE_SERVICE_ROLE_KEY` + DB password + token management đã lộ trong chat (vận hành, người dùng tự làm).

