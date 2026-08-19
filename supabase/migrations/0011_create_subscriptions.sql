-- subscriptions: recurring financial commitments (Netflix, gym, SaaS, etc.)
-- as their own entity — separate from the existing "Subscriptions" expense
-- category and from transactions. This migration creates no transactions
-- and does not touch accounts.balance; automatic payment-transaction
-- generation is a separate future task (see task notes).

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  amount numeric(14, 2) not null,
  currency text not null,
  billing_frequency text not null,
  next_billing_date date not null,
  account_id uuid references public.accounts (id) on delete restrict,
  category_id uuid references public.categories (id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_name_not_blank check (btrim(name) <> ''),
  constraint subscriptions_name_length check (char_length(name) <= 100),
  constraint subscriptions_description_length check (description is null or char_length(description) <= 280),
  constraint subscriptions_amount_positive check (amount > 0),
  constraint subscriptions_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint subscriptions_billing_frequency_supported check (
    billing_frequency in ('weekly', 'monthly', 'quarterly', 'yearly')
  )
);

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_user_id_is_active_idx on public.subscriptions (user_id, is_active);
create index if not exists subscriptions_user_id_next_billing_date_idx
  on public.subscriptions (user_id, next_billing_date);

-- Reuses the set_updated_at() trigger function created in 0001.
drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row
  execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

create policy "Users can view own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can insert own subscriptions"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own subscriptions"
  on public.subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own subscriptions"
  on public.subscriptions for delete
  using (auth.uid() = user_id);

-- Cross-table validation a CHECK/FK can't express: account_id and
-- category_id are both optional, but when given must belong to the caller;
-- a category must be an expense category; and an account's currency must
-- match the subscription's currency (no silent cross-currency billing).
-- SECURITY INVOKER (the default, stated explicitly) — same pattern as every
-- other cross-table trigger in this project (0005, 0009, 0010).
create or replace function public.validate_subscription()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  account_owner uuid;
  account_currency text;
  category_owner uuid;
  category_type text;
begin
  if new.account_id is not null then
    select user_id, currency into account_owner, account_currency
    from public.accounts where id = new.account_id;

    if account_owner is null or account_owner <> auth.uid() then
      raise exception 'Account not found';
    end if;

    if account_currency <> new.currency then
      raise exception 'Subscription currency must match the selected account''s currency';
    end if;
  end if;

  if new.category_id is not null then
    select user_id, type into category_owner, category_type
    from public.categories where id = new.category_id;

    if category_owner is null or category_owner <> auth.uid() then
      raise exception 'Category not found';
    end if;

    if category_type <> 'expense' then
      raise exception 'Subscriptions can only use expense categories';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists subscriptions_validate on public.subscriptions;
create trigger subscriptions_validate
  before insert or update on public.subscriptions
  for each row
  execute function public.validate_subscription();
