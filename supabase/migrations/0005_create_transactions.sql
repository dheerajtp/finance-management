-- transactions: the financial-activity ledger. income/expense/transfer.
--
-- ACCOUNT BALANCE STRATEGY (see README/task report for full rationale):
-- accounts.balance stays a manually-maintained snapshot. This migration does
-- NOT add triggers to mutate accounts.balance from transactions — the
-- existing accounts feature (0003) has no opening-balance concept or sync
-- machinery, so deriving balances here would be a half-built system. Adding
-- that properly is a separate, deliberate future task.
--
-- AMOUNT SIGN: always stored positive. `type` determines meaning; only the
-- UI decides whether to render +/-/↔.
--
-- OWNERSHIP: RLS on this table only checks transactions.user_id = auth.uid().
-- It does NOT stop a user from pointing account_id/category_id/
-- destination_account_id at another user's rows — a same-row CHECK
-- constraint can't see other tables, and a FK only checks "does this id
-- exist", not "is it mine". That cross-table ownership + category-type
-- check is done in the validate_transaction() trigger below, which runs
-- SECURITY INVOKER so its own lookups against accounts/categories stay
-- governed by those tables' RLS (same pattern as 0004's
-- initialize_default_categories()).

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete restrict,
  category_id uuid references public.categories (id) on delete restrict,
  destination_account_id uuid references public.accounts (id) on delete restrict,
  type text not null,
  amount numeric(14, 2) not null,
  description text,
  transaction_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_type_supported check (type in ('income', 'expense', 'transfer')),
  constraint transactions_amount_positive check (amount > 0),
  constraint transactions_description_length check (description is null or char_length(description) <= 280),
  -- income/expense require a category and forbid a destination account;
  -- transfer requires a destination account and forbids a category.
  constraint transactions_type_shape check (
    (type in ('income', 'expense') and category_id is not null and destination_account_id is null)
    or
    (type = 'transfer' and category_id is null and destination_account_id is not null)
  ),
  constraint transactions_transfer_distinct_accounts check (
    destination_account_id is null or destination_account_id <> account_id
  )
);

create index if not exists transactions_user_id_idx on public.transactions (user_id);
create index if not exists transactions_user_id_date_idx on public.transactions (user_id, transaction_date desc);
create index if not exists transactions_user_id_type_idx on public.transactions (user_id, type);
create index if not exists transactions_user_id_account_idx on public.transactions (user_id, account_id);
create index if not exists transactions_user_id_category_idx on public.transactions (user_id, category_id);

-- Reuses the set_updated_at() trigger function created in 0001.
drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
  before update on public.transactions
  for each row
  execute function public.set_updated_at();

alter table public.transactions enable row level security;

create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- Cross-table validation RLS/CHECK constraints cannot express:
--   1. account_id (and destination_account_id) must belong to auth.uid().
--   2. category_id must belong to auth.uid() AND category.type = transaction.type.
--   3. a transfer's two accounts must share the same currency (no silent
--      cross-currency conversion).
--
-- SECURITY INVOKER (the default — stated explicitly): runs as the calling
-- user. Its SELECTs against accounts/categories are themselves subject to
-- those tables' RLS, so a reference to another user's row simply returns no
-- rows here (treated the same as "not found" — deliberately, to avoid
-- leaking whether a foreign id exists at all).
create or replace function public.validate_transaction()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  account_owner uuid;
  account_currency text;
  destination_owner uuid;
  destination_currency text;
  category_owner uuid;
  category_type text;
begin
  select user_id, currency into account_owner, account_currency
  from public.accounts where id = new.account_id;

  if account_owner is null or account_owner <> auth.uid() then
    raise exception 'Account not found';
  end if;

  if new.destination_account_id is not null then
    select user_id, currency into destination_owner, destination_currency
    from public.accounts where id = new.destination_account_id;

    if destination_owner is null or destination_owner <> auth.uid() then
      raise exception 'Destination account not found';
    end if;

    if destination_currency <> account_currency then
      raise exception 'Cannot transfer between accounts with different currencies';
    end if;
  end if;

  if new.category_id is not null then
    select user_id, type into category_owner, category_type
    from public.categories where id = new.category_id;

    if category_owner is null or category_owner <> auth.uid() then
      raise exception 'Category not found';
    end if;

    if category_type <> new.type then
      raise exception 'Category type does not match transaction type';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists transactions_validate on public.transactions;
create trigger transactions_validate
  before insert or update on public.transactions
  for each row
  execute function public.validate_transaction();
