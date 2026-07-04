-- Per-user monthly scan quota for the recognize-coin edge function.
-- Tracks one counter row per (user, month). The edge function atomically
-- consumes a scan before calling the AI and refunds it if the AI call fails.

create table if not exists public.scan_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  month text not null, -- 'YYYY-MM' (UTC)
  scan_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, month)
);

alter table public.scan_usage enable row level security;

drop policy if exists "Users can view own scan usage" on public.scan_usage;
create policy "Users can view own scan usage"
  on public.scan_usage for select
  using (auth.uid() = user_id);

-- No insert/update/delete policies: writes go through the security-definer
-- functions below, which enforce the limit atomically.

create or replace function public.consume_scan(p_limit integer)
returns table (allowed boolean, used integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_month text := to_char(timezone('utc', now()), 'YYYY-MM');
  v_uid uuid := auth.uid();
  v_count integer;
begin
  if v_uid is null or p_limit <= 0 then
    return query select false, 0;
    return;
  end if;

  -- Atomic increment-if-under-limit: the WHERE on the conflict update makes
  -- concurrent requests serialize correctly and never exceed the cap.
  insert into public.scan_usage as su (user_id, month, scan_count)
  values (v_uid, v_month, 1)
  on conflict (user_id, month)
  do update set scan_count = su.scan_count + 1, updated_at = now()
  where su.scan_count < p_limit
  returning su.scan_count into v_count;

  if v_count is null then
    select su.scan_count into v_count
    from public.scan_usage su
    where su.user_id = v_uid and su.month = v_month;
    return query select false, coalesce(v_count, 0);
  else
    return query select true, v_count;
  end if;
end;
$$;

create or replace function public.refund_scan()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_month text := to_char(timezone('utc', now()), 'YYYY-MM');
begin
  update public.scan_usage
  set scan_count = greatest(scan_count - 1, 0), updated_at = now()
  where user_id = auth.uid() and month = v_month;
end;
$$;

revoke all on function public.consume_scan(integer) from public, anon;
revoke all on function public.refund_scan() from public, anon;
grant execute on function public.consume_scan(integer) to authenticated, service_role;
grant execute on function public.refund_scan() to authenticated, service_role;
