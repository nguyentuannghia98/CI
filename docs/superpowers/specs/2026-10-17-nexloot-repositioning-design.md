# Thiết kế — Định vị lại Nexloot: Cổng thông tin mua bán + tự đăng (GĐ1+2)

- Ngày: 2026-10-17
- Trạng thái: bản nháp để duyệt (đang qua builder-check)
- Nguồn: phiên brainstorming với người dùng (2026-10-17) + khảo sát code hiện tại

---

## 1. Vì sao (why)

Nỗi đau người dùng tự nêu:

1. Tìm mua đồ cũ / giá tốt trên Facebook phải lướt rất nhiều group, rất nhiều bài → bất tiện.
2. Muốn bình luận/tương tác phải join group → Facebook cá nhân càng nhiễu.
3. Facebook không có chuẩn → tạp nham, lan man (không danh mục, không giá nhất quán, không khu vực, không tình trạng).

Hành trình thật: tìm bài → nhắn Messenger người bán → xem ảnh/video → hẹn gặp test → mua ngoài đời.
Mua bán chốt giữa người-với-người; **Nexloot không thay Messenger, không thanh toán**.

→ Định vị mới: **Nexloot là lớp thông tin có cấu trúc ở trên Facebook** — gom, chuẩn hoá, gộp trùng, cho tìm/lọc, và cho người dùng tự đăng lên chính trang.

## 2. Lộ trình

- **GĐ1+2 (gộp) — Cổng thông tin + tự đăng** ← lần này
- **GĐ3 — Sàn thông tin** (chờ định nghĩa)
- **GĐ4 — Sàn điện tử** (chờ định nghĩa)

## 3. Mục tiêu

- Người dùng tìm được món mình cần **nhanh hơn lướt group**, có lọc/sắp xếp theo cấu trúc.
- **Gộp trùng**: một món đăng nhiều group chỉ hiện một lần.
- Người dùng **tự đăng** tin lên trang; tin tự đăng được trình bày tốt hơn tin gom.
- Liên hệ người bán bằng **một cú bấm** (Messenger), không cần join nhóm.

## 4. Phi mục tiêu (non-goals) lần này

- Không thanh toán trong app.
- Không chat nội bộ thay Messenger.
- Không join nhóm / không làm mạng xã hội.
- Không game / đấu giá.

## 5. Phản mục tiêu (anti-goals)

- Thành bản sao Facebook Groups (join + đăng trong nhóm).
- Tin trùng ngập lặp lại.
- Model tạp, không lọc/sắp xếp được.
- Có tính năng nhưng không giải được "tìm nhanh".

## 6. Người dùng

- **Người mua** săn đồ cũ / giá tốt.
- **Người bán cá nhân** muốn một trang bán hàng gọn để chỉ khi ai hỏi "đang bán gì".
- (sau này) người bán chuyên nghiệp.

## 7. Nền tảng dữ liệu (foundation)

- **Một model tin duy nhất** `listings` (tái dùng/đổi ngữ nghĩa bảng `products`) gồm:
  - `source`: `fb` | `user`
  - `title`, `description`, `images`
  - `price` (số), `currency`
  - `location` (tỉnh/quận), `category`, `condition`
  - `seller_contact` (link Messenger), `source_url`
  - `posted_at`, `scraped_at`
  - `canonical_id` / `dedup_key`, `seen_in_groups` (nguồn/nơi thấy)
  - giữ `user_id`, `status`, soft-delete `deleted_at`
- **Phát hiện quan trọng:** bảng `products` hiện **thiếu** `price`, `location`, `condition`, `category`-trên-tin → đây là lý do không thể "thêm nhẹ", lõi dữ liệu phải làm lại.
- **Chuẩn hoá kiểu Việt**: giá (`3tr5`, `3500k`, `3.500.000` → số); khu vực (`Q7` / `Quận 7` / `HCM`); tách model từ chữ tạp.
- **Gộp trùng**: khoá theo (model + giá gần + người bán + ảnh) → 1 tin, hiện "đã thấy ở N group".

## 8. Phạm vi lần này (GĐ1+2)

### 8.1 Cổng thông tin
- Feed tin (gom + tự đăng) — dùng `UniversalCard`.
- **Lần này lưu tối thiểu cho tin gom: `title` + `price` + `source_url` + nhóm nguồn.** Chi tiết/liên hệ → bấm sang Facebook. (Đủ cho search; rủi ro bản quyền thấp.)
- Ảnh: tin gom dùng **placeholder** (không lấy ảnh Facebook) — đơn giản, nhẹ rủi ro, bỏ bước `og:image`.
- Tìm kiếm + lọc: danh mục, giá, khu vực, tình trạng (tin gom lần đầu có thể chỉ có danh mục + giá; khu vực/tình trạng bổ sung cùng tin tự đăng).
- Trang chi tiết tin → nút **"Xem trên Facebook"** (link gốc) và **"Nhắn người bán"** khi có handle (`m.me`).

### 8.2 Tự đăng
- Form đăng tin (giá, khu vực, tình trạng, danh mục, ảnh).
- Người dùng dán link bài FB → hệ thống lấy về + chuẩn hoá.

### 8.3 Card & tin cậy
- Card biến thể: **tin gom** / **tin tự đăng** / **verified** (nhìn khác nhau).
- **Verify = SĐT + CCCD**: SĐT qua OTP (cần nhà cung cấp SMS); CCCD upload + duyệt.
- Verify mở: huy hiệu + card riêng (+ ưu tiên hiển thị — chờ chốt).

### 8.4 Profile = trang bán hàng
- Banner, avatar, mô tả, lưới tin, huy hiệu verified.
- Chia sẻ được bằng link; chỉnh sửa tốt ("đang bán gì → chỉ link").

## 9. Dọn dẹp code

- **Cắt:** Arena (`src/app/arena`, ~1.115 dòng) · Auction (`src/app/auction`, ~295 dòng).
- **Community** → chỉ còn **nhãn nguồn** trên tin; bỏ join/chat/kiểm duyệt/online/chi nhánh dùng cho mạng xã hội.
- **Giữ:** tin (`products`), `UniversalCard`, `Search`, `ProductsList`, `Discover`, auth, `profile`, layout/theme.

## 10. Quyết định người dùng đã chốt

- Một model tin, có `source`.
- `group` = nhãn nguồn, không phải chỗ để join.
- Không thanh toán, không join, không chat nội bộ.
- GĐ1+2 gộp chung làm một lần.

## 11. Quyết định của builder (t tự chốt — bạn check)

- Tái dùng bảng `products` và đổi ngữ nghĩa thành tin đa nguồn (thay vì tạo bảng mới) — giữ UI/relationships đang có.
- Card dùng cùng `UniversalCard` + biến thể.
- **Danh mục + tỉnh/quận**: dùng danh sách cố định trước (VN); chuyển sang admin quản lý sau.
- **Ảnh**: tải lại ảnh Facebook về Supabase Storage (URL CDN của FB hết hạn + chặn hotlink).
- **"Nhắn người bán"**: dùng handle Messenger nếu có; nếu không → mở link bài gốc trên Facebook.
- **Nhập dữ liệu (ingest)**: bot ghi vào **bảng staging (raw)** → job server chuẩn hoá + gộp trùng → `listings`. Chống trùng bằng `source_url` unique + upsert (idempotent, cào lại không nhân bản). Bot **không** dùng `service_role` nếu tránh được — dùng key riêng giới hạn vào schema staging. Đừng nhét logic chuẩn hoá vào bot; giữ 1 chỗ.

## 12. Còn chờ bạn (cần bạn trả lời — xếp theo thứ tự quan trọng)

1. **Dữ liệu Facebook vào bằng đường nào.** Bot cào của bạn chạy ở đâu, xuất ra cái gì, và việc nối nó vào Nexloot có nằm trong lần này không?
2. **Dán link bài FB thì hệ thống làm gì.** Facebook chặn lấy nội dung bài (login wall). Vẫn giữ "dán link → tự lấy về", hay đổi thành tự nhập tay / dùng extension?
3. **CCCD: lưu ở đâu, ai duyệt, giữ bao lâu, cơ sở pháp lý** — hay tạm hoãn verify ID ở lần này?
4. **Nhà cung cấp SMS cho OTP** (số Việt Nam thường cần eSMS/SpeedSMS/Zalo ZNS…).
5. **Tin tự đăng: hiện ngay hay chờ duyệt?**
6. **Lợi ích verified**: chỉ huy hiệu/ưu tiên hiển thị, hay còn là điều kiện để bán/thanh toán về sau?
7. **Tiêu chí "xong"** của lần này — đo bằng gì.
8. **Giữ dữ liệu production đang có không** (users/tin đang chạy trên Vercel)?
9. **"Sàn thông tin" (GĐ3) khác "sàn điện tử" (GĐ4) ở đâu.**

## 13. Việc để builder lên kế hoạch

- Migration bổ sung cột cho tin + `source`.
- Pipeline chuẩn hoá + gộp trùng (từ scraper + từ link người dùng dán).
- UI feed / tìm / lọc / chi tiết + "Nhắn người bán".
- Form tự đăng.
- Verify SĐT + CCCD.
- Profile trang bán hàng.
- Cắt arena/auction; thu gọn community.

---

## 14. Kiến trúc code & nền tảng (đề xuất của builder — bạn có thể đổi)

- **Không chuyển sang Expo.** Web (Next.js) là mặt tiền chính của cổng thông tin → người ta tìm bằng Google; Expo web SEO/SSR yếu → mất khả năng được tìm thấy. Và repo đã có Next.js + Supabase chạy thật.
- **Hình dạng đề xuất (monorepo, lớn dần):**
  - `apps/web` — Next.js (code hiện tại): feed, tìm/lọc, SEO.
  - `packages/core` — types + truy vấn Supabase + logic chuẩn hoá, dùng chung.
  - `services/ingest` — worker scraper + chuẩn hoá + gộp trùng (tách khỏi Next; cron/VPS/queue).
  - `apps/mobile` — Expo, **để sau**, dùng chung Supabase.
- **Mobile ngắn hạn = PWA** (Next.js gần đủ): cài được, không cần app store, không viết lại.
- **Chỉ làm Expo khi cần native thật** (push, camera, offline) — khi đó vẫn giữ song song, không thay thế.

## 15. Ràng buộc pháp lý (constraint — nên hỏi luật sư VN)

"Cổng thông tin" **giảm** nghĩa vụ về giao dịch/thanh toán, **nhưng không hết**. Tách cho đúng chỗ:

1. **Dán link / liên kết** bài gốc: **an toàn** — linking không vi phạm bản quyền.
2. **Thu thập tự động (bot/cào)**: *đây* mới là chỗ vi phạm điều khoản Meta (cấm phương tiện tự động thu thập dữ liệu). Hậu quả thực tế với dự án nhỏ: **khoá bot / ban tài khoản FB / chặn IP** — hiếm khi ra toà (Meta nhắm bên cào lớn; từng thua Meta v. Bright Data 2024). **Cách chạy đã chọn: công khai, không đăng nhập, tốc độ chậm** → rủi ro ban thấp nhất (không có tài khoản để khoá); nhưng Facebook thường dựng **login wall** cho cả nội dung công khai → **độ phủ có thể thấp**, và đổi lại **sản lượng thấp** — phải kiểm chứng thực tế, vì cổng thông tin cần nhiều tin mới hữu ích.
3. **Bóc tách & lưu nội dung** (tiêu đề, giá, khu vực, ảnh) để search/lọc/gộp: đây là chỗ **bản quyền + dữ liệu cá nhân**. Mâu thuẫn: chỉ giữ URL thì không search/lọc/gộp/định giá được → không thành cổng thông tin; nên buộc phải bóc field → cần ghi nguồn + link về bài gốc + kênh xoá theo yêu cầu.
4. **Dữ liệu cá nhân** (tên, SĐT, link FB người bán) → bên xử lý; VN có Nghị định 13/2023/NĐ-CP + Luật Bảo vệ dữ liệu cá nhân. Dữ liệu công khai vẫn tính.
5. **Ngưỡng "sàn TMĐT"**: cho user đăng tin có giá + liên hệ có thể bị coi là sàn TMĐT (Nghị định 52/2013, sửa bởi 85/2021) → nghĩa vụ thông báo/đăng ký.
6. **Nội dung do user đăng** → nghĩa vụ gỡ nội dung vi phạm.

---

## 16. Đánh giá thẳng (kế hoạch này có ổn không?)

**Hướng đi: ổn.** Có nỗi đau thật, sản phẩm rõ, và bạn đã có sẵn phần khó nhất (bot + app).

**Kế hoạch: ổn về hướng, nhưng có 1 rủi ro phải dẹp TRƯỚC, và vài chỗ nên đổi:**

1. **Sản lượng dữ liệu.** Bot mới ở mức **demo**, **chưa đo sản lượng tin**. Người dùng tự tin làm được → coi là **xác minh trong lúc build**, không chặn. (Ghi chú: con bot "kiểm tra người Hà Nội" là **việc khác**, không liên quan và **không cần** trong lần này.)
2. **Bot ghi thẳng Supabase → cần staging + chống trùng.** (đã chốt ở §11). Đừng để bot ôm logic chuẩn hoá.
3. **Gộp GĐ1+2 làm to lần đầu.** Cân nhắc **ra portal trước, tự đăng sau**. Bước nhảy "vì sao đăng ở đây thay vì Facebook" *chưa* có câu trả lời.
4. **Verify SĐT+CCCD nặng** (nhà cung cấp SMS + PII + duyệt). Đừng để nó **chặn** portal.
5. **Phụ thuộc 1 kênh.** Cào Facebook có thể bị chặn bất cứ lúc nào → phải có đường khác (user đăng / extension) — chính là lý do GĐ2 quan trọng.
6. **Chưa có tiêu chí "xong"** và GĐ3/GĐ4 còn mờ. Ổn cho bây giờ, nhưng phải chốt trước khi đầu tư lớn.

**Kết luận:** *Không build gì lớn cho tới khi đo được sản lượng bot.* Nếu sản lượng đủ → kế hoạch tốt, đi tiếp.
