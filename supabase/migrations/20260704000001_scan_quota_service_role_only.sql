-- Lock the scan-quota functions down to service_role only.
-- The first version was callable by authenticated users, which would let a
-- user call refund_scan() directly via PostgREST and bypass the quota.
-- The edge function now calls these with its service-role client and passes
-- the verified user id explicitly.

drop function if exists public.consume_scan(integer);
drop function if exists public.refund_scan();

create or replace function public.consume_scan(p_user_id uuid, p_limit integer)
returns table (allowed boolean, used integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_month text := to_char(timezone('utc', now()), 'YYYY-MM');
  v_count integer;
begin
  if p_user_id is null or p_limit <= 0 then
    return query select false, 0;
    return;
  end if;

  -- Atomic increment-if-under-limit: the WHERE on the conflict update makes
  -- concurrent requests serialize correctly and never exceed the cap.
  insert into public.scan_usage as su (user_id, month, scan_count)
  values (p_user_id, v_month, 1)
  on conflict (user_id, month)
  do update set scan_count = su.scan_count + 1, updated_at = now()
  where su.scan_count < p_limit
  returning su.scan_count into v_count;

  if v_count is null then
    select su.scan_count into v_count
    from public.scan_usage su
    where su.user_id = p_user_id and su.month = v_month;
    return query select false, coalesce(v_count, 0);
  else
    return query select true, v_count;
  end if;
end;
$$;

create or replace function public.refund_scan(p_user_id uuid)
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
  where user_id = p_user_id and month = v_month;
end;
$$;

revoke all on function public.consume_scan(uuid, integer) from public, anon, authenticated;
revoke all on function public.refund_scan(uuid) from public, anon, authenticated;
grant execute on function public.consume_scan(uuid, integer) to service_role;
grant execute on function public.refund_scan(uuid) to service_role;
