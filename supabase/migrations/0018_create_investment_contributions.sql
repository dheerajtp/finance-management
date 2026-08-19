-- investment_contributions: the historical record of money actually
-- contributed toward a holding — optionally tied to a plan/SIP occurrence,
-- but never required to be (existing/historical investments can be entered
-- as a holding's invested_amount directly, with contribution rows added
-- only if the user chooses to). plan_id is ON DELETE SET NULL (unlike
-- holding_id's ON DELETE RESTRICT) — deleting a plan should never delete
-- the historical contributions it produced, only detach them from it.
--
-- Deliberately no dedupe/uniqueness constraint here (see task notes): two
-- legitimate contributions can land on the same day, so nothing should
-- reject that.

create table if not exists public.investment_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id uuid references public.investment_plans (id) on delete set null,
  holding_id uuid not null references public.investment_holdings (id) on delete restrict,
  amount numeric(14, 2) not null,
  currency text not null,
  contribution_date date not null,
  status text not null default 'completed',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint investment_contributions_amount_positive check (amount > 0),
  constraint investment_contributions_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint investment_contributions_status_supported check (status in ('completed', 'skipped')),
  constraint investment_contributions_notes_length check (notes is null or char_length(notes) <= 280)
);

create index if not exists investment_contributions_user_id_idx on public.investment_contributions (user_id);
create index if not exists investment_contributions_user_id_holding_id_idx
  on public.investment_contributions (user_id, holding_id);
create index if not exists investment_contributions_user_id_plan_id_idx
  on public.investment_contributions (user_id, plan_id);
create index if not exists investment_contributions_user_id_date_idx
  on public.investment_contributions (user_id, contribution_date desc);

-- Reuses the set_updated_at() trigger function created in 0001.
drop trigger if exists investment_contributions_set_updated_at on public.investment_contributions;
create trigger investment_contributions_set_updated_at
  before update on public.investment_contributions
  for each row
  execute function public.set_updated_at();

alter table public.investment_contributions enable row level security;

create policy "Users can view own investment contributions"
  on public.investment_contributions for select
  using (auth.uid() = user_id);

create policy "Users can insert own investment contributions"
  on public.investment_contributions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own investment contributions"
  on public.investment_contributions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own investment contributions"
  on public.investment_contributions for delete
  using (auth.uid() = user_id);

-- Cross-table validation a CHECK/FK can't express: the holding must belong
-- to the caller; when a plan is given, it must belong to the caller AND
-- reference the SAME holding (a contribution can't claim to fulfill a SIP
-- that belongs to a different investment); currency must match the
-- holding's currency. SECURITY INVOKER (the default, stated explicitly).
create or replace function public.validate_investment_contribution()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  holding_owner uuid;
  holding_currency text;
  plan_owner uuid;
  plan_holding_id uuid;
begin
  select user_id, currency into holding_owner, holding_currency
  from public.investment_holdings where id = new.holding_id;

  if holding_owner is null or holding_owner <> auth.uid() then
    raise exception 'Investment holding not found';
  end if;

  if new.currency <> holding_currency then
    raise exception 'Contribution currency must match the investment holding currency';
  end if;

  if new.plan_id is not null then
    select user_id, holding_id into plan_owner, plan_holding_id
    from public.investment_plans where id = new.plan_id;

    if plan_owner is null or plan_owner <> auth.uid() then
      raise exception 'Investment plan not found';
    end if;

    if plan_holding_id <> new.holding_id then
      raise exception 'Investment plan does not belong to this holding';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists investment_contributions_validate on public.investment_contributions;
create trigger investment_contributions_validate
  before insert or update on public.investment_contributions
  for each row
  execute function public.validate_investment_contribution();
