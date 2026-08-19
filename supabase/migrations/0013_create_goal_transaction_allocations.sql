-- goal_transaction_allocations: links part (or all) of an EXISTING
-- transaction's amount to a goal. This is deliberately a separate table
-- from 0010's goal_contributions (Task 14's freely-entered contribution
-- history, incl. the "Opening balance" backfill) — the two features stay
-- independent by design (see task notes), so this migration does not touch
-- goal_contributions, goals.current_amount, or the sync trigger from 0010.
--
-- NOT a new financial transaction: no row is ever inserted into
-- `transactions` from this table or its trigger. It only records that N
-- rupees of an already-existing transaction is earmarked for a goal —
-- the transaction's own amount never changes.

create table if not exists public.goal_transaction_allocations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete restrict,
  transaction_id uuid not null references public.transactions (id) on delete restrict,
  amount numeric(14, 2) not null,
  currency text not null,
  contribution_date date not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goal_transaction_allocations_amount_positive check (amount > 0),
  constraint goal_transaction_allocations_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint goal_transaction_allocations_note_length check (note is null or char_length(note) <= 280)
);

create index if not exists goal_transaction_allocations_user_id_idx
  on public.goal_transaction_allocations (user_id);
create index if not exists goal_transaction_allocations_user_id_goal_id_idx
  on public.goal_transaction_allocations (user_id, goal_id);
create index if not exists goal_transaction_allocations_user_id_transaction_id_idx
  on public.goal_transaction_allocations (user_id, transaction_id);
create index if not exists goal_transaction_allocations_user_id_date_idx
  on public.goal_transaction_allocations (user_id, contribution_date desc);

-- Reuses the set_updated_at() trigger function created in 0001.
drop trigger if exists goal_transaction_allocations_set_updated_at on public.goal_transaction_allocations;
create trigger goal_transaction_allocations_set_updated_at
  before update on public.goal_transaction_allocations
  for each row
  execute function public.set_updated_at();

alter table public.goal_transaction_allocations enable row level security;

create policy "Users can view own goal transaction allocations"
  on public.goal_transaction_allocations for select
  using (auth.uid() = user_id);

create policy "Users can insert own goal transaction allocations"
  on public.goal_transaction_allocations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own goal transaction allocations"
  on public.goal_transaction_allocations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own goal transaction allocations"
  on public.goal_transaction_allocations for delete
  using (auth.uid() = user_id);

-- Cross-table validation a CHECK/FK can't express — same SECURITY INVOKER
-- pattern as every other cross-table trigger in this project (0005, 0009,
-- 0010, 0011, 0012): ownership, goal-active-on-insert, transaction type
-- (transfers are never eligible), currency matching (transitively, via the
-- goal: both the allocation's own currency and the funding account's
-- currency must equal the goal's currency), the contribution date must be
-- the transaction's own date, and the allocation cap — this row's amount
-- plus every OTHER allocation already made from the same transaction must
-- never exceed that transaction's amount. transactions.amount is always
-- positive (never signed), so this is a plain sum comparison.
create or replace function public.validate_goal_transaction_allocation()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  goal_owner uuid;
  goal_currency text;
  goal_is_active boolean;
  transaction_owner uuid;
  transaction_amount numeric(14, 2);
  transaction_date_value date;
  transaction_type text;
  account_currency text;
  other_allocated numeric(14, 2);
begin
  select user_id, currency, is_active into goal_owner, goal_currency, goal_is_active
  from public.goals where id = new.goal_id;

  if goal_owner is null or goal_owner <> auth.uid() then
    raise exception 'Goal not found';
  end if;

  if TG_OP = 'INSERT' and not goal_is_active then
    raise exception 'Cannot add a contribution to an inactive goal';
  end if;

  select t.user_id, t.amount, t.transaction_date, t.type, a.currency
    into transaction_owner, transaction_amount, transaction_date_value, transaction_type, account_currency
  from public.transactions t
  join public.accounts a on a.id = t.account_id
  where t.id = new.transaction_id;

  if transaction_owner is null or transaction_owner <> auth.uid() then
    raise exception 'Transaction not found';
  end if;

  if transaction_type = 'transfer' then
    raise exception 'Transfers cannot be allocated to a goal';
  end if;

  if new.currency <> goal_currency then
    raise exception 'Contribution currency must match the goal currency';
  end if;

  if account_currency <> goal_currency then
    raise exception 'Transaction currency must match the goal currency';
  end if;

  if new.contribution_date <> transaction_date_value then
    raise exception 'Contribution date must match the transaction date';
  end if;

  if new.amount > transaction_amount then
    raise exception 'Contribution amount cannot exceed the transaction amount';
  end if;

  select coalesce(sum(amount), 0) into other_allocated
  from public.goal_transaction_allocations
  where transaction_id = new.transaction_id and id <> new.id;

  if other_allocated + new.amount > transaction_amount then
    raise exception 'This transaction does not have enough unallocated amount for this contribution';
  end if;

  return new;
end;
$$;

drop trigger if exists goal_transaction_allocations_validate on public.goal_transaction_allocations;
create trigger goal_transaction_allocations_validate
  before insert or update on public.goal_transaction_allocations
  for each row
  execute function public.validate_goal_transaction_allocation();
