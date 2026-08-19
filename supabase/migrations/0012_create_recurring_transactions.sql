-- recurring_transactions: scheduled financial EXPECTATIONS (income, expense,
-- or transfer patterns), not automated payments. Confirming an occurrence
-- creates one row in the existing transactions table (via the existing
-- transaction service/validation) and advances next_occurrence_date — this
-- migration never touches accounts.balance and never creates a transaction
-- on its own. See task notes: this is deliberately NOT the same concept as
-- 0011's subscriptions (a commitment) — a subscription may optionally link
-- to one of these, but the two tables stay independent and this migration
-- does not add a foreign key back to subscriptions in either direction.
--
-- No goal_id here either — goal funding integration is explicitly out of
-- scope (see Task 14/goal_contributions), kept as a separate future task.

create table if not exists public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete restrict,
  category_id uuid references public.categories (id) on delete restrict,
  destination_account_id uuid references public.accounts (id) on delete restrict,
  type text not null,
  amount numeric(14, 2) not null,
  currency text not null,
  description text,
  frequency text not null,
  start_date date not null,
  next_occurrence_date date not null,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_transactions_type_supported check (type in ('income', 'expense', 'transfer')),
  constraint recurring_transactions_frequency_supported check (
    frequency in ('weekly', 'monthly', 'quarterly', 'yearly')
  ),
  constraint recurring_transactions_amount_positive check (amount > 0),
  constraint recurring_transactions_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint recurring_transactions_description_length check (description is null or char_length(description) <= 280),
  -- Same shape rule as transactions (0005): income/expense require a
  -- category and forbid a destination account; transfer requires a
  -- destination account and forbids a category.
  constraint recurring_transactions_type_shape check (
    (type in ('income', 'expense') and category_id is not null and destination_account_id is null)
    or
    (type = 'transfer' and category_id is null and destination_account_id is not null)
  ),
  constraint recurring_transactions_transfer_distinct_accounts check (
    destination_account_id is null or destination_account_id <> account_id
  ),
  constraint recurring_transactions_end_date_after_start check (end_date is null or end_date >= start_date),
  constraint recurring_transactions_next_occurrence_after_start check (next_occurrence_date >= start_date)
);

create index if not exists recurring_transactions_user_id_idx on public.recurring_transactions (user_id);
create index if not exists recurring_transactions_user_id_is_active_idx
  on public.recurring_transactions (user_id, is_active);
create index if not exists recurring_transactions_user_id_next_occurrence_idx
  on public.recurring_transactions (user_id, next_occurrence_date);
create index if not exists recurring_transactions_user_id_type_idx on public.recurring_transactions (user_id, type);
create index if not exists recurring_transactions_user_id_account_id_idx
  on public.recurring_transactions (user_id, account_id);

-- Reuses the set_updated_at() trigger function created in 0001.
drop trigger if exists recurring_transactions_set_updated_at on public.recurring_transactions;
create trigger recurring_transactions_set_updated_at
  before update on public.recurring_transactions
  for each row
  execute function public.set_updated_at();

alter table public.recurring_transactions enable row level security;

create policy "Users can view own recurring transactions"
  on public.recurring_transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own recurring transactions"
  on public.recurring_transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own recurring transactions"
  on public.recurring_transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own recurring transactions"
  on public.recurring_transactions for delete
  using (auth.uid() = user_id);

-- Cross-table validation a CHECK/FK can't express — same pattern as
-- 0005's validate_transaction(): account/destination ownership, category
-- ownership + type match, and currency matching. Adds two rules unique to
-- this table: the source account (and, for a transfer, the destination
-- account) must be ACTIVE, but only checked on INSERT — an existing
-- recurring transaction must stay visible/editable if its account is later
-- deactivated (task explicitly wants "Account inactive" shown, not the row
-- blocked or deleted). Same story for category: active-on-INSERT only, so
-- an existing recurring transaction survives its category being archived
-- ("Category inactive" in the UI, user can pick a new one).
--
-- SECURITY INVOKER (the default — stated explicitly, no service-role): runs
-- as the calling user, so its own lookups against accounts/categories stay
-- governed by those tables' RLS — a reference to another user's row reads
-- as "not found" here, the same as every other cross-table trigger in this
-- project (0005, 0009, 0010, 0011).
create or replace function public.validate_recurring_transaction()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  account_owner uuid;
  account_currency text;
  account_active boolean;
  destination_owner uuid;
  destination_currency text;
  destination_active boolean;
  category_owner uuid;
  category_type text;
begin
  select user_id, currency, is_active into account_owner, account_currency, account_active
  from public.accounts where id = new.account_id;

  if account_owner is null or account_owner <> auth.uid() then
    raise exception 'Account not found';
  end if;

  if TG_OP = 'INSERT' and not account_active then
    raise exception 'Cannot create a recurring transaction on an inactive account';
  end if;

  if new.currency <> account_currency then
    raise exception 'Recurring transaction currency must match the account currency';
  end if;

  if new.destination_account_id is not null then
    select user_id, currency, is_active into destination_owner, destination_currency, destination_active
    from public.accounts where id = new.destination_account_id;

    if destination_owner is null or destination_owner <> auth.uid() then
      raise exception 'Destination account not found';
    end if;

    if TG_OP = 'INSERT' and not destination_active then
      raise exception 'Cannot create a recurring transfer to an inactive account';
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
      raise exception 'Category type does not match recurring transaction type';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists recurring_transactions_validate on public.recurring_transactions;
create trigger recurring_transactions_validate
  before insert or update on public.recurring_transactions
  for each row
  execute function public.validate_recurring_transaction();
