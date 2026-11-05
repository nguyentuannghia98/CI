# NexLoot — Đợt 5: Accessibility, SEO & kiểm thử mobile thật (2026-10-17)

Tiếp nối ma trận test `2026-10-16-nexloot-full-test-matrix.md`. Đợt này xử lý các mục còn lại:
**G4/G5, G6, G10, H23, H25** và **responsive R1–R10 (mobile/tablet thật)**.

## 0. Phương pháp kiểm thử mobile (điểm mới)

Trước đây không có cách test mobile (iframe bị `X-Frame-Options: DENY`, harness không có công cụ đổi viewport).
Đợt này dùng **Edge headless qua Chrome DevTools Protocol** để ép viewport thật:

- Script: `%TEMP%\opencode\mobile_probe.cjs` (mở Edge `--headless=new --remote-debugging-port`, gọi
  `Emulation.setDeviceMetricsOverride`, `Page.navigate`, `Runtime.evaluate` đo `scrollWidth` vs `innerWidth`,
  `Page.captureScreenshot`).
- Đo tại **390×844 (mobile)**, **768×1024 (tablet)**, **1280 (desktop)**.
- Tiêu chí overflow: `document.documentElement.scrollWidth > window.innerWidth` hoặc phần tử có
  `left < vw && right > vw` (bỏ qua phần tử nằm trong scroller `overflow-x` và off-canvas drawer).

## 1. Kết quả Lighthouse (bản production, `next start`)

| Route | Accessibility | Best Practices | SEO |
|---|---|---|---|
| `/` | **1.00** | 1.00 | 0.83* |
| `/home` | **1.00** | 1.00 | 0.83* |
| `/discovery` | **1.00** | 1.00 | 1.00 |
| `/arena` | **1.00** | 1.00 | 1.00 |
| `/auction` | **1.00** | 1.00 | 1.00 |
| `/create-community` | **1.00** | 1.00 | 1.00 |
| `/communities/[id]` | **1.00** | 1.00 | 0.83* |
| `/profile/[id]` | **1.00** | 1.00 | 0.83* |

\* **SEO 0.83 là false-positive có chủ đích của Next.js 15** (xem §3).

## 2. Lỗi accessibility/contrast đã sửa (đều là lỗi thật)

| # | File | Vấn đề | Sửa |
|---|---|---|---|
| 1 | `UserMenu.tsx` | nút theme + nút menu tài khoản không có tên truy cập | thêm `aria-label` |
| 2 | `ProductsList/components/TagFilter.tsx` | "Khám phá" `text-gray-400` trên nền trắng = 2.6:1 | → `text-gray-500` |
| 3 | `UniversalCard.tsx` | badge `#BÁN` nền `bg-black/50` trên ảnh sáng | → `bg-black/70` |
| 4 | `SidebarMainNav.tsx` | mục active `text-orange-600` trên `bg-orange-50` = 3.38:1 | → `text-orange-700` |
| 5 | `SidebarLeft.tsx` | mục active dùng `color: 'orange'` (#ffa500) = 1.8:1 | → `#c2410c` |
| 6 | `profile/components/ProfileHeader.tsx` | tab active `color: 'orange'` = 1.8:1 | → `#c2410c` |
| 7 | `communities/CommunityDetailView.tsx` | badge `bg-gray-100 text-gray-500` = 4.39:1 | → `text-gray-600` |
| 8 | `SidebarCommunity.tsx` | 3 nhãn `text-gray-400` | → `text-gray-600` |
| 9 | `products/ProductsPageClient.tsx`, `category/[id]/page.tsx`, `CreateTagButton.tsx`, `ModModeToggle.tsx`, `ReportUserModal.tsx`, `SuggestionsList.tsx`, `app/page.tsx` | nhiều nhãn nhỏ `text-gray-400` trên nền sáng | → `text-gray-500/600` |
| 10 | `Discover/CommunitiesView.tsx` | nhãn loading nằm trong `animate-pulse` → axe đo ở opacity 0.5 | bỏ `animate-pulse` (spinner vẫn quay) |

## 3. Vì sao SEO của route động = 0.83 (KẾT LUẬN: không phải lỗi)

Đo `</head>`/`<title>`/`<meta name=description>` trong HTML thật:

- Route **static** (`/about`, `/arena`, `/discovery`): `<title>`+meta nằm **trong `<head>`** → SEO 1.0.
- Route **động** (`/`, `/home`, `/communities/[id]`): Next.js 15 **stream metadata** — `<head>` được flush
  trước, `<title>`/meta được stream vào body và React hoist phía client.

Kiểm chứng bằng User-Agent:

| UA | meta ở `<head>`? |
|---|---|
| Chrome / Lighthouse | stream (body) |
| **Googlebot** | stream (Google chạy JS → hoist, vẫn đọc được) |
| **Bingbot** | **trong `<head>`** (bot không chạy JS → Next chặn và nhét vào head) |

⇒ Đây là cơ chế `htmlLimitedBots` **có chủ đích** của Next.js 15. Googlebot chạy JS nên vẫn thấy meta;
Bingbot nhận meta trong head. **Không cần sửa code.** Lighthouse dùng UA Chrome nên báo "thiếu meta description".

## 4. Responsive — kết quả đo thật (390/768/1280)

**Không route nào có scroll ngang thật** (`docScrollWidth == innerWidth` ở mọi kích thước đã đo).

Đã kiểm bằng mắt (screenshot CDP) + đo overflow: `/`, `/home`, `/discovery`, `/arena`, `/auction`,
`/create-community`, `/communities/[id]`, `/profile/[id]`.

### 2 lỗi responsive thật đã sửa
1. **`/create-community`** (390px): tiêu đề cộng đồng dài không có khoảng trắng (`aaaa…`) làm **track CSS Grid**
   phình theo `min-content` → thẻ vượt mép phải ~10px, bị `overflow-hidden` cắt.
   → `CommunityCard.tsx`: thêm `min-w-0` + `break-words`.
2. **`/profile/[id]`** (768px): cột chứa tab bar thiếu `min-w-0` → tab "Chính sách" bị cắt, trang tràn ~102px.
   → `ProfileView.tsx`: thêm `min-w-0` cho flex child; tab bar `overflow-x-auto` cuộn được.

### Các mục R đã xác nhận
- **R2 LiveFeedback**: đã mount ở mọi kích thước (`AppLayout` mount `<LiveFeedback/>` ngoài aside); panel
  `w-[calc(100vw-2rem)]`, FAB `bottom-24` né bottom-nav → ✅ mobile.
- **R3** nút lưới ẩn trên mobile → chấp nhận.
- **R5 MiniChat**: `w-[calc(100vw-1.5rem)] sm:w-80`, mobile chỉ hiện khung mới nhất (`hidden sm:block`) → ✅.
- **R6 SideBarRight**: dead code đã xoá → N/A.
- **R7/R8/R9**: subpage/2-cột/modals đều responsive (`grid-cols-1 md:grid-cols-2`, modal `w-full max-w-*`,
  ProductDetailModal full-screen mobile) → ✅.
- **R10 PartListTable**: component không còn tồn tại → N/A.

## 5. Auth

- **G4/G5** (đặt lại/cập nhật mật khẩu): đã sửa `redirectTo` → `/auth/update` (trước đó trỏ route không tồn tại),
  thêm `/auth/update` vào Supabase allow-list; **verify live**: `PUT /auth/v1/user` → 200, mật khẩu cũ 400,
  mật khẩu mới 200.
- **G6** (Google OAuth): **verify được một phần** — bấm "Tiếp tục với Google" điều hướng đúng tới
  `accounts.google.com` với `client_id=203089032470-…`, `redirect_uri=https://<ref>.supabase.co/auth/v1/callback`,
  `redirect_to=http://localhost:3000/auth/callback`, `scope=email profile`. Provider đã bật (`google:true`).
  Bước cuối (đăng nhập bằng tài khoản Google thật) cần con người.
- **G10** (cookie auth đọc được bằng JS): **by design** của `@supabase/ssr` (browser client cần `document.cookie`);
  đã giảm thiểu bằng CSP + không có `dangerouslySetInnerHTML`. Chấp nhận, ghi nhận rủi ro.

## 6. Còn lại (không làm được bằng code)

- **Email gửi cho mọi người dùng**: cần verify domain trên Resend + đổi `smtp_admin_email` (From hiện là
  `onboarding@resend.dev`, chỉ gửi tới chủ tài khoản). → **CHỐT: giữ chế độ test, không làm** (quyết định người dùng 2026-10-17).
- **C3 vận hành**: rotate `SUPABASE_SERVICE_ROLE_KEY`, mật khẩu DB, token management đã lộ.

## 7. Gates
`npx tsc --noEmit` = 0 · `npm run lint` = 0 · `npm run build` = EXIT 0 (25/25 route).
