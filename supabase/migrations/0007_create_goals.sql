-- goals: user-owned savings goals with a manually maintained current_amount.
-- No transaction-to-goal allocation exists yet (deliberately out of scope —
-- see task notes), so current_amount is purely user-entered, same spirit as
-- accounts.balance being a manual snapshot rather than transaction-derived.
--
-- `type` isn't in the task's literal DATABASE field list but is required by
-- every other section of the spec (validation, form, card display) — added
-- here since the rest of the module assumes it exists.

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null default 'other',
  description text,
  target_amount numeric(14, 2) not null,
  current_amount numeric(14, 2) not null default 0,
  currency text not null,
  target_date date,
  priority integer not null default 2,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goals_name_not_blank check (btrim(name) <> ''),
  constraint goals_name_length check (char_length(name) <= 80),
  constraint goals_description_length check (description is null or char_length(description) <= 280),
  constraint goals_type_supported check (
    type in ('emergency_fund', 'vacation', 'car', 'house', 'education', 'investment', 'personal', 'other')
  ),
  constraint goals_target_amount_positive check (target_amount > 0),
  constraint goals_current_amount_non_negative check (current_amount >= 0),
  constraint goals_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint goals_priority_supported check (priority in (1, 2, 3))
);

-- Deliberately no "target_date >= today" CHECK: that's a rule for the moment
-- the date is *set* (enforced client-side in goal.validation.js), not a
-- permanent row invariant — a CHECK would block unrelated edits (e.g.
-- bumping current_amount) on a goal whose date has since passed while it
-- was still active.

create index if not exists goals_user_id_idx on public.goals (user_id);
create index if not exists goals_user_id_is_active_idx on public.goals (user_id, is_active);
create index if not exists goals_user_id_priority_idx on public.goals (user_id, priority);

-- Reuses the set_updated_at() trigger function created in 0001.
drop trigger if exists goals_set_updated_at on public.goals;
create trigger goals_set_updated_at
  before update on public.goals
  for each row
  execute function public.set_updated_at();

alter table public.goals enable row level security;

create policy "Users can view own goals"
  on public.goals for select
  using (auth.uid() = user_id);

create policy "Users can insert own goals"
  on public.goals for insert
  with check (auth.uid() = user_id);

create policy "Users can update own goals"
  on public.goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own goals"
  on public.goals for delete
  using (auth.uid() = user_id);
