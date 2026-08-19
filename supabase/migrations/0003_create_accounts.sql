-- accounts: one row per user-owned account (bank, cash, credit card,
-- investment, other) — where the user's money currently exists.
--
-- Balance sign convention: for asset-type accounts (bank/cash/investment), a
-- positive balance is asset value. For credit_card, a positive balance is the
-- amount owed (a liability) — never stored as negative. See
-- src/constants/accountTypes.js for the classification the app uses to turn
-- this into assets vs. liabilities.

create extension if not exists "pgcrypto";

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null,
  balance numeric(14, 2) not null default 0,
  currency text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accounts_name_not_blank check (btrim(name) <> ''),
  constraint accounts_name_length check (char_length(name) <= 80),
  constraint accounts_type_supported check (type in ('bank', 'cash', 'credit_card', 'investment', 'other')),
  constraint accounts_balance_non_negative check (balance >= 0),
  constraint accounts_currency_format check (currency ~ '^[A-Z]{3}$')
);

create index if not exists accounts_user_id_idx on public.accounts (user_id);
create index if not exists accounts_user_id_is_active_idx on public.accounts (user_id, is_active);

-- Reuses the set_updated_at() trigger function created in 0001.
drop trigger if exists accounts_set_updated_at on public.accounts;
create trigger accounts_set_updated_at
  before update on public.accounts
  for each row
  execute function public.set_updated_at();

alter table public.accounts enable row level security;

create policy "Users can view own accounts"
  on public.accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert own accounts"
  on public.accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own accounts"
  on public.accounts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own accounts"
  on public.accounts for delete
  using (auth.uid() = user_id);
