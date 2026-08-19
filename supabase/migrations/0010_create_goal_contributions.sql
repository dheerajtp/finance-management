-- goal_contributions: contribution-based history behind a goal's progress.
-- goals.current_amount stops being manually entered and becomes a derived
-- snapshot, kept in sync by the sync_goal_current_amount() trigger below —
-- every other part of the app (GoalCard, sorting, summaries) keeps reading
-- goals.current_amount exactly as before, so nothing downstream changes.
--
-- CURRENCY: stored explicitly on each contribution rather than joined from
-- goals at read time, because goals.currency is editable after creation
-- (see GoalForm) — without a snapshot, editing a goal's currency would
-- silently reinterpret every past contribution's amount in the new
-- currency. The value is never trusted from the client: the
-- validate_goal_contribution() trigger below always overwrites it with the
-- owning goal's current currency, so "currency matches the goal" holds by
-- construction, not just by check.

create table if not exists public.goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  goal_id uuid not null references public.goals (id) on delete restrict,
  amount numeric(14, 2) not null,
  currency text not null,
  contribution_date date not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goal_contributions_amount_positive check (amount > 0),
  constraint goal_contributions_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint goal_contributions_description_length check (description is null or char_length(description) <= 280)
);

create index if not exists goal_contributions_user_id_idx on public.goal_contributions (user_id);
create index if not exists goal_contributions_user_id_goal_id_idx on public.goal_contributions (user_id, goal_id);
create index if not exists goal_contributions_user_id_date_idx
  on public.goal_contributions (user_id, contribution_date desc);

-- Reuses the set_updated_at() trigger function created in 0001.
drop trigger if exists goal_contributions_set_updated_at on public.goal_contributions;
create trigger goal_contributions_set_updated_at
  before update on public.goal_contributions
  for each row
  execute function public.set_updated_at();

alter table public.goal_contributions enable row level security;

create policy "Users can view own goal contributions"
  on public.goal_contributions for select
  using (auth.uid() = user_id);

create policy "Users can insert own goal contributions"
  on public.goal_contributions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own goal contributions"
  on public.goal_contributions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own goal contributions"
  on public.goal_contributions for delete
  using (auth.uid() = user_id);

-- ONE-TIME BACKFILL: preserve pre-existing manually-entered current_amount
-- as an opening contribution, dated to the goal's creation (the only date
-- we actually have for it). Runs before the triggers below exist, so it
-- can't be blocked by the active-goal check and never touches
-- goals.current_amount — the backfilled amount already equals it.
-- Guarded by NOT EXISTS so re-running this migration file never duplicates
-- the opening entry.
insert into public.goal_contributions (user_id, goal_id, amount, currency, contribution_date, description)
select g.user_id, g.id, g.current_amount, g.currency, g.created_at::date, 'Opening balance'
from public.goals g
where g.current_amount > 0
  and not exists (
    select 1 from public.goal_contributions gc
    where gc.goal_id = g.id and gc.description = 'Opening balance'
  );

-- Cross-table validation RLS/CHECK constraints cannot express:
--   1. goal_id must belong to auth.uid().
--   2. a NEW contribution can't be added to an inactive goal (edits/deletes
--      of past contributions are still allowed if the goal is later
--      deactivated — this only gates creating new ones).
--   3. currency always matches the goal's currency — enforced by deriving
--      it here, not by rejecting a mismatched client-supplied value.
--
-- SECURITY INVOKER (the default — stated explicitly), same pattern as
-- 0005's validate_transaction(): runs as the calling user, so its own
-- lookup against goals stays governed by goals' RLS.
create or replace function public.validate_goal_contribution()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  goal_owner uuid;
  goal_currency text;
  goal_is_active boolean;
begin
  select user_id, currency, is_active into goal_owner, goal_currency, goal_is_active
  from public.goals where id = new.goal_id;

  if goal_owner is null or goal_owner <> auth.uid() then
    raise exception 'Goal not found';
  end if;

  if TG_OP = 'INSERT' and not goal_is_active then
    raise exception 'Cannot add a contribution to an inactive goal';
  end if;

  new.currency := goal_currency;

  return new;
end;
$$;

drop trigger if exists goal_contributions_validate on public.goal_contributions;
create trigger goal_contributions_validate
  before insert or update on public.goal_contributions
  for each row
  execute function public.validate_goal_contribution();

-- Keeps goals.current_amount as a live derived total. SECURITY INVOKER: the
-- UPDATE it issues against goals is itself governed by goals' own RLS
-- policy (auth.uid() = user_id), which already holds here because
-- validate_goal_contribution() only ever let this row through for a goal
-- the same user owns.
create or replace function public.sync_goal_current_amount()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if TG_OP = 'DELETE' then
    update public.goals
    set current_amount = coalesce((select sum(amount) from public.goal_contributions where goal_id = old.goal_id), 0)
    where id = old.goal_id and user_id = auth.uid();
    return old;
  end if;

  update public.goals
  set current_amount = coalesce((select sum(amount) from public.goal_contributions where goal_id = new.goal_id), 0)
  where id = new.goal_id and user_id = auth.uid();

  if TG_OP = 'UPDATE' and old.goal_id <> new.goal_id then
    update public.goals
    set current_amount = coalesce((select sum(amount) from public.goal_contributions where goal_id = old.goal_id), 0)
    where id = old.goal_id and user_id = auth.uid();
  end if;

  return new;
end;
$$;

drop trigger if exists goal_contributions_sync_current_amount on public.goal_contributions;
create trigger goal_contributions_sync_current_amount
  after insert or update or delete on public.goal_contributions
  for each row
  execute function public.sync_goal_current_amount();
