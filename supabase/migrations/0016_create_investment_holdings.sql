-- investment_holdings: one row per investment the user holds (a mutual
-- fund, a stock position, a PPF account, ...), inside an investment-type
-- account (0003's accounts.type = 'investment', reused as the container —
-- no second investment-account table). invested_amount/current_value are
-- explicitly user-maintained, same manual-balance philosophy as
-- accounts.balance — this app never knows real market prices, so it never
-- computes current_value from anything.

create table if not exists public.investment_holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete restrict,
  name text not null,
  type text not null,
  currency text not null,
  invested_amount numeric(14, 2) not null default 0,
  current_value numeric(14, 2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint investment_holdings_name_not_blank check (btrim(name) <> ''),
  constraint investment_holdings_name_length check (char_length(name) <= 100),
  constraint investment_holdings_type_supported check (
    type in ('mutual_fund', 'stock', 'etf', 'bond', 'ppf', 'nps', 'fd', 'gold', 'other')
  ),
  constraint investment_holdings_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint investment_holdings_invested_amount_non_negative check (invested_amount >= 0),
  -- Deliberately NOT current_value >= invested_amount — investments can
  -- lose value; a holding at a loss is a valid, ordinary state.
  constraint investment_holdings_current_value_non_negative check (current_value >= 0)
);

create index if not exists investment_holdings_user_id_idx on public.investment_holdings (user_id);
create index if not exists investment_holdings_user_id_account_id_idx on public.investment_holdings (user_id, account_id);
create index if not exists investment_holdings_user_id_is_active_idx on public.investment_holdings (user_id, is_active);

-- Reuses the set_updated_at() trigger function created in 0001.
drop trigger if exists investment_holdings_set_updated_at on public.investment_holdings;
create trigger investment_holdings_set_updated_at
  before update on public.investment_holdings
  for each row
  execute function public.set_updated_at();

alter table public.investment_holdings enable row level security;

create policy "Users can view own investment holdings"
  on public.investment_holdings for select
  using (auth.uid() = user_id);

create policy "Users can insert own investment holdings"
  on public.investment_holdings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own investment holdings"
  on public.investment_holdings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own investment holdings"
  on public.investment_holdings for delete
  using (auth.uid() = user_id);

-- Cross-table validation a CHECK/FK can't express — same SECURITY INVOKER
-- pattern as every other cross-table trigger in this project (0005, 0009,
-- 0010, 0011, 0012, 0013). The account must belong to the caller and be an
-- investment-type account. "Active" is checked on INSERT only (same
-- established convention as 0011/0012/0013): an existing holding must stay
-- visible/editable if its account is later deactivated, not get silently
-- blocked or orphaned. The account-type check, in contrast, applies to
-- both INSERT and UPDATE — that's about the reference itself being
-- coherent whenever it's set, not about tolerating a later external state
-- change.
create or replace function public.validate_investment_holding()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  account_owner uuid;
  account_type text;
  account_active boolean;
begin
  select user_id, type, is_active into account_owner, account_type, account_active
  from public.accounts where id = new.account_id;

  if account_owner is null or account_owner <> auth.uid() then
    raise exception 'Account not found';
  end if;

  if account_type <> 'investment' then
    raise exception 'Investment holdings can only be linked to an investment account';
  end if;

  if TG_OP = 'INSERT' and not account_active then
    raise exception 'Cannot create an investment holding on an inactive account';
  end if;

  return new;
end;
$$;

drop trigger if exists investment_holdings_validate on public.investment_holdings;
create trigger investment_holdings_validate
  before insert or update on public.investment_holdings
  for each row
  execute function public.validate_investment_holding();
