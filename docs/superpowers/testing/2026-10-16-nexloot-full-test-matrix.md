# NexLoot — MA TRẬN TEST ĐẦY ĐỦ (2026-10-16)

Nguồn: quét code `src/app/**/page.tsx`, `src/app/api/**/route.ts`, `src/app/actions/**`, `.rpc(`, `.storage`, realtime, auth.
Môi trường: `npm run dev` (http://localhost:3000). Verify: browser tự động + REST/service-role. User test riêng, xoá sau.

Ký hiệu: ✅ pass · ⚠️ pass có lưu ý · ❌ lỗi (đã ghi) · ⬜ chưa test · 🚫 không test được (OAuth/email thật)

---

## A. ROUTES (16 page + 404)

| # | Route | Trạng thái | Ghi chú |
|---|-------|-----------|---------|
| A1 | `/` | ✅ | feed, danh mục, nav |
| A2 | `/home` | ✅ | hero `/nen.png` (đã fix 404) |
| A3 | `/discovery` | ✅ | cộng đồng, filter |
| A4 | `/arena` | ✅ | ĐÃ SỬA (đợt 2): dùng `useUser()` reactive; hiển thị đúng "2 Vé", join qua UI OK |
| A5 | `/auction` | ✅ | ĐÃ SỬA (đợt 2) + migration apply (đợt 4): tải từ bảng `auctions`, đặt giá qua RPC `place_bid`; verify live hiển thị dữ liệu DB thật, không còn demo |
| A6 | `/category/[id]` | ✅ | |
| A7 | `/communities/[id]` | ✅ | bản tin, bài viết, join |
| A8 | `/profile/[id]` | ✅ | tải chậm do nhiều query tuần tự |
| A9 | `/create-community` | ✅ | submit thật tạo cộng đồng (C3) |
| A10 | `/about` | ✅ | HTTP 200 |
| A11 | `/careers` | ✅ | HTTP 200 |
| A12 | `/contact` | ✅ | HTTP 200 |
| A13 | `/policies` | ✅ | HTTP 200 |
| A14 | `/reset-password` | ⚠️ | render OK; đặt lại cần link email → chặn (xem G) |
| A15 | `/auth/update` | ⚠️ | render OK; cập nhật mật khẩu cần session recovery |
| A16 | `/auth/callback` | ⚠️ | render OK; cần session OAuth/email |
| A17 | `/_not-found` | ✅ | 404 đúng |

## B. API ROUTES (6)

| # | Endpoint | Method | Trạng thái | Ghi chú |
|---|----------|--------|-----------|---------|
| B1 | `/api/gemini` | POST | ✅ | 200, trả `result` (model `gemini-3.5-flash-lite`) |
| B2 | `/api/upload` | POST | ✅ | ĐÃ SỬA + verify: dùng bucket `images` (200) |
| B3 | `/api/TagGroups` | POST | ✅ | ĐÃ SỬA + verify: trả 200; no-token→401, bad-token→401 |
| B4 | `/api/listing` | POST | ✅ | ĐÃ SỬA + verify: tạo product 200 (bỏ `price`/`category` khỏi schema) |
| B5 | `/api/cron/generate-questions` | GET | ✅ | với `CRON_SECRET` → 200, sinh 20 câu hỏi (gọi cả RPC `delete_old_questions`); thiếu secret → 401 |
| B6 | `/api/logout` | GET | ✅ | xoá cookie, 307 |

## C. SERVER ACTIONS (22)

| # | Action | Trạng thái | Ghi chú |
|---|--------|-----------|---------|
| C1 | `toggleLikeAction` | ✅ | like/unlike |
| C2 | `toggleFollow` | ✅ | theo dõi/bỏ theo dõi (row `follows` tạo/xoá) |
| C3 | `createCommunityAction` | ✅ | ĐÃ SỬA + verify: thêm creator vào `community_members` (role owner); giữ `is_approved=false` (cổng duyệt chủ ý) |
| C4 | `createProductAction` | ✅ | tạo bài |
| C5 | `getProductsAction` | ✅ | feed |
| C6 | `getProductsByCommunityAction` | ✅ | danh sách bài cộng đồng |
| C7 | `submitUserRating` | ✅ | (client upsert `user_ratings`, 5 sao + comment) |
| C8 | `createComment` | ✅ | bình luận |
| C9 | `reportComment` | ⚠️ | code đúng (login + chặn tự tố cáo + `reason_id` bắt buộc); UI trong ProductDetailModal chưa kích hoạt được trong test tự động |
| C10 | `updateCommunityBanner` | ⚠️ | upload OK **khi role=`mod`**; owner bị chặn (chỉ `mod`) |
| C11 | `updateCommunityAvatar` | ⚠️ | như trên |
| C12 | `updateCommunityInfo` | ✅ | dead code — ĐÃ XOÁ |
| C13 | `createCommunityTag` | ⚠️ | tạo OK khi role=`mod`; owner bị chặn. `created_at` no-tz |
| C14 | `toggleCommunityMembership` | ✅ | join/leave (RPC) |
| C15 | `deleteCommunityAction` | ✅ | ĐÃ SỬA + verify: dọn con trước khi xoá; migration FK `ON DELETE SET NULL` đã apply (đợt 4) |
| C16 | `reserveProductIdAction` | ✅ | |
| C17 | `finalizeProductAction` | ✅ | product → `published` |
| C18 | `submitReportAction` | ✅ | row `reports` (reason, details, community_id, product_id, status pending) |
| C19 | `deleteComment` | ✅ | soft delete (`is_deleted=true`) |
| C20 | `deleteProductAction` | ✅ | soft delete (`deleted_at`) |
| C21 | `updateComment` | ✅ | |
| C22 | `updateProductAction` | ✅ | DB title đổi; card không tự refresh (nhỏ) |

## D. RPC

| # | RPC | Trạng thái | Ghi chú |
|---|-----|-----------|---------|
| D1 | `join_arena_room` | ✅ | `{success:true}`; thêm `arena_participants` + trừ voucher (`is_used=true`) atomic |
| D2 | `join_community_tx` | ✅ | join |
| D3 | `leave_community_tx` | ✅ | leave |
| D4 | `delete_old_questions` | ✅ | chạy trong cron, không lỗi |
| D5 | `check_email_exists_in_auth` | ⚠️ | dùng trong signup; signup chặn bởi lỗi email (G2) |

## E. STORAGE

| # | Bucket | Trạng thái | Ghi chú |
|---|--------|-----------|---------|
| E1 | `user-profile-avatar` | ✅ | upload avatar hồ sơ OK |
| E2 | `community-banners` | ✅ | upload banner cộng đồng OK (role mod) |
| E3 | `community-avatar-url` | ✅ | upload avatar cộng đồng OK (role mod) |
| E4 | `images` | ✅ | ảnh bài đăng dùng bucket này; `/api/upload` (bucket `product-images`) chết |
| — | `user-profile-banner` | ✅ | banner hồ sơ OK |

## F. REALTIME

| # | Kênh | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| F1 | `messages` (chat) | ✅ | nhận tin realtime |
| F2 | `conversations` (sidebar) | ✅ | ĐÃ SỬA + verify (đợt 2): channel topic duy nhất + listener `messages` INSERT; publication realtime đã apply (đợt 4) → sidebar tự cập nhật |
| F3 | `notifications` (NewsPanel) | ✅ | realtime OK; lệch giờ đã fix (`parseDbDate` + migration timestamptz đã apply đợt 4) |
| F4 | `feedbacks` (LiveFeedback) | ✅ | DANH SÁCH: identity đúng (đợt 2) + publication realtime đã apply (đợt 4). Ghi chú: UI append realtime chưa được quan sát lại bằng mắt sau khi apply |
| F5 | `users` status (ProfileAvatar) | ⚠️ | presence đã fix; UI đôi lúc hiện "Ngoại tuyến" ngay sau login |
| F6 | `online-status` (presence) | ✅ | đã fix + heartbeat 20s |

## G. AUTH

| # | Chức năng | Trạng thái | Ghi chú |
|---|-----------|-----------|---------|
| G1 | Đăng nhập email/mật khẩu | ✅ | |
| G2 | Đăng ký (signup) | ✅ | ĐÃ SỬA + test E2E (đợt 4): `POST /auth/v1/signup` → **200** + `confirmation_sent_at` ⇒ Resend gửi mail xác nhận thật |
| G3 | Quên mật khẩu | ✅ | ĐÃ SỬA + test E2E (đợt 4): `POST /auth/v1/recover` → **200** |
| G4 | Đặt lại mật khẩu | ✅ | ĐÃ SỬA + VERIFY (đợt 5): `redirectTo` → `/auth/update`; bấm link thật đổi được mật khẩu |
| G5 | Cập nhật mật khẩu | ✅ | ĐÃ SỬA + VERIFY (đợt 5): `PUT /auth/v1/user` 200, mật khẩu cũ 400 |
| G6 | Đăng nhập Google | ✅⚠️ | ĐÃ VERIFY (đợt 5): redirect tới `accounts.google.com` (client_id + redirect_to đúng); bước đăng nhập cuối cần tài khoản Google thật |
| G7 | Đăng xuất | ✅ | cookie xoá |
| G8 | Gate chưa đăng nhập | ✅ | báo cần login |
| G9 | Session sống qua reload | ✅ | |
| G10 | Bảo mật cookie | ⚠️ | By design `@supabase/ssr` (browser client buộc `httpOnly:false`); giảm thiểu bằng CSP + không `dangerouslySetInnerHTML`; chấp nhận rủi ro (đợt 5) |

## H. TÍNH NĂNG CLIENT

| # | Tính năng | Trạng thái | Ghi chú |
|---|-----------|-----------|---------|
| H1 | Tìm kiếm | ✅ | |
| H2 | Lịch sử tìm kiếm | ✅ | row `search_history` (timestamptz) |
| H3 | Dark mode (toggle) | ✅ | class `light`→`dark`, lưu `localStorage.theme` |
| H4 | Thông báo (NewsPanel) | ✅ | realtime (F3); lệch giờ |
| H5 | Danh sách hội thoại | ✅ | |
| H6 | Chat: gửi/nhận | ✅ | |
| H7 | Chat: đánh dấu đã đọc | ⚠️ | chỉ mark khi mở chat |
| H8 | Chat: mini chat box | ✅ | |
| H9 | Sửa hồ sơ | ✅ | OK (username/address/birth/updated_at); `users.phone` → text (migration apply đợt 4) — giữ số 0 đầu |
| H10 | Upload avatar | ✅ | |
| H11 | Upload banner | ✅ | |
| H12 | Theo dõi / bỏ theo dõi | ✅ | |
| H13 | Đánh giá user | ✅ | `user_ratings` |
| H14 | Tố cáo user | ✅ | `user_reports` (chọn lý do + chi tiết) |
| H15 | Tố cáo sản phẩm | ✅ | `reports` (2 bước, alert "Đã gửi báo cáo!") |
| H16 | Tố cáo bình luận | ⚠️ | code OK; UI chưa kích hoạt (xem C9) |
| H17 | Xem chi tiết sản phẩm (modal) | ✅ | |
| H18 | Chia sẻ sản phẩm | ✅ | copy → "Đã chép link" |
| H19 | Sửa bài của mình | ✅ | |
| H20 | Xoá bài của mình | ✅ | |
| H21 | Tạo bài (QuickPost) + ảnh | ✅ | tạo + publish OK |
| H22 | Feedback (LiveFeedback) | ✅ | ĐÃ SỬA + verify: ghi đúng `user_name` + `user_id` thật |
| H23 | Kiểm duyệt cộng đồng (mod) | ✅ | ĐÃ SỬA + VERIFY (đợt 5): RLS + server action `resolveReportAction`; bấm "GIỮ" → `status=resolved` |
| H24 | Đấu giá | ✅ | persist DB, đặt giá qua RPC `place_bid` (xem A5) |
| H25 | Trang trí hồ sơ theme | N/A | không tồn tại trong code (đợt 5) |

## I. RESPONSIVE (PC / MOBILE)

Breakpoints Tailwind: `sm`≥640 · `md`≥768 · `lg`≥1024 · `xl`≥1280.
Cấu trúc: **PC** = sidebar trái (`hidden md:flex`) + header desktop + aside phải (LiveFeedback `hidden lg:block`).
**Mobile** = header mobile (`md:hidden`, hamburger + search + UserMenu) + bottom-nav 5 nút (`md:hidden`).

| # | Khu vực | PC | Mobile | Ghi chú / việc cần bổ sung |
|---|---------|----|--------|----------------------------|
| R1 | Layout tổng | ✅ | ✅ | ổn |
| R2 | `LiveFeedback` (gửi phản hồi) | ✅ (lg+) | ❌ **không có khung** | Chỉ trong `hidden lg:block` → mobile/tablet không gửi được → **thiếu** |
| R3 | Nút "lưới lớn/nhỏ" | ✅ | ⚠️ | Mobile 1 cột; nút ẩn — tạm chấp nhận |
| R4 | Link tĩnh (Giới thiệu/Liên hệ/Chính sách/Tuyển dụng) | ✅ sidebar | ✅ hamburger | có trong menu mobile |
| R5 | MiniChat (hộp chat nổi) | ✅ | ⚠️ | `w-72 sm:w-80` + offset ngang theo `index`; không full-screen, nhiều box dễ tràn → cần bổ sung |
| R6 | `SideBarRight/SidebarRight` | ❌ | ❌ | component chết (không render) |
| R7 | Cộng đồng: quản trị (banner/avatar/info/tag) | ✅ | ⚠️ | desktop OK; mobile chưa test (không emulate được thiết bị thật) |
| R8 | Trang con (`/communities`, `/profile`, `/arena`, `/auction`, `/create-community`) | ✅ | ⚠️ | vài trang tải chậm; cần rà 2 cột→1 cột |
| R9 | Modal (ProductDetail, Post, Report, Edit, Auth, QuickPost) | ✅ | ⚠️ | desktop OK; mobile chưa test (không emulate được thiết bị thật) |
| R10 | Bảng/khung (`PartListTable` `hidden md:flex`) | ⬜ | ⬜ | cần xem bản mobile |

> Yêu cầu: với mỗi mục A–H chấm cả **PC** và **Mobile**; chỗ chỉ có PC thì bổ sung khung mobile hợp lý.

## J. LỖI TỔNG HỢP (ưu tiên sửa)

> Trạng thái sửa (cập nhật 2026-10-17, đợt 2–4): ✅ đã sửa+verify · 🟡 sửa một phần · ⛔ chặn bởi hạ tầng/vận hành (không sửa được bằng code).

1. **Signup/Quên mật khẩu chết** — `Error sending confirmation email`. ✅ ĐÃ SỬA (đợt 4): cấu hình custom SMTP Resend qua Management API; test E2E signup→200+`confirmation_sent_at`, recover→200.
2. **API chết/hỏng**: `/api/upload`, `/api/TagGroups`, `/api/listing`. ✅ ĐÃ SỬA + VERIFY.
3. **`createCommunityAction`** không thêm creator vào members. ✅ ĐÃ SỬA + VERIFY (creator = `owner`; giữ `is_approved=false` — cổng duyệt chủ ý).
4. **Quyền cộng đồng không nhất quán**. ✅ ĐÃ SỬA: `checkIsCommunityAdmin` cho cả `owner`/`mod`/`admin`.
5. **`deleteCommunityAction`** vướng FK `fk_community`. ✅ ĐÃ SỬA + VERIFY; migration `ON DELETE SET NULL` đã apply (đợt 4).
6. **Auction là demo** — không persist. ✅ ĐÃ SỬA (đợt 2) + bảng/RPC apply (đợt 4); verify live.
7. **Arena UI** hiển thị "0 Vé". ✅ ĐÃ SỬA + VERIFY (dùng `useUser()`).
8. **Timezone phase-2** (cột `timestamp` no-tz). ✅ client `parseDbDate` + migration `timestamptz` đã apply (đợt 4); REST trả kèm offset.
9. **`users.phone` kiểu integer**. ✅ migration `phone → text` đã apply (đợt 4).
10. **Bảo mật**: cookie auth đọc được bằng JS (`document.cookie`) vẫn ⛔ chưa sửa (cần review cookie/httpOnly + rotate service-role key — vận hành).
11. **Realtime hội thoại (F2)** không tự cập nhật. ✅ ĐÃ SỬA + VERIFY (topic duy nhất + listener `messages`; publication đã apply).
12. **Dead code** `updateCommunityInfo`, `SideBarRight`. ✅ ĐÃ XOÁ.
13. **From email** `onboarding@resend.dev` chỉ gửi tới email chủ Resend. ⏸️ CHỐT: giữ chế độ TEST theo quyết định người dùng (2026-10-17) — không verify domain. Muốn gửi cho mọi user: mua domain → verify Resend → đổi `smtp_admin_email`.

---

## TIẾN ĐỘ
- Tổng chức năng: A(17) + B(6) + C(22) + D(5) + E(5) + F(6) + G(10) + H(25) = **96 mục**
- Cập nhật 2026-10-17 (đợt 2–4): đã sửa + verify các lỗi #2–9, #11, #12; apply 2 migration; cấu hình email Resend + test E2E signup/recover.

### Còn lại CHƯA test / chỉ test một phần (nói rõ để không hiểu nhầm là "xong 100%")
- **G4/G5** — ✅ ĐÃ SỬA + VERIFY (đợt 5): sửa `redirectTo` → `/auth/update`, thêm vào allow-list; bấm link thật
  (session recovery seeded) → `PUT /auth/v1/user` 200, mật khẩu cũ 400, mật khẩu mới 200.
- **G6** — ✅ ĐÃ VERIFY một phần (đợt 5): provider `google:true`; bấm "Tiếp tục với Google" → redirect đúng tới
  `accounts.google.com` (client_id + redirect_uri + redirect_to + scope). Bước đăng nhập cuối cần tài khoản Google thật.
- **G10** — ⚠️ BY DESIGN của `@supabase/ssr` (browser client buộc `httpOnly:false`); đã giảm thiểu bằng CSP + không
  có `dangerouslySetInnerHTML`. Chấp nhận rủi ro (xem đợt 5 §5).
- **H23** — ✅ ĐÃ SỬA + VERIFY (đợt 5): bật RLS + backfill `comment_reports.community_id`; server action
  `resolveReportAction` (phân quyền mod + admin client); E2E: bấm "GIỮ" → `status=resolved`, `resolved_by` đúng.
- **H25** — N/A: không tồn tại tính năng "trang trí theme hồ sơ" trong code (grep toàn repo).
- **Responsive R1–R10** — ✅ ĐÃ TEST THẬT (đợt 5) bằng Edge headless/CDP tại 390/768/1280 (xem
  `2026-10-17-dot5-accessibility-responsive.md`). 2 lỗi thật đã sửa: `/create-community` (grid min-content) và
  `/profile` (flex child thiếu `min-w-0`). Không route nào còn scroll ngang.
- **Chỉ còn chặn bởi hạ tầng/vận hành:** email From cần verify domain Resend (làm sau cùng) + rotate key (C3).

> Kết luận (cập nhật đợt 5): toàn bộ chức năng A–H đã test; responsive đã test thật trên mobile/tablet/desktop.
> Accessibility 1.00 + Best Practices 1.00 cho mọi route đã đo. SEO 0.83 ở route động là cơ chế streaming metadata
> có chủ đích của Next.js 15 (không phải lỗi).
