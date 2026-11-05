-- ============================================================================
-- NexLoot — Migration: timezone chuẩn hoá + FK cộng đồng + cột phone
-- Ngày: 2026-10-16
--
-- LƯU Ý: Repo không chứa connection string DB (đã gỡ vì lộ khoá), nên migration
-- này CHƯA được apply tự động. Hãy chạy trong Supabase SQL Editor (hoặc
-- `supabase db push` nếu dùng CLI).
--
-- Phần client đã có fix phòng vệ (`src/lib/datetime.ts` → `parseDbDate`) nên UI
-- hiển thị đúng giờ ngay cả khi chưa chạy migration. Migration này là fix "gốc",
-- giúp PostgREST trả về offset để mọi nơi tự parse đúng.
-- ============================================================================

-- 1) CHUẨN HOÁ TIMEZONE --------------------------------------------------------
-- Các cột dưới đây đang là `timestamp` (không tz) nhưng nhận giá trị UTC, khiến
-- client hiển thị lệch múi giờ. Chuyển sang `timestamptz`, diễn giải giá trị cũ
-- là UTC.
ALTER TABLE public.notifications    ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
ALTER TABLE public.products         ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
ALTER TABLE public.comments         ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
ALTER TABLE public.community_tags   ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
ALTER TABLE public.product_tags     ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
ALTER TABLE public.users            ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';

-- Nếu còn cột updated_at tương ứng thì làm tương tự (thêm khi cần):
-- ALTER TABLE public.users ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';

-- 2) FK cộng đồng ------------------------------------------------------------
-- Hiện `products.community_id` tham chiếu `communities(id)` không có hành vi khi
-- xoá → xoá cộng đồng còn bài sẽ vướng lỗi FK 23503. Chuyển sang SET NULL để
-- việc xoá cộng đồng không còn bị chặn (action `deleteCommunityAction` cũng đã
-- dọn dàn trước khi xoá).
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS fk_community;
ALTER TABLE public.products
  ADD CONSTRAINT fk_community
  FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE SET NULL;

-- 3) Cột phone ---------------------------------------------------------------
-- `users.phone` đang là integer nên mất số 0 đứng đầu ("0900000000" → 900000000).
ALTER TABLE public.users ALTER COLUMN phone TYPE text USING phone::text;
