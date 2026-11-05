-- ============================================================================
-- H23 — Bật RLS cho hệ thống báo cáo/kiểm duyệt cộng đồng
-- Trước đây RLS đang TẮT trên reports / comment_reports / user_reports
-- => bất kỳ ai cũng đọc/sửa/xoá được báo cáo (các policy cũ vô hiệu).
-- Migration này:
--   1) Backfill community_id còn thiếu của comment_reports
--   2) Dọn các policy cũ (gồm policy "Enable all access for auth" quá rộng)
--   3) Bật RLS + tạo policy đúng: người báo cáo tự tạo/đọc báo cáo của mình,
--      mod của cộng đồng được đọc & xử lý báo cáo thuộc cộng đồng đó.
-- ============================================================================

-- 1) Backfill community_id cho comment_reports từ product của comment
update public.comment_reports cr
set community_id = p.community_id
from public.comments c
join public.products p on p.id = c.product_id
where cr.comment_id = c.id
  and cr.community_id is null;

-- 2) reports -----------------------------------------------------------------
drop policy if exists "Authenticated users can create reports" on public.reports;
drop policy if exists "Enable all access for auth"            on public.reports;
drop policy if exists "Enable insert for authenticated users" on public.reports;
drop policy if exists "Mods can view community reports"       on public.reports;
drop policy if exists "Users can insert reports"              on public.reports;
drop policy if exists "test_insert_policy"                    on public.reports;

alter table public.reports enable row level security;

create policy "reports_insert_reporter"
  on public.reports for insert to authenticated
  with check (auth.uid() = reporter_id);

create policy "reports_select_mods"
  on public.reports for select to authenticated
  using (
    auth.uid() = reporter_id
    or exists (
      select 1 from public.community_members m
      where m.community_id = reports.community_id
        and m.user_id = auth.uid()
        and m.role = 'mod'
    )
  );

create policy "reports_update_mods"
  on public.reports for update to authenticated
  using (
    exists (
      select 1 from public.community_members m
      where m.community_id = reports.community_id
        and m.user_id = auth.uid()
        and m.role = 'mod'
    )
  )
  with check (
    exists (
      select 1 from public.community_members m
      where m.community_id = reports.community_id
        and m.user_id = auth.uid()
        and m.role = 'mod'
    )
  );

-- 3) comment_reports ---------------------------------------------------------
alter table public.comment_reports enable row level security;

create policy "comment_reports_insert_reporter"
  on public.comment_reports for insert to authenticated
  with check (auth.uid() = reporter_id);

create policy "comment_reports_select_mods"
  on public.comment_reports for select to authenticated
  using (
    auth.uid() = reporter_id
    or exists (
      select 1 from public.community_members m
      where m.community_id = comment_reports.community_id
        and m.user_id = auth.uid()
        and m.role = 'mod'
    )
  );

create policy "comment_reports_update_mods"
  on public.comment_reports for update to authenticated
  using (
    exists (
      select 1 from public.community_members m
      where m.community_id = comment_reports.community_id
        and m.user_id = auth.uid()
        and m.role = 'mod'
    )
  )
  with check (
    exists (
      select 1 from public.community_members m
      where m.community_id = comment_reports.community_id
        and m.user_id = auth.uid()
        and m.role = 'mod'
    )
  );

-- 4) user_reports ------------------------------------------------------------
-- Báo cáo người dùng không thuộc cộng đồng nào; người gửi tạo & xem báo cáo của mình.
alter table public.user_reports enable row level security;

create policy "user_reports_insert_reporter"
  on public.user_reports for insert to authenticated
  with check (auth.uid() = reporter_id);

create policy "user_reports_select_reporter"
  on public.user_reports for select to authenticated
  using (auth.uid() = reporter_id);
