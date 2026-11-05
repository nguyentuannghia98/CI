-- =====================================================================
-- 2026-10-17: Auction (đấu giá) thật + bật realtime cho conversations/feedbacks
-- Trạng thái: CHƯA APPLY (repo không có SUPABASE_DB_URL). Cần chạy thủ công.
-- =====================================================================

-- 1) Bảng phiên đấu giá
create table if not exists public.auctions (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  image_url     text,
  start_bid     bigint not null default 0,
  current_bid   bigint not null default 0,
  bid_count     integer not null default 0,
  ends_at       timestamptz not null,
  winner_id     uuid references public.users(id) on delete set null,
  created_by    uuid references public.users(id) on delete set null,
  created_at    timestamptz not null default now()
);

-- 2) Bảng lượt đặt giá
create table if not exists public.auction_bids (
  id          uuid primary key default gen_random_uuid(),
  auction_id  uuid not null references public.auctions(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  amount      bigint not null,
  created_at  timestamptz not null default now()
);

create index if not exists auction_bids_auction_id_idx on public.auction_bids(auction_id);

-- 3) RLS
alter table public.auctions enable row level security;
alter table public.auction_bids enable row level security;

drop policy if exists "auctions_read_all" on public.auctions;
create policy "auctions_read_all" on public.auctions for select using (true);

drop policy if exists "auctions_insert_auth" on public.auctions;
create policy "auctions_insert_auth" on public.auctions for insert to authenticated with check (auth.uid() = created_by);

drop policy if exists "auction_bids_read_all" on public.auction_bids;
create policy "auction_bids_read_all" on public.auction_bids for select using (true);

-- (không mở insert trực tiếp: chỉ đặt giá qua RPC place_bid bên dưới)

-- 4) RPC đặt giá nguyên tử (kiểm tra hết hạn + giá cao hơn + là người đăng nhập)
create or replace function public.place_bid(p_auction_id uuid, p_amount bigint)
returns public.auctions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auction public.auctions;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  select * into v_auction from public.auctions where id = p_auction_id for update;
  if not found then
    raise exception 'AUCTION_NOT_FOUND';
  end if;
  if v_auction.created_by = v_uid then
    raise exception 'CANNOT_BID_OWN_AUCTION';
  end if;
  if v_auction.ends_at <= now() then
    raise exception 'AUCTION_ENDED';
  end if;
  if p_amount < v_auction.current_bid + 10000 then
    raise exception 'BID_TOO_LOW';
  end if;

  insert into public.auction_bids(auction_id, user_id, amount)
  values (p_auction_id, v_uid, p_amount);

  update public.auctions
     set current_bid = p_amount,
         bid_count   = bid_count + 1
   where id = p_auction_id
   returning * into v_auction;

  return v_auction;
end;
$$;

grant execute on function public.place_bid(uuid, bigint) to authenticated;

-- 5) Bật realtime cho các bảng app đang subscribe (nguyên nhân F2/F4 không cập nhật:
--    các bảng này chưa nằm trong publication realtime).
do $$
begin
  begin
    alter publication supabase_realtime add table public.conversations;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.feedbacks;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.auctions;
  exception when duplicate_object then null; end;
end $$;
