# Nghiên cứu: Quản lý OTA + Trang MXH sale phòng khách sạn nhỏ tại Việt Nam
*Phục vụ quyết định MVP (Window app vs Web + Mobile app) — Repo hiện tại: Next.js (`nexloot`)*

Ngày: 2026-10-17. Tiếng Việt, ngắn gọn, tập trung ra MVP.

> Nguyên tắc: chủ dự án chưa từng dùng tool OTA, chưa rõ user. File này chỉ tổng hợp từ nguồn chính thống (primary sources) + thực tế VN. Mỗi mục quan trọng đều có link.

---

## 1. Tổng quan

- Khách sạn vừa/nhỏ, homestay ở VN bán phòng qua 2 nhóm kênh song song:
  1. **OTA**: Booking.com, Agoda, Expedia, Traveloka, Airbnb, Google Hotel (metasearch). Khách quốc tế → Booking/Agoda/Expedia/Airbnb; khách nội + ĐNA → Agoda/Traveloka + Facebook/Zalo.
  2. **MXH / direct**: Facebook Page + Messenger, Zalo OA / Zalo cá nhân, TikTok, Instagram. Đăng bài → inbox/comment → chốt → giữ phòng thủ công.
- Nỗi đau lớn nhất: **overbooking / lệch giá / lệch tồn phòng** khi cập nhật thủ công trên nhiều extranet + sổ/inbox, và **sót inbox** giờ cao điểm.
- Không có đường tắt: OTA lớn **không cho khách sạn đơn lẻ gọi API trực tiếp**. Bắt buộc đi qua **Channel Manager / Connectivity Partner được chứng nhận**. Đây là quyết định kiến trúc quan trọng nhất cho MVP.
  - Booking.com: "We don't accept direct connections from individual properties right now, but you can connect via a channel manager" — [Booking.com Connectivity Portal](https://connect.booking.com), và đang "pausing integrations with new connectivity providers" — [connect.booking.com](https://connect.booking.com).
  - Airbnb: "Authorize the Channel Manager software onto your Airbnb account" / "Some of our preferred Channel Manager software partners include SynXis, Guesty and SiteMinder" — [Airbnb Help](https://www.airbnb.com/help/article/3304). API chỉ cho partner được duyệt, host phải là Professional Host, kết nối qua OAuth — [Comparatif Channel Manager](https://comparatifchannelmanager.fr/en/airbnb-api-and-channel-managers). Small startup (<200 properties) thực tế không xin được API riêng — [Realtevo Blog](https://realtevoos.com/blog/airbnb-api-access).

**Hệ quả cho MVP:** đừng plan "tự tích hợp API Booking/Airbnb trực tiếp". MVP chỉ có 3 lựa chọn khả thi:
  a) Làm **PMS mini + đồng bộ thủ công/bán tự động** (import iCal, copy giá/phòng, pull booking về),
  b) Tích hợp qua **Channel Manager có sẵn / white-label** (Rentals United, SiteMinder, STAAH...),
  c) Làm **mảng MXH + vận hành nội bộ trước** (lịch phòng, giá, inbox tập trung), OTA tính sau.

---

## 2. OTA phổ biến ở VN: kết nối, chính sách, hoa hồng

### 2.1 Booking.com
- Cách kết nối:
  - Chủ nhà dùng **Extranet** thủ công, hoặc bật **Account > Channel Manager** để ủy quyền cho provider — [Booking.com for Partners](https://partner.booking.com/en-us/help/first-steps/online-bookable/setting-and-working-connectivity-provider).
  - Provider dùng **Connectivity APIs**: Rates & Availability (sync tồn + giá trong vài giây), Content & Images (tạo/sửa property, mô tả, ảnh), Promotions (giá khuyến mãi) — [About Connectivity APIs](https://developers.booking.com/connectivity/docs), [Developers.booking.com](https://developers.booking.com).
  - Format XML/JSON qua `supply-xml.booking.com`, auth JWT, yêu cầu IP allowlist — [Connectivity docs](https://developers.booking.com/connectivity/docs).
- Hoa hồng: trả theo % trên tổng booking (gồm giá phòng + phí thêm như cleaning/breakfast, cả no-show/cancellation tùy thỏa thuận). % ghi trong accommodation agreement / tab Finance, phụ thuộc quốc gia + loại property — [Booking.com for Partners - Commission](https://partner.booking.com/en-us/help/commission-invoices-tax/invoices/understanding-your-commission).
  - Trung bình toàn cầu ~15%, biên 10–25% — [Guesty](https://www.guesty.com/blog/how-much-does-booking-com-charge-hosts), [PriceLabs](https://hello.pricelabs.co/blog/booking-com-fees), [Cloudbeds OTA Commissions 2026](https://www.cloudbeds.com/online-travel-agencies/commissions).

### 2.2 Expedia Group (Expedia, Hotels.com, Vrbo...)
- 2 họ API khác nhau, đừng nhầm:
  - **Demand (EPS Rapid API)**: dành cho bên muốn *bán lại* inventory của Expedia (làm OTA/mini-OTA). REST JSON, search/pricing/booking/cancel. Không mất phí API upfront, ăn chia theo Expedia Collect (15–25%) hoặc net-rate markup — [ZentrumHub Guide 2026](https://www.zentrumhub.com/blog/expedia-rapid-hotel-api-integration), [Expedia Rapid API](https://partner.expediagroup.com/en-us/solutions/build-your-travel-experience/rapid-api), [Developer Hub](https://developers.expediagroup.com/docs).
  - **Supply / Connectivity Hub (EQC)**: dành cho PMS/Channel Manager đẩy phòng/giá lên Expedia. Phải adopt 3 APIs, giới hạn 5.000 updates/message, yêu cầu PCI DSS AOC hàng năm — [EG Connectivity Hub - What's new](https://developers.expediagroup.com/supply/lodging/updates), [Connectivity Docs](https://connectivityportal.expediagroup.com/documentation/expedia/avail_and_rate_apis/avail_rates/concepts), [Welcome Hub](https://developers.expediagroup.com/supply/lodging).
- Hoa hồng supply biên 10–30% tùy thị trường/hợp đồng — [PriceLabs so sánh](https://hello.pricelabs.co/blog/booking-com-fees), [SmartOrder OTA rates](https://www.smartorder.ai/resources/blog/the-complete-guide-to-ota-commission-rates).

### 2.3 Agoda (mạnh nhất châu Á, rất quan trọng ở VN)
- Chủ nhà quản lý qua **YCS / Partner Portal (PartnerHub)**; bật channel manager trong portal + map IDs — [Agoda PartnerHub](https://partnerhub.agoda.com/how-do-i-manage-my-channel-manager-connection).
- Channel 2 chiều chuẩn: bookings, availability, rates, policies, photos/content, promotions, extras/fees — [eviivo Agoda Connection](https://eviivo.com/products/channel-manager/agoda-connection).
- Hoa hồng ước tính ngành 15–25%, ví dụ tính toán của Agoda dùng 20% (minh họa, không phải rate chung) — [SmartOrder](https://www.smartorder.ai/resources/blog/the-complete-guide-to-ota-commission-rates). Chốt số thực trong YCS + hợp đồng.

### 2.4 Traveloka (khách nội + ĐNA)
- Chủ nhà dùng **TERA (Traveloka Extranet Reservation System)** trên web + mobile app, nhận notif booking, quản lý giá/tồn — [TERA Register](https://tera.traveloka.com/partner), [TERA App](https://apps.apple.com/my/app/traveloka-tera-for-partners/id1320732763), [Little Hotelier TERA guide](https://www.littlehotelier.com/blog/get-more-bookings/tera-traveloka).
- Phân biệt **Hotel Collect vs Channel Collect** (khách trả cho KS hay cho kênh), cấu hình thuế/phí/hoa hồng riêng — [Cloudbeds Traveloka Connect](https://myfrontdesk.cloudbeds.com/hc/en-us/articles/360011826673-Connect-Traveloka-to-Cloudbeds-PMS). Không hỗ trợ MinLOS/MaxLOS từ PMS — hỏi Account Manager, set trực tiếp trên extranet.
- Muốn bán lại inventory Traveloka: qua **Traveloka Partners Network (TPN)** — Direct API / via certified switch / Webview / Agent Web — [TPN](https://www.travelokapartnersnetwork.com). Khách sạn nhỏ không cần TPN, chỉ cần TERA + channel manager.

### 2.5 Airbnb
- Không onboarding API partner mới ồ ạt; team Airbnb chủ động liên hệ dựa trên giá trị supply — [AltexSoft Hotel API](https://www.altexsoft.com/blog/hotel-api).
- Thực tế cho MVP: bắt buộc qua channel manager được duyệt. Yêu cầu vận hành gần real-time (webhook availability), SLA response-time ảnh hưởng ranking — [Rentals United White-label guide](https://rentalsunited.com/blog/what-is-a-white-label-channel-manager-api).
- Phí: split-fee (host ~3%, guest 13–20%) hoặc host-only 14–16% — [PriceLabs](https://hello.pricelabs.co/blog/booking-com-fees).

### 2.6 Google Hotel (Free Booking Links + Hotel Ads) — cơ hội direct rẻ nhất
- **Free Booking Links**: hiển thị link đặt trực tiếp (kèm badge "Official Site") trên Search/Maps/Hotel, **không mất phí click/booking**, xếp hạng theo độ hữu ích + độ chính xác giá, không phải đấu giá — [Google Hotel Center Help](https://support.google.com/hotelprices/answer/10472393?hl=en), [Blastness](https://www.blastness.com/en/resources/google-free-booking-links).
- **Hotel Ads**: trả tiền theo CPC hoặc CPS, xếp hạng theo đấu giá — [OneClick Guide 2026](https://www.oneclickitsolution.com/blog/google-hotel-api).
- Kỹ thuật: cùng dùng **Travel Partner API (Hotel Prices) price feed**, API miễn phí nhưng phải là partner được duyệt + feed chính xác; KS nhỏ thường đi qua **Integration Partner / Booking Engine** (ví dụ Hotel Link, Blastness) thay vì tự feed — [Google Travel Partner API](https://developers.google.com/hotels/hotel-prices/api-reference/rest), [HotelLink Solutions](https://help.hotellinksolutions.com/what-is-google-free-booking-links).

**Kết luận OTA cho MVP:**
- Đừng hứa "đồng bộ 2 chiều Booking/Agoda/Airbnb real-time" nếu chưa có tư cách connectivity partner. Đó là việc 6–12 tháng + pháp lý + PCI + duy trì API.
- MVP thực tế: **quản trị ARI nội bộ (Availability-Rates-Inventory) 1 nguồn sự thật + push thủ công/hỗ trợ + pull booking + iCal sync** cho Airbnb/Booking, và **làm direct qua Google Free Booking Links + booking engine** để giảm hoa hồng.

---

## 3. PMS / Channel Manager hiện tại làm gì, giá bao nhiêu

### 3.1 Tính năng lõi (mọi ông đều có)
1. **ARI trung tâm**: calendar tồn phòng theo room-type/rate-plan, giá theo ngày/mùa, restrictions (Closed, CTA/CTD, MinLOS/MaxLOS).
2. **2-way sync**: đẩy ARI lên OTA, kéo booking/cancel/modify về; alert khi lệch/failed.
3. **PMS**: lễ tân, folio, housekeeping, night audit, báo cáo ngày/doanh thu.
4. **Booking engine + payments**: web đặt trực tiếp, Hotel Collect/Expedia Collect.
5. **Distribution**: 200–500+ OTA connections (SiteMinder 450+, Cloudbeds 450+, STAAH 2.000+ claim) — [SiteMinder](https://www.siteminder.com/partner/cloudbeds), [Cloudbeds Channel Manager](https://www.cloudbeds.com/channel-manager), [RateGain 2026](https://rategain.com/blog/best-channel-managers-for-independent-hotels).

Ví dụ mapping chi tiết: Cloudbeds ↔ SiteMinder hỗ trợ Advanced Rates, Restrictions, Close Days, CTA/CTD, Min/Max LOS, credit cards, cancel/modify; *không* hỗ trợ Booking Cutoffs, Last-minute — [Cloudbeds Help](https://myfrontdesk.cloudbeds.com/hc/en-us/articles/27471074990235-Connect-SiteMinder-to-Cloudbeds-PMS).

### 3.2 Mô hình giá (để định giá MVP)
- **SiteMinder**: channel manager từ ~$75/tháng, scale theo số kênh + tính năng — [Quora/TraveltekPro](https://traveltekpro.com/siteminder-vs-cloudbeds-step-by-step-comparison).
- **Cloudbeds**: bundle PMS + channel + booking engine trong 1 gói, lợi cho nhỏ/vừa — [TraveltekPro](https://traveltekpro.com/siteminder-vs-cloudbeds-step-by-step-comparison).
- **STAAH**: mạnh APAC (Agoda, MakeMyTrip, Traveloka), giá theo ngân sách APAC — [RateGain](https://rategain.com/blog/best-channel-managers-for-independent-hotels).
- **Yanolja Cloud (mới, giá công khai)**: Essential $80/tháng, Growth $148/tháng cho 1–5 phòng (gồm PMS+CM+booking engine+payments) — [YCS Pricing](https://yanoljacloudsolution.com/pricing).
- **Ezee**: từ $29/tháng — [Ezee Pricing](https://www.ezeecentrix.com/pricing.php).
- **VN**: **ezCloud** (founder Hoàng Nguyễn Dương — [LinkedIn](https://vn.linkedin.com/in/duong-nguyen-hoang-314a9528)), **KiotViet Hotel** ("đồng bộ mọi kênh bán phòng online trên một phần mềm duy nhất" — [KiotViet](https://www.kiotviet.vn/quan-ly-kenh-ban-phong-online-tren-mot-phan-mem-duy-nhat)), **GoHost** ("quản lý bán phòng trên các kênh OTA rất hiệu quả" — [GoHost](https://gohost.vn/giai-phap/quan-ly-homestay)), **Bado** (đa kênh chống overbooking — [Bado](https://bado.vn/quan-ly-dat-phong-da-kenh-chong-overbooking)). Giá VN thường thấp hơn global, bán theo số phòng + on-premise/cloud — cần báo giá trực tiếp, không có giá public chuẩn.

**Bài học:** thị trường đã có giải pháp rẻ cho ARI+PMS. MVP của mình chỉ có cửa nếu **đánh vào MXH-sale + vận hành VN** (Facebook/Zalo/TikTok inbox tập trung + giữ phòng nhanh), chứ đừng clone channel manager.

---

## 4. "Quản lý các trang MXH sale phòng": thực tế + API + giới hạn

### 4.1 Thực tế chốt đơn ở KS/homestay nhỏ VN
- Kênh: Facebook Page, Zalo OA/Zalo cá nhân, TikTok, Instagram. Chiến lược direct booking chuẩn là tối ưu website + MXH để khách đặt trực tiếp — [SEO TopMap](https://seotopmap.com/cac-kenh-ban-phong-cho-nha-nghi).
- Flow phổ biến: đăng bài/video phòng trống, giá cuối tuần → khách comment/inbox → hỏi ngày, giá, ảnh thật → chốt → chuyển khoản cọc → ghi sổ/Excel → cập nhật tay trên OTA/extranet.
- Lỗi hay gặp: sót inbox, báo giá chậm, trùng lịch (đặc biệt cuối tuần/lễ), không biết phòng nào còn thật.
- Tool VN đã đánh vào: KiotViet/GoHost/Bado (mục 3.2). Nhu cầu thuê freelancer "setup & vận hành OTA" rất nhiều trên group Facebook — tín hiệu thị trường cần tool đơn giản hơn là thiếu tool xịn.

### 4.2 Facebook Page + Messenger (ưu tiên #1 cho MVP MXH)
- **Graph API** là đường chính để đọc/ghi social graph (HTTP, node/edge/field), version mới nhất v26.0 — [Overview](https://developers.facebook.com/docs/graph-api/overview), [Graph API](https://developers.facebook.com/docs/graph-api).
- Đăng bài: `POST /{page-id}/feed`; đọc/gửi inbox: `GET /{page-id}/conversations`, `POST /{page-id}/messages` — [Page Reference](https://developers.facebook.com/docs/graph-api/reference/page), [Messenger Get Started](https://developers.facebook.com/documentation/business-messaging/messenger-platform/get-started).
- Điều kiện bắt buộc:
  - Business Manager + sở hữu Page (admin), Business Verification (giấy tờ thuế, domain), tạo Developer App.
  - Xin quyền `pages_show_list`, `pages_messaging` (+ `MESSAGING`), qua **App Review** (screencast, tài khoản test). Messenger bot review ~3 ngày, Login/Pages API từng trung bình 7 tuần — [Click4Assistance Guide](https://www.click4assistance.co.uk/facebook-messenger-for-business-api), [Meta App Review Deadlines](https://developers.facebook.com/ads/blog/post/v2/2018/10/11/app-review-deadlines-reminder), [Forum pages_messaging](https://developers.facebook.com/community/threads/408465430060465).
  - Tuân thủ **Messenger/IG Policy** (cập nhật 2026-09-28) — [Policy](https://developers.facebook.com/documentation/business-messaging/messenger-platform/policy), gồm 24h messaging window, tag/message type.
- Kết luận: làm được **unified inbox + auto-reply + gắn hội thoại vào booking**, nhưng phải tính 2–6 tuần làm verification/review. Demo dev-mode chỉ chạy với admin/tester.

### 4.3 Zalo OA (ưu tiên #2, bắt buộc ở VN)
- Zalo là super-app của VNG, ~thống trị chat VN — [Infobip Guide](https://www.infobip.com/blog/zalo-business).
- OA có 3 hạng Good/Medium/Low theo tỉ lệ bị report; hạng quyết định quota gửi. Gửi promo phải duyệt template từng mẫu — [Infobip](https://www.infobip.com/blog/zalo-business).
- Giới hạn kỹ thuật hay gặp:
  - DM-only (không group như Bot API), text 2.000 ký tự/message, ảnh 5MB, webhook body 1MB, 120 req/60s — [OpenClaw Zalo](https://docs.openclaw.ai/channels/zalo), [goclaw-docs](https://github.com/nextlevelbuilder/goclaw-docs/blob/master/channels/zalo-oa.md).
  - Chỉ gửi consultation nếu khách đã tương tác trong 7 ngày, reply trong 48h đầu miễn phí; hết window trả 422 — [SocialAPI.ai](https://social-api.ai/platforms/zalo).
  - Zalo cá nhân free bị bóp: tối đa 1.000 contacts, 40 lượt reply người lạ/tháng, 40 lượt hiển thị tìm kiếm SĐT/tháng; gói Business 84k–1,65tr VNĐ/tháng — [VnExpress](https://e.vnexpress.net/news/news/zalo-subscription-fees-to-add-little-benefit-alienate-free-account-holders-4494939.html).
- Kết luận: MVP nên làm **kết nối Zalo OA (polling/webhook) + ZNS qua Infobip/đối tác**, đừng cố scrape Zalo cá nhân (vi phạm + dễ khóa).

### 4.4 TikTok / Instagram
- **TikTok Content Posting API**: Direct Post cần scope `video.publish`, unaudited chỉ post `SELF_ONLY` (private) + tối đa 5 users/24h; audited mới public. Cap ~15 posts/ngày/creator (chia sẻ giữa mọi client), 6 req/phút/token — [Direct Post](https://developers.tiktok.com/doc/content-posting-api-reference-direct-post), [Guidelines](https://developers.tiktok.com/doc/content-sharing-guidelines), [Rate Limits](https://www.getphyllo.com/post/tiktok-api-rate-limits-in-2026-quotas-errors-workarounds).
- **TikTok Business Messaging API**: DM, retrieval, media, Comment-to-Message, webhook — nhưng eligibility theo account/region, phải check docs messaging riêng — [Salewisely](https://www.salewisely.com/blog/tiktok-business-messaging-api), [TikTok Business API Portal](https://business-api.tiktok.com/portal).
- **Instagram**: quản lý qua Graph/Messenger API tương tự Facebook (business/creator account, publish posts/stories, comment, messaging). Không có inbox mở như Zalo.
- Kết luận: TikTok/IG ở MVP chỉ nên làm **đăng bài nháp + theo dõi comment để tạo lead**, đừng hứa auto-inbox full.

---

## 5. So sánh nền tảng: Window app vs Web + Mobile app

| Tiêu chí | Window app (WPF/WinForms/Electron) | Web + Mobile (Next.js sẵn có + PWA/App) |
|---|---|---|
| Cài đặt / onboarding | Nặng: cài từng máy lễ tân, quyền admin, update tay | Nhẹ: mở link là chạy, update 1 lần trên server. Lợi thế lớn với chủ nhỏ không rành IT |
| Đa điểm / chuỗi | Khó đồng bộ nhiều chi nhánh, ca trực | 1 nguồn sự thật, nhiều lễ tân/cơ sở cùng xem lịch |
| Đồng bộ OTA/MXH | Khó duy trì webhook, IP allowlist, cert; máy tắt là mất sync | Server chạy 24/7, nhận webhook Booking/Expedia/Messenger/Zalo/TikTok chuẩn |
| Bảo trì / chi phí | Fork version, hỗ trợ Windows 7/10/11, driver máy in; rẻ server nhưng đắt support | Tốn server (Vercel/Supabase đã có), nhưng 1 codebase Next.js tái dùng web/mobile |
| Offline | Mạnh khi mất mạng (lưu local) | Cần design offline-first (PWA cache + queue sync); làm được nhưng tốn công |
| Phần cứng | Dễ gắn két, khóa từ, máy in bill | Vẫn gọi được qua print API / ESPOS, hoặc giữ 1 mini-agent Windows chỉ để in |
| Bảo mật | Token nằm trên máy khách, dễ lộ | Token ở server, phân quyền, audit log |

**Khuyến nghị cho team Next.js sẵn có:**
- **Chọn Web-first (Next.js + Supabase đã có trong repo) + PWA cho điện thoại**, không làm Window app native làm lõi.
- Nếu lễ tân cần in bill/mở két offline: làm **1 companion Windows tí hon sau** (chỉ in + cache), lõi vẫn là web.
- Lý do quyết định: OTA/MXH đều webhook/API cloud; Window app tắt máy là gãy sync — đúng nỗi đau overbooking. Web cho phép unified inbox + lịch tập trung + phân quyền ca trực, thứ mà Window app đơn máy không làm được.
- Chi phí: tận dụng Vercel + Supabase, PWA thay cho 2 app native ở MVP → ra nhanh nhất, test được với 5–10 homestay trước khi đầu tư app store.

---

## 6. Persona & Jobs-to-be-done (homestay / KS nhỏ VN)

### Persona 1 — Chị Lan, 32t, chủ 5–12 phòng (Đà Lạt/Hà Nội/Hội An)
- Dùng: 1 Facebook Page, 1–2 Zalo cá nhân + 1 OA, listing trên Booking/Agoda/Airbnb (nhờ người setup), sổ/Excel.
- JTBD: "Cuối tuần không bị trùng phòng, báo giá trong 5 phút kể cả khi đang đi chợ". Sợ nhất overbooking + đánh giá 1 sao.
- Sẵn sàng trả nếu: inbox dồn 1 chỗ, bấm 2 nút là giữ phòng + chặn lịch các kênh khác.

### Persona 2 — Anh Tuấn, 40t, quản lý 20–40 phòng, 2 cơ sở
- Dùng: ezCloud/KiotViet hoặc Excel, TERA Traveloka + extranet Booking, nhân viên ca.
- JTBD: "Nhìn 1 màn hình biết hôm nay còn gì, giá nào, ai trực, tiền về đâu". Cần phân quyền, ca, báo cáo ngày, đối soát hoa hồng 15–25%.
- Sẵn sàng trả nếu: giảm 50% giờ nhập tay + hết lệch số liệu.

### Persona 3 — Bạn sale/CTV freelancer
- Dùng: điện thoại, Facebook/TikTok, nhận % hoa hồng.
- JTBD: "Lấy được giá/tồn real-time để chốt ngay trong comment/inbox, không phải gọi chủ".
- Sẵn sàng dùng nếu: có link/share phòng + bảng giá live + tạo booking giữ chỗ nhanh.

### JTBD chung (xếp theo đau nhất)
1. Khi khách hỏi → biết **còn/trống + giá chốt** trong <1 phút.
2. Khi chốt → **giữ phòng 1 lần, mọi nơi đều chặn** (chống trùng).
3. Khi có booking OTA → **tự đổ về 1 lịch**, không nhập lại.
4. Khi đổi giá cuối tuần/lễ → **đổi 1 chỗ**, không phải sửa 4 extranet.
5. Cuối ngày → biết **lấp đầy, doanh thu, hoa hồng**.

---

## 7. Khuyến nghị MVP (làm trước / làm sau)

**Làm trước (4–6 tuần, Web + PWA):**
1. **Lịch & tồn phòng trung tâm (ARI-lite)**: phòng, loại phòng, giá theo ngày, chặn/mở, MinLOS cơ bản. Đây là nền cho mọi sync sau.
2. **Unified inbox lite**: Facebook Page + Zalo OA (đọc + trả lời + gắn hội thoại → tạo giữ chỗ). Đây là khác biệt so với PMS thuần.
3. **Tạo giữ chỗ trong 30 giây**: từ inbox hoặc lịch → chọn ngày → giữ → tự trừ tồn → sinh link cọc/thông tin CK.
4. **Import/pull booking**: iCal Airbnb/Booking + CSV extranet + nhập tay; cảnh báo trùng.
5. **Báo cáo ngày**: lấp đầy, doanh thu, nguồn (OTA/direct/MXH).

**Làm sau (khi có 5–10 KS trả tiền):**
- Push ARI 2 chiều qua channel manager đối tác / white-label (đừng tự build connector).
- Google Free Booking Links via booking engine để lấy direct.
- Auto-reply/bot giá + template Zalo duyệt sẵn, TikTok draft-post.
- Companion Windows để in bill/offline, app native nếu PWA không đủ.

**Không làm ở MVP:** tự xin Booking/Airbnb API trực tiếp, TikTok auto-inbox full, kế toán/thuế full, multi-property phức tạp.

**Validation rẻ nhất tuần tới:** phỏng vấn 5 chủ (hỏi 3 số: % booking từ MXH vs OTA, số lần overbooking/3 tháng, thời gian chốt inbox trung bình), cho dùng thử lịch + inbox tập trung trên web, đo có giảm sót/trùng không.

---

## 8. Nguồn (primary sources ưu tiên)

**Booking.com:**
- https://connect.booking.com
- https://developers.booking.com / https://developers.booking.com/connectivity/docs
- https://partner.booking.com/en-us/help/first-steps/online-bookable/setting-and-working-connectivity-provider
- https://partner.booking.com/en-us/help/commission-invoices-tax/invoices/understanding-your-commission

**Expedia:**
- https://developers.expediagroup.com/supply/lodging
- https://developers.expediagroup.com/supply/lodging/updates
- https://connectivityportal.expediagroup.com/documentation/expedia/avail_and_rate_apis/avail_rates/concepts
- https://partner.expediagroup.com/en-us/solutions/build-your-travel-experience/rapid-api
- https://developers.expediagroup.com/docs

**Agoda / Traveloka / Airbnb / Google:**
- https://partnerhub.agoda.com/how-do-i-manage-my-channel-manager-connection
- https://tera.traveloka.com/partner , https://www.travelokapartnersnetwork.com
- https://myfrontdesk.cloudbeds.com/hc/en-us/articles/360011826673-Connect-Traveloka-to-Cloudbeds-PMS
- https://www.airbnb.com/help/article/3304
- https://support.google.com/hotelprices/answer/10472393?hl=en , https://developers.google.com/hotels/hotel-prices/api-reference/rest

**PMS/CM:**
- https://www.cloudbeds.com/channel-manager , https://myfrontdesk.cloudbeds.com/hc/en-us/articles/27471074990235-Connect-SiteMinder-to-Cloudbeds-PMS
- https://rategain.com/blog/best-channel-managers-for-independent-hotels
- https://yanoljacloudsolution.com/pricing , https://www.ezeecentrix.com/pricing.php
- https://www.kiotviet.vn/quan-ly-kenh-ban-phong-online-tren-mot-phan-mem-duy-nhat , https://gohost.vn/giai-phap/quan-ly-homestay , https://bado.vn/quan-ly-dat-phong-da-kenh-chong-overbooking

**MXH APIs:**
- https://developers.facebook.com/docs/graph-api/overview , https://developers.facebook.com/docs/graph-api/reference/page , https://developers.facebook.com/documentation/business-messaging/messenger-platform/get-started , https://developers.facebook.com/documentation/business-messaging/messenger-platform/policy
- https://www.infobip.com/blog/zalo-business , https://social-api.ai/platforms/zalo , https://docs.openclaw.ai/channels/zalo
- https://e.vnexpress.net/news/news/zalo-subscription-fees-to-add-little-benefit-alienate-free-account-holders-4494939.html
- https://developers.tiktok.com/doc/content-posting-api-reference-direct-post , https://developers.tiktok.com/doc/content-sharing-guidelines , https://business-api.tiktok.com/portal

**Hoa hồng tham khảo:**
- https://www.guesty.com/blog/how-much-does-booking-com-charge-hosts , https://hello.pricelabs.co/blog/booking-com-fees , https://www.cloudbeds.com/online-travel-agencies/commissions , https://www.smartorder.ai/resources/blog/the-complete-guide-to-ota-commission-rates
