-- Collections Table
create table collections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Collections RLS Policies
alter table collections enable row level security;

create policy "Users can view their own collections"
  on collections for select
  using (auth.uid() = user_id);

create policy "Users can create their own collections"
  on collections for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own collections"
  on collections for update
  using (auth.uid() = user_id);

create policy "Users can delete their own collections"
  on collections for delete
  using (auth.uid() = user_id);

-- Coins Table
create table coins (
  id uuid default uuid_generate_v4() primary key,
  collection_id uuid references collections not null,
  denomination text not null,
  year integer not null,
  mint_mark text,
  grade text,
  purchase_price decimal,
  purchase_date date,
  notes text,
  images text[],
  country text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Coins RLS Policies
alter table coins enable row level security;

create policy "Users can view coins in their collections"
  on coins for select
  using (
    exists (
      select 1 from collections
      where id = coins.collection_id
      and user_id = auth.uid()
    )
  );

create policy "Users can create coins in their collections"
  on coins for insert
  with check (
    exists (
      select 1 from collections
      where id = coins.collection_id
      and user_id = auth.uid()
    )
  );

create policy "Users can update coins in their collections"
  on coins for update
  using (
    exists (
      select 1 from collections
      where id = coins.collection_id
      and user_id = auth.uid()
    )
  );

create policy "Users can delete coins in their collections"
  on coins for delete
  using (
    exists (
      select 1 from collections
      where id = coins.collection_id
      and user_id = auth.uid()
    )
  );

-- Create indexes
create index idx_coins_collection_id on coins(collection_id);
create index idx_coins_year on coins(year);
create index idx_coins_country on coins(country);

-- Shared Collections Table
create table collection_shares (
  collection_id uuid references collections not null,
  shared_with_user_id uuid references auth.users not null,
  permission_level text not null check (permission_level in ('view', 'edit')),
  created_at timestamp with time zone default now(),
  primary key (collection_id, shared_with_user_id)
);

-- Shared Collections RLS Policies
alter table collection_shares enable row level security;

create policy "Users can view their shared collections"
  on collection_shares for select
  using (shared_with_user_id = auth.uid());

create policy "Collection owners can manage shares"
  on collection_shares for all
  using (
    exists (
      select 1 from collections
      where id = collection_shares.collection_id
      and user_id = auth.uid()
    )
  );