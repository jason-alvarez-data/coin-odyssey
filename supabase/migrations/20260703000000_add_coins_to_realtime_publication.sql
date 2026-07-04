-- Add public.coins to the supabase_realtime publication.
-- Tables are NOT published by default; without this, postgres_changes
-- subscriptions (mobile CoinService.subscribeToCoins) receive no events
-- and cross-device sync silently does nothing.
-- Idempotent so it is safe on environments where the table was already
-- added by hand via the dashboard.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'coins'
  ) then
    alter publication supabase_realtime add table public.coins;
  end if;
end
$$;
