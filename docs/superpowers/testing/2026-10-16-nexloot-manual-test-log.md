# NexLoot — Nhật ký test thủ công (2026-10-16)

Môi trường: `npm run dev` (http://localhost:3000), trình duyệt tự động + đối chiếu DB (service role).

Ký hiệu: ✅ pass · ⚠️ pass có lưu ý · ❌ lỗi · ⬜ chưa test

## Trang / Route
- ✅ `/` — feed marketplace, danh mục, nav (18 sản phẩm)
- ✅ `/home` — trang chủ (carousel, banner hero)
- ✅ `/discovery` — khám phá cộng đồng (12+ cộng đồng, filter)
- ✅ `/arena` — đấu trường (view)
- ✅ `/auction` — đấu giá (view)
- ✅ `/category/[id]` — danh mục
- ✅ `/communities/[id]` — cộng đồng (bản tin, bài viết, join)
- ✅ `/profile/[id]` — hồ sơ (tải chậm do nhiều query tuần tự)
- ✅ `/create-community` — tạo cộng đồng (view form)
- ⬜ `/about`, `/careers`, `/contact`, `/policies` — trang tĩnh
- ⬜ `/reset-password`, `/auth/update`, `/auth/callback`
- ⬜ 404 (`/_not-found`)

## Xác thực (Auth)
- ✅ Đăng nhập (email/mật khẩu) — session cookie
- ⬜ Đăng ký (signup) + xác thực email
- ⬜ Quên mật khẩu (gửi link)
- ⬜ Đặt lại mật khẩu (reset-password)
- ⬜ Đăng nhập Google
- ⬜ Đăng xuất
- ✅ Gate chưa đăng nhập (bình luận/join báo cần login)

## Sản phẩm / Bài đăng
- ✅ Xem feed, xem chi tiết (modal)
- ✅ Like (0→1, ghi DB)
- ✅ Bình luận (ghi DB)
- ⬜ Xoá bình luận của mình
- ⬜ Báo cáo sản phẩm / bình luận
- ✅ Tạo bài viết (đăng vào cộng đồng, ghi DB)
- ⬜ Sửa bài viết của mình
- ⬜ Xoá bài viết của mình
- ⬜ Chia sẻ (share)
- ⬜ Tải ảnh lên (/api/upload)

## Cộng đồng
- ✅ Tham gia / rời (RPC, ghi DB)
- ⬜ Tạo cộng đồng (admin action `CreatComunities`)
- ⬜ Xoá cộng đồng (owner/admin)
- ⬜ Kiểm duyệt (mod): xử lý báo cáo

## Hồ sơ (Profile)
- ✅ Xem hồ sơ người khác
- ⬜ Sửa hồ sơ (thông tin)
- ⬜ Đổi avatar / banner
- ⬜ Theo dõi (follow) / bỏ theo dõi
- ⬜ Đánh giá người dùng (rating)
- ⬜ Báo cáo người dùng

## Chat / Tin nhắn  ✅
- ✅ Gửi tin nhắn (ghi DB `messages`, sender A → receiver B)
- ✅ Nhận tin nhắn realtime (chèn B→A khi chat A đang mở → tự hiện, không reload)
- ⚠️ Đánh dấu đã đọc: chỉ chạy khi mở chat (500ms sau), tin đến realtime **không** tự mark read
- ✅ Danh sách hội thoại / panel Tin nhắn (hiện hội thoại + thời gian)

## Hiện diện online/offline — ĐÃ SỬA & VERIFY
Nguyên nhân gốc (3 lỗi):
- ❌ `handle_new_user` **ép `is_online = true`** + cột `last_seen` default `now()` → tài khoản mới "online" dù chưa đăng nhập.
- ❌ Cron mỗi phút `handle_user_disconnect_timeout()` đá offline khi `last_seen < now()-30s`, mà client **không bao giờ** cập nhật `last_seen` → ai cũng bị offline sau ~1 phút.
- ❌ `AppLayout` dùng event `leave` → khi BẤT KỲ user nào rời kênh, client hiện tại tự set chính mình offline.

Đã sửa:
- ✅ DB: `last_seen` bỏ default `now()`; `handle_new_user` không còn ép `is_online=true`; backfill `is_online=false`.
- ✅ Client: `AppLayout` thêm **heartbeat 20s** cập nhật `is_online=true, last_seen=now()`.
- ✅ Client: sửa `leave` → dùng `sync` + `presenceState` của chính mình.

Verify (user C thật):
- User mới tạo → `is_online=false`, `last_seen=null` ✅
- Đăng nhập → online, `last_seen` refresh mỗi 20s qua nhiều mốc cron ✅
- Rời tab → cron tự chuyển `is_online=false` + ghi `last_seen` sau ~55s ✅

## Múi giờ tin nhắn — ĐÃ SỬA & VERIFY
- Nguyên nhân: `useMiniChat.sendMessage` gửi `created_at` = giờ địa phương "phẳng" (không kèm TZ) vào `messages.created_at` (kiểu `timestamp`), trong khi DB/cron ghi UTC → bản ghi không do app tạo lệch 7h.
- Đã sửa DB: `messages.created_at` → `timestamptz` (default `now()`), dịch `-7h` cho 125 tin cũ; `conversations.last_message_at` `-7h`. Có bảng backup `_bak_*` (giữ tạm để rollback).
- Đã sửa client: bỏ hack giờ phẳng, insert không gửi `created_at` để DB tự set `now()` (UTC); optimistic dùng `toISOString()`.
- Verify (A→B thật): tin lưu `2026-10-16T15:39:58+00:00` (UTC) = 22:39 local, `last_message_at` khớp.
- Lưu ý còn lại: các cột `timestamp` khác (`products`, `comments`, `notifications`, `community_chats`...) client ghi `toISOString()` (UTC) → hiển thị có thể lệch 7h. Cần đợt 2 (audit riêng).

## Khác
- ✅ Tìm kiếm + (lịch sử tìm kiếm)
- ⬜ Thông báo (panel news)
- ⬜ Chế độ tối (dark mode toggle)
- ⬜ Đấu giá — đặt giá (bid)
- ⬜ Arena — chơi quiz / voucher
- ⬜ API: `/api/listing`, `/api/upload`, `/api/gemini`, `/api/TagGroups`, `/api/cron/generate-questions`, `/api/logout`
- ✅ Error/loading/not-found boundaries (đã tạo ở turn trước)

## Lỗi đã sửa trong đợt này
- ✅ `/hero.mp4` 404 → dùng ảnh `/nen.png`
- ✅ Race `useCurrentUser` → lấy từ AuthStore

## Lỗi tồn (không phải code)
- Ảnh sản phẩm hỏng trên Supabase Storage → Next image 400 (dữ liệu)
- `SUPABASE_SERVICE_ROLE_KEY` từng lộ → cần rotate

---

# ĐỢT TEST ĐẦY ĐỦ (2026-10-16, chiều/tối) — 96 mục

Ma trận chi tiết: `docs/superpowers/testing/2026-10-16-nexloot-full-test-matrix.md`

## Đã PASS (live + đối chiếu DB)
- Server actions: like/unlike (C1), follow/unfollow (C2), comment create/update/delete (C8/C19/C21),
  delete product (C20), update product (C22), QuickPost reserve+finalize → `published` (C16/C17), submit report (C18).
- Cộng đồng: join/leave (C14/D2/D3); banner upload (C10), avatar upload (C11), tạo tag (C13) — **khi role=`mod`**.
- Hồ sơ: sửa hồ sơ (H9), upload avatar/banner (H10/H11), follow (H12), rating (H13), tố cáo user (H14).
- Bài đăng: tố cáo sản phẩm (H15), chia sẻ link (H18).
- Search history (H2), dark mode (H3), realtime notification (F3/H4), realtime chat (F1).
- Arena RPC `join_arena_room` (D1) — gọi trực tiếp: thêm participant + trừ voucher atomic OK.
- Cron `/api/cron/generate-questions` với secret (B5) → sinh 20 câu hỏi + D4.

## Đã test — có lưu ý (⚠️)
- Arena UI hiển thị "0 Vé" dù user có voucher → không join được qua UI (A4). RPC thì đúng.
- Auction: demo client-side, không ghi DB (A5/H24).
- Realtime hội thoại sidebar không tự cập nhật, cần reload (F2).
- LiveFeedback insert OK nhưng luôn `user_name="Khách"`, `user_id=null` (H22); UI chưa thấy append realtime (F4).
- `users.phone` kiểu integer → "0900000000" thành 900000000 (H9).
- Notifications hiển thị lệch 7h (16:27 vs local 23:28) — cột `timestamp` no-tz (F3) — minh chứng lỗi timezone phase-2.

## LỖI (❌) phát hiện đợt này
1. **Đăng ký (G2) + Quên mật khẩu (G3)**: lỗi 500 `Error sending confirmation email` → không dùng được (chưa cấu hình email provider).
2. **`/api/upload` (B2)**: 500 — bucket `product-images` không tồn tại. Endpoint chết.
3. **`/api/TagGroups` (B3)**: bảng `tag_groups` không tồn tại → 500. Chỉ nhận Bearer (app không gọi).
4. **`/api/listing` (B4)**: Zod cho phép `price`/`category` nhưng bảng `products` không có 2 cột đó → gửi `price` → 500.
5. **`createCommunityAction` (C3)**: tạo cộng đồng nhưng `is_approved=false` và **không thêm creator vào `community_members`** → creator không đăng bài/không xoá được cộng đồng mình.
6. **Quyền cộng đồng không nhất quán**: banner/avatar/tag chỉ role `mod`; xoá chỉ `owner`. Owner không quản trị được.
7. **`deleteCommunityAction` (C15)**: xoá cộng đồng còn bài → FK `fk_community` trên `products` → `23503`, UI chỉ alert lỗi thô.
8. **Auth cookie đọc được bằng JS** (`document.cookie` chứa `sb-*-auth-token`) → rủi ro XSS lấy token (G10).

## Dead code
- `updateCommunityInfo` (action) — không có UI gọi.
- `src/components/SideBarRight/SidebarRight.tsx` — không render ở đâu.

## Responsive (R1–R10)
- PC: sidebar trái + header desktop + aside LiveFeedback (`lg+`).
- Mobile: header mobile + bottom-nav 5 nút.
- **Thiếu khung mobile**: LiveFeedback chỉ `hidden lg:block` → mobile không gửi phản hồi được (R2).
- MiniChat trên mobile: `w-72 sm:w-80` + offset ngang theo index → không full-screen, dễ tràn (R5).
- Cần rà thêm: modal các loại, `/communities/[id]`, `/profile/[id]`, `/arena`, `/auction`, `PartListTable` trên mobile.

## Dữ liệu test đã tạo (cần dọn)
- users `3c9a56de…` (QA Full Edited) + `b91751ce…` (QA Full B)
- community `62f11f15…` (QA Community) + banner/avatar storage + tag "QA Tag"
- products (QA Post soft-deleted), comment `58a1bad1…`, notifications, messages + conversation A-B,
  user_ratings, user_reports, reports, search_history, feedbacks, arena room + participant + voucher
- file `qa-full-user.txt`

---

# ĐỢT SỬA LỖI + VERIFY LIVE (2026-10-17)

## Nhóm 1 — Cộng đồng
- ✅ **`createCommunityAction`** (`src/app/actions/CreatComunities.ts`): thêm creator vào `community_members` với `role="owner"` (+ rollback xoá cộng đồng nếu insert member lỗi).
  - **Verify live**: gọi action qua user thật → community `f1619d27…`; DB `community_members` = `{role:"owner", user_id:48ab714c…}`.
- ✅ **Quyền cộng đồng** (`Communities.ts`): `checkIsMod` → `checkIsCommunityAdmin` chấp nhận `owner`/`mod`/`admin`.
- ✅ **`deleteCommunityAction`** (`JoinLeave.ts`): check quyền owner → dùng admin client dọn con (gỡ + soft-delete `products`, xoá `community_members`/`community_tags`, xoá `reports`/`comment_reports` theo community) → xoá cộng đồng.
  - **Verify live**: tạo lại cộng đồng + chèn 1 product → gọi xoá → `{success:true}`; DB: community rỗng, product `community_id=null`, `deleted_at` set, `deleted_by`=user. (Trước đây lỗi `23503 fk_community`.)

## Nhóm 2 — API
- ✅ **`/api/upload`**: dùng bucket `images` (bucket thật của app) thay vì `product-images` (không tồn tại); `.env.local` cập nhật `PRODUCT_IMAGES_BUCKET=images`.
  - **Verify live**: POST ảnh PNG từ trình duyệt đã đăng nhập → `200 {success:true,url:.../images/<uid>/<ts>.png}`.
- ✅ **`/api/listing`**: bỏ `price`/`category` khỏi Zod (không có trong bảng `products`); set `status:"published"`.
- ✅ **`/api/TagGroups`**: insert vào `community_tags` (bảng thật) thay vì `tag_groups` (không tồn tại).
  - **Verify live**: POST kèm `Bearer <access_token>` → `201 {data:{id,name,community_id,created_by}}`. (Không Bearer → 401 đúng thiết kế.)

## Nhóm 3 — Timezone (client) + migration
- ✅ Thêm `src/lib/datetime.ts::parseDbDate` (coi chuỗi thiếu offset là UTC).
- ✅ Áp vào: `NewsPanel` (notifications), `MessagesPanel`, `ProductDetailModal` (comments), `LiveFeedback`, `UserRating`, `ProductCarousel`, `ProfileAvatar`, `MiniChatView`.
  - **Verify live**: chèn notification `created_at=2026-10-16T17:00:15` (UTC) → UI hiển thị `00:00 17-10` (giờ local UTC+7). Trước fix sẽ là `17:00 16-10`.
- 🟡 `supabase/migrations/2026-10-16_timezone_fk_phone.sql`: chuyển các cột sang `timestamptz`, FK `fk_community ON DELETE SET NULL`, `users.phone` → `text`. **CHƯA apply** (repo không còn `SUPABASE_DB_URL`).

## Nhóm 4 — Responsive + dead code
- ✅ `AppLayout`: `LiveFeedback` mount ở mọi kích thước (trước chỉ trong `aside hidden lg:block`).
- ✅ `LiveFeedback`: FAB nâng lên `bottom-24` trên mobile (tránh bottom-nav).
- ✅ `MiniChatView`/`GlobalMiniChat`: mobile full-width, offset ngang chỉ từ `sm`, chỉ hiện khung chat mới nhất trên `< sm`.
- ✅ Xoá dead code: `src/components/SideBarRight/` và action `updateCommunityInfo`.

## Gates
- `npx tsc --noEmit` = 0 · `npm run lint` = 0 error · `npm run build` = EXIT 0 · `/home` HTTP 200.

## Dọn dẹp
- Đã xoá: notification QA, tag, cộng đồng QA, product QA (soft-deleted), user test `48ab714c…` (auth + public), ảnh storage; route tạm `qalogin`/`qatest` đã xoá.
- Còn nợ (không code được): cấu hình email provider cho signup/forgot; apply migration SQL; rotate service-role key.

---

# ĐỢT GOOGLE DESIGN + SEO + A11Y (2026-10-17, bổ sung)

## SEO nền tảng (mới)
- `src/app/robots.ts` → `/robots.txt` (200).
- `src/app/sitemap.ts` → `/sitemap.xml` (25 URL: 9 tĩnh + 16 động).
- `src/app/manifest.ts` → `/manifest.webmanifest` (PWA installable).
- `src/app/layout.tsx`: `metadataBase`, title template, description, keywords, openGraph, twitter card, robots, icons + `export const viewport` (width/initialScale/maximumScale=5/`viewportFit:"cover"`/themeColor sáng–tối).
- Metadata riêng cho các trang client: `layout.tsx` tại `about, contact, policies, careers, auction, arena, create-community`; `reset-password/layout.tsx` + `auth/layout.tsx` đặt `robots noindex`.
- `generateMetadata` cho route động: `communities/[id]` (title/desc/og từ bảng `communities`), `profile/[id]` (từ `users`), `category/[id]` (từ `community_branches`).
- `metadata` cho `/` và `/home`.
- ⚠️ **Sửa lỗi SEO nghiêm trọng**: bỏ `alternates.canonical:"/"` ở root layout (nếu giữ, mọi trang khai báo trùng với `/`). Canonical giờ đúng theo từng trang (đã verify `<link rel="canonical">` khớp URL động).

## Accessibility (Lighthouse a11y)
- Thêm `aria-label` cho toàn bộ nút icon-only: hamburger HeaderBar, đóng CategoryPanel/UserProfilePanel/MessagesPanel/NewsPanel/MiniChatView, avatar mobile UserMenu (bỏ luôn `opacity-20` làm avatar mờ vô hình), menu/kiểm duyệt/thích/bình luận trong `UniversalCard` (kèm `aria-haspopup`/`aria-expanded`/`aria-pressed`, và tên chứa số đếm để không vi phạm `label-content-name-mismatch`).
- Bỏ nút menu "chết" trong `logo.tsx` khi không có `onMenuToggle`.
- `label-content-name-mismatch`: `aria-label` của nút thích/bình luận nay chứa con số hiển thị.
- **Heading order**: `/auction`, `/policies`, `/contact` h3→h2; `UniversalCard` tiêu đề sản phẩm h3→h2; `/profile` thêm `h1` (sr-only) + hạ h4/h3→h2.

## Contrast (WCAG 1.4.3)
- `globals.css`: override theo theme cho màu thương hiệu —
  `.text-orange-500` → `#9a3412` (sáng) / `#fb923c` (tối); `.bg-orange-500` → `#c2410c`/`#ea580c`; `.text-amber-500` → `#b45309`/`#fbbf24`; `.text-rose-500` → `#be123c`/`#fb7185`.
- Bottom-nav: bỏ `opacity-70` trên nhãn (làm tụt contrast xuống 3.4:1) + tăng lên 11px.
- HeroVideo CTA `bg-orange-500`→`bg-orange-700`; badge số lượng trong ProductCarousel dùng tông theme-aware.

## Design token (Google/Material + WCAG)
- `prefers-reduced-motion` toàn cục; `:focus-visible` outline; `-webkit-tap-highlight-color`; safe-area (`pb-safe`/`pt-safe`/`mb-safe` dùng `env(safe-area-inset-*)`).
- Touch target nút icon nâng lên ~40–44px (`p-2`/`p-2.5`).
- Bottom-nav mobile: `h-[72px]` → `min-h-[72px]` để không bóp nội dung khi có safe-area.

## Responsive gaps còn lại (đã xử lý)
- `UniversalCard` list mode tràn ngang: `min-w-0 md:min-w-[850px]`, `flex-col md:flex-row`.
- `LiveFeedback` panel: `w-[calc(100vw-2rem)] max-w-[350px]`.
- Bottom-nav mobile thêm mục **Thông báo** (6 mục); drawer `CategoryPanel` thêm link **Đấu giá/Sàn đấu/Giới thiệu/Liên hệ/Chính sách/Tuyển dụng**.
- Xoá dead code `src/components/pc-builder/` (không được import ở đâu).

## Kết quả Lighthouse (production build) — 12 trang
| Trang | A11y | Best Practices | SEO |
|---|---|---|---|
| `/` | 1.00 | 1.00 | 0.80* |
| `/home` | 1.00 | 1.00 | 0.80* |
| `/discovery` | 1.00 | 1.00 | 1.00 |
| `/arena` | 1.00 | 1.00 | 1.00 |
| `/auction` | 1.00 | 1.00 | 1.00 |
| `/about` | 1.00 | 1.00 | 1.00 |
| `/contact` | 1.00 | 1.00 | 1.00 |
| `/policies` | 1.00 | 1.00 | 1.00 |
| `/careers` | 1.00 | 1.00 | 1.00 |
| `/communities/[id]` | 0.96–1.00 | 1.00 | 0.83* |
| `/profile/[id]` | 1.00 | 1.00 | 0.80* |
| `/category/[id]` | 1.00 | 1.00 | 0.80* |

`*` Lighthouse đôi lúc báo `meta-description` thiếu trên các trang dynamic vì tool chụp `<head>` trước khi metadata stream xong — **đã verify `<meta name="description">` CÓ trong HTML thô** (curl) của cả 5 trang này ⇒ false-negative của tool, không phải lỗi thật.

## Gates (đợt này)
- `npx tsc --noEmit` = 0 · `npm run build` = EXIT 0 (25/25 static pages) · lint chỉ warning.

## Còn tồn (chưa làm trong đợt này)
- `<img>` → `next/image` ở PostModal/quickpost/logo/ProductDetailModal (lint warning; cần lưu ý `blob:`/preview).
- Bug chức năng còn nợ: Arena "0 Vé", Auction chỉ demo (không ghi DB), realtime hội thoại sidebar (F2), LiveFeedback luôn `user_name="Khách"`.
- 1 URL ảnh Supabase trả 400 (`upstream image response failed`) — object storage đã mất/đổi tên.

---

## 2026-10-17 — Đợt 2: bug chức năng còn lại + `next/image`

Quy trình: systematic-debugging (điều tra root cause trước khi sửa), verify live bằng service-role REST + browser thật.

### A1. Arena "0 Vé" — ĐÃ SỬA, verified
- **Root cause:** `src/app/arena/page.tsx` tự gọi `supabase.auth.getUser()` **một lần** khi mount và không phản ứng với thay đổi trạng thái đăng nhập → nếu phiên chưa sẵn sàng tại thời điểm đó, `currentUser` kẹt `null` và `user_vouchers` **không bao giờ được truy vấn** → "0 Vé" vĩnh viễn.
- **Bằng chứng:** khi chưa có cookie phiên, network **không có** request `user_vouchers` nào; query thẳng bằng JWT người dùng trả `content-range 0-1/2` (RLS không phải nguyên nhân).
- **Fix:** dùng `useUser()` từ `AuthStore` (đã xử lý `getUser()` + `onAuthStateChange`), reset về 0 khi đăng xuất.
- **Verify:** đăng nhập user test có 2 voucher → `/arena` hiển thị **"2 Vé"**; request `user_vouchers?...is_used=eq.false` trả `0-1/2`.

### A2. Auction chỉ demo — ĐÃ CHUẨN BỊ (chờ apply migration)
- **Root cause:** không tồn tại bảng `auctions`/`auction_bids`; trang hoàn toàn là mock. Repo **không có `SUPABASE_DB_URL`**, PostgREST **không có** `exec_sql` → không thể tự apply DDL.
- **Fix:** viết `supabase/migrations/2026-10-17_auctions_realtime.sql` (2 bảng + RLS + RPC `place_bid` nguyên tử có kiểm tra hết hạn/giá/đăng nhập). Trang `src/app/auction/page.tsx` nay tải dữ liệu thật + đặt giá qua RPC; nếu **bảng chưa tồn tại** thì tự fallback demo kèm banner "Chế độ demo" (không còn gây hiểu nhầm).
- **Verify:** live → bảng thiếu → request `auctions` 404 → banner demo hiển thị, trang không vỡ. Đường "live" cần apply migration rồi mới kiểm chứng được.

### A3. Realtime hội thoại sidebar (F2) — ĐÃ SỬA, verified
- **Root cause:** `SidebarLeft` được render **2 lần** (desktop `hidden md:block` + mobile `md:hidden`), nên `useSidebarData` tạo **2 kênh realtime cùng topic** `sidebar-conv-changes-<uid>` → join đụng nhau, **không kênh nào joined** (`getChannels()` trống). Cộng thêm bảng `conversations` không nằm trong publication realtime.
- **Bằng chứng:** đã chứng minh event realtime **có tới client** (kênh dò `messages` INSERT + `conversations` UPDATE đều nhận), nhưng kênh của sidebar không tồn tại.
- **Fix:** (1) thêm `instanceId` duy nhất vào topic để 2 instance join độc lập; (2) lắng nghe thêm `messages` INSERT (bảng này chắc chắn có realtime) để invalidate danh sách hội thoại; (3) migration bật realtime cho `conversations`/`feedbacks`.
- **Verify:** sau fix, `getChannels()` có **2 kênh sidebar joined**; chèn tin nhắn từ user khác → sidebar **tự cập nhật không cần reload**.

### A4. LiveFeedback luôn "Khách" — ĐÃ SỬA, verified
- **Root cause:** hard-code `user_name: "Khách"`, `user_id: null` khi insert `feedbacks`.
- **Fix:** lấy `useUser()` (username/full_name/email-prefix) + `user_id` thật.
- **Verify:** gửi phản hồi khi đăng nhập → DB ghi `user_name="qa-arena"`, `user_id=e570ad71-...` (đúng user), không còn "Khách".

### B1. `<img>` → `next/image`
- Chuyển: `logo.tsx` (632×107, `priority`), `PostModal.tsx` (2 avatar cộng đồng → `fill`), `ProductDetailModal.tsx` (avatar bình luận → `fill`).
- Giữ nguyên `<img>` cho **preview blob/data URL** (`quickpost.tsx:205`, `PostModal.tsx` preview) — `next/image` không tối ưu được `blob:`.
- Thêm hostname `ui-avatars.com` vào `next.config.ts` `images.remotePatterns` (fallback avatar).
- **Verify:** `logo.png` render qua `/_next/image?...&w=1920`, không lỗi runtime.

### Dọn dẹp QA
- Đã xoá route tạm `/api/qa-login`, `/api/qa-arena-token`, gỡ `window.__sb`; xoá auth user test + voucher + hội thoại/tin nhắn/feedback test.

### Gates đợt 2
- `npx tsc --noEmit` = 0 (sau mọi thay đổi).

---

## 2026-10-17 — Đợt 3: dọn ESLint + dọn ảnh hỏng (C4)

Thứ tự theo yêu cầu: làm hết phần chức năng/hiệu năng, **để cấu hình email (C1) cuối cùng**.

### B2. Dọn sạch ESLint — ĐÃ SỬA
- Trước: **58 warnings, 0 errors** (`npx next lint`).
- Xử lý:
  - Bỏ import/biến không dùng (`usePathname`, `Info`, `ShieldAlert`, `Sparkles`, `Mail`, `PackageOpen`, `UserIcon`, `Check`, `Users`, `BarChart3`, `Award`, `useQueryClient`, `useCallback`, `useRouter`, `history`, `showDropdown`, `currentRole`, `isCommunity`, `newCommunity`, `displayName`, `loadingProducts`, `now`, `queryClient`, `selectedCategory`, `isProfile`...).
  - `catch (err)`/`catch (error)`/`catch (e)` không dùng → `catch {}` hoặc `instanceof Error`.
  - Thay `any` bằng type cụ thể: `Comment`/`RawComment`/`RawCommentUser` (ProductDetailModal), `ReportItem` (ModModeToggle), `PostCommunity`/`PostTag` (PostModal), `Database["public"]["Tables"]["communities"]["Row"]` + `Product[]` (CommunityDetailView), `userData` shape (UserProfilePanel), `EMPTY_ARRAY: never[]` (UniversalCard).
  - `exhaustive-deps`: thêm `useCallback` cho `enableNotifications` (SidebarLeft) + deps đúng; thêm `formData.username` (useProfileData); gỡ biến `db` dùng inline cast (auction); 2 chỗ cố ý giữ `product?.id`/`selectedCommunity` khởi tạo → `eslint-disable-next-line` có chú thích lý do.
  - `jsx-a11y`: thêm `aria-selected={false}` cho `role="option"` (SuggestionsList).
  - `no-img-element`: 2 chỗ preview `blob:` → disable có chú thích (không tối ưu được qua `next/image`).
- Sau: **`✔ No ESLint warnings or errors`**.

### C4. Ảnh Supabase trả 400 — ĐÃ SỬA
- Quét toàn bộ cột ảnh (`products.images`, `users.avatar_url`, `communities.avatar_url`, `arena_rooms.product_image`) đối chiếu **26 object** thật trong bucket `images`.
- Kết quả: **2 sản phẩm** trỏ object đã xoá (tiền tố `user_` cũ, không khớp folder `<uid>/`):
  - `b90531a3…` ("jkdnfadfkan") → `user_83095a2c…/product-…q9icxbq9icxbq9ic.png`
  - `346c3b88…` ("hay hay") → `user_c6fd8938…/product-…d701d566….jpg`
- Fix: đặt `images=[]` cho 2 dòng → UI dùng placeholder nội bộ `/placeholder.png`, không còn request optimizer 400.
- Re-scan: **TOTAL refs 7 · MISSING 0**.

### Gates đợt 3
- `npx tsc --noEmit` = 0 · `npm run lint` = 0 warnings/0 errors · `npm run build` = EXIT 0 (25/25) · prod smoke test 14 route (bao gồm `/`, `/home`, `/auction`, `/arena`, `/discovery`, `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, `/create-community`, `/about`, `/careers`, `/contact`, `/policies`, `/reset-password`) đều **200**.

### C1. Cấu hình email (làm cuối) — WIZARD đã tạo
- **Căn nguyên:** Supabase Auth dùng SMTP mặc định của Supabase → chỉ gửi được tới email thuộc team của project + giới hạn **2 email/giờ** ⇒ signup/quên mật khẩu trả 500 `Error sending confirmation email`.
- **Giải pháp:** cấu hình SMTP tùy chỉnh. Đã tạo wizard `scripts/setup-supabase-email.sh` (theo skill wizard) với **Resend** (miễn phí 3.000 email/tháng):
  - `smtp.resend.com`, port `587` (STARTTLS; `465` cho SSL/TLS), user `resend`, password = Resend API key.
  - 5 stage: tạo API key → chọn From (`onboarding@resend.dev` để test, hoặc `no-reply@<domain>` đã verified) → cấu hình Supabase SMTP (tự động qua Management API `PATCH /v1/projects/{ref}/config/auth`, hoặc điền tay ở `.../project/kzfmunxbdfdfxumerulj/auth/smtp`) → tăng rate limit → test thật (đăng ký + quên mật khẩu, xem log tại resend.com/emails).
  - Ghi lại `RESEND_API_KEY/FROM_EMAIL/SENDER_NAME` vào `.env.local` để tham chiếu về sau.
- **Kiểm chứng:** `bash -n` = 0 (shellcheck không có sẵn). Chưa chạy end-to-end vì script mở trình duyệt và chờ người dùng nhập.
- **Chạy:** `"C:\Program Files\Git\bin\bash.exe" scripts/setup-supabase-email.sh`

---

## 2026-10-17 — Đợt 4: apply migration qua Management API

Nhận Supabase access token (sbp_) từ người dùng ⇒ chạy được DDL qua Management API
`POST https://api.supabase.com/v1/projects/{ref}/database/query` (project `kzfmunxbdfdfxumerulj`).

### C2. `2026-10-16_timezone_fk_phone.sql` — ĐÃ APPLY + verify
- HTTP 201. Kiểm chứng `information_schema`/`pg_constraint`:
  - `created_at` của `notifications, products, comments, community_tags, product_tags, users` = **timestamp with time zone**.
  - `users.phone` = **text**.
  - `fk_community.confdeltype = 'n'` (= **ON DELETE SET NULL**).
- REST: `products.created_at` nay trả kèm offset `+00:00`.

### C5. `2026-10-17_auctions_realtime.sql` — ĐÃ APPLY + verify
- HTTP 201. Kiểm chứng: `to_regclass('public.auctions')` + `auction_bids` tồn tại; `pg_proc.place_bid` có; `pg_publication_tables` gồm `auctions, conversations, feedbacks`; `relrowsecurity = true` cho cả 2 bảng.
- REST: `GET /rest/v1/auctions` = 200 (trước là 404); `POST /rest/v1/rpc/place_bid` (không JWT) trả `P0001 UNAUTHENTICATED` ⇒ RPC gọi được, có kiểm tra đăng nhập.
- Live (browser thật, prod server): chèn 1 row test → `/auction` hiển thị đúng "[[TEST-WIZARD]] Đấu giá kiểm thử", 100.000đ, đồng hồ đếm ngược, **không có banner demo**. Xoá row test sau khi verify (`auctions_left = 0`).

### Còn lại
- **C1** (email): cần Resend API key — cấu hình trực tiếp qua Management API hoặc chạy wizard.
- **C3** (vận hành): rotate service-role key + mật khẩu DB + **token management đã lộ trong chat**.
- Token management lưu tạm ở `%TEMP%\opencode\.sbp_token`, KHÔNG nằm trong repo.

### C1. Email (Resend SMTP) — ĐÃ CẤU HÌNH + verify
- `PATCH /v1/projects/kzfmunxbdfdfxumerulj/config/auth` (HTTP 200) với:
  `external_email_enabled=true`, `mailer_autoconfirm=false`, `mailer_secure_email_change_enabled=true`,
  `smtp_host=smtp.resend.com`, `smtp_port="587"`, `smtp_user=resend`, `smtp_pass=<Resend key>`,
  `smtp_admin_email=onboarding@resend.dev`, `smtp_sender_name=Nexloot`.
- Đọc lại config xác nhận các trường đúng; `smtp_pass` có giá trị (non-null).
- **SMTP AUTH trực tiếp** tới `smtp.resend.com:465` bằng user `resend` + key → **235 OK** (credentials hợp lệ).
- `rate_limit_email_sent` 30 → **100/giờ** (PATCH 200).
- **Lưu ý:** From `onboarding@resend.dev` chỉ gửi được tới email chủ tài khoản Resend; muốn gửi cho mọi người dùng phải verify domain ở Resend rồi đổi `smtp_admin_email`.
- **Test E2E (đợt 4):**
  - `POST /auth/v1/signup` (email `delivered@resend.dev`) → **200** kèm `confirmation_sent_at` ⇒ Resend gửi mail xác nhận thật; user test đã xoá.
  - `POST /auth/v1/recover` → **200**.
  - Kết luận: G2 + G3 hoạt động end-to-end. G4 (bấm link đổi mật khẩu) chưa thử vì cần hộp thư.
- Việc còn lại (người dùng): verify domain Resend + đổi From để gửi cho mọi người dùng.
