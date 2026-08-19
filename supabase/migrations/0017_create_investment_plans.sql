-- investment_plans: a recurring investment commitment (a SIP) against one
-- holding — deliberately its own concept, separate from 0012's
-- recurring_transactions (income/expense/transfer schedules) and 0011's
-- subscriptions (service commitments). No end_date is required: a SIP may
-- continue indefinitely.

create table if not exists public.investment_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  holding_id uuid not null references public.investment_holdings (id) on delete restrict,
  name text not null,
  amount numeric(14, 2) not null,
  currency text not null,
  frequency text not null,
  contribution_day integer,
  start_date date not null,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint investment_plans_name_not_blank check (btrim(name) <> ''),
  constraint investment_plans_name_length check (char_length(name) <= 100),
  constraint investment_plans_amount_positive check (amount > 0),
  constraint investment_plans_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint investment_plans_frequency_supported check (frequency in ('monthly', 'quarterly', 'yearly')),
  -- 1-31 whenever it's set at all (any frequency may optionally pin a day
  -- of month), but only monthly plans require one.
  constraint investment_plans_contribution_day_range check (contribution_day is null or (contribution_day between 1 and 31)),
  constraint investment_plans_monthly_requires_day check (frequency <> 'monthly' or contribution_day is not null),
  constraint investment_plans_end_date_after_start check (end_date is null or end_date >= start_date)
);

create index if not exists investment_plans_user_id_idx on public.investment_plans (user_id);
create index if not exists investment_plans_user_id_holding_id_idx on public.investment_plans (user_id, holding_id);
create index if not exists investment_plans_user_id_is_active_idx on public.investment_plans (user_id, is_active);

-- Reuses the set_updated_at() trigger function created in 0001.
drop trigger if exists investment_plans_set_updated_at on public.investment_plans;
create trigger investment_plans_set_updated_at
  before update on public.investment_plans
  for each row
  execute function public.set_updated_at();

alter table public.investment_plans enable row level security;

create policy "Users can view own investment plans"
  on public.investment_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert own investment plans"
  on public.investment_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update own investment plans"
  on public.investment_plans for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own investment plans"
  on public.investment_plans for delete
  using (auth.uid() = user_id);

-- Cross-table validation a CHECK/FK can't express: the holding must belong
-- to the caller, and the plan's currency must match that holding's
-- currency (no silent cross-currency SIPs). SECURITY INVOKER (the default,
-- stated explicitly) — same pattern as every other cross-table trigger in
-- this project.
create or replace function public.validate_investment_plan()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  holding_owner uuid;
  holding_currency text;
begin
  select user_id, currency into holding_owner, holding_currency
  from public.investment_holdings where id = new.holding_id;

  if holding_owner is null or holding_owner <> auth.uid() then
    raise exception 'Investment holding not found';
  end if;

  if new.currency <> holding_currency then
    raise exception 'Plan currency must match the investment holding currency';
  end if;

  return new;
end;
$$;

drop trigger if exists investment_plans_validate on public.investment_plans;
create trigger investment_plans_validate
  before insert or update on public.investment_plans
  for each row
  execute function public.validate_investment_plan();
