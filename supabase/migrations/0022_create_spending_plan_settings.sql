-- spending_plan_settings: one row per user holding how their Safe-to-Spend
-- capacity is split across the 6 fixed flexible-spending buckets (see
-- constants/flexibleSpending.js). A single row with 6 percentage columns is
-- the smallest clean schema for this — the buckets are fixed, not
-- user-defined, so a child "allocations" table (one row per bucket) would
-- only add joins for no real flexibility gained. No cross-table references
-- exist here (unlike emergency_fund_settings' account link), so there is no
-- SECURITY INVOKER validation trigger to add — RLS + CHECK constraints are
-- the whole story.

create table if not exists public.spending_plan_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  food_percentage numeric(5, 2) not null default 30,
  travel_percentage numeric(5, 2) not null default 20,
  entertainment_percentage numeric(5, 2) not null default 15,
  shopping_percentage numeric(5, 2) not null default 15,
  personal_percentage numeric(5, 2) not null default 10,
  other_percentage numeric(5, 2) not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint spending_plan_settings_user_unique unique (user_id),
  constraint spending_plan_settings_food_range check (food_percentage >= 0 and food_percentage <= 100),
  constraint spending_plan_settings_travel_range check (travel_percentage >= 0 and travel_percentage <= 100),
  constraint spending_plan_settings_entertainment_range check (entertainment_percentage >= 0 and entertainment_percentage <= 100),
  constraint spending_plan_settings_shopping_range check (shopping_percentage >= 0 and shopping_percentage <= 100),
  constraint spending_plan_settings_personal_range check (personal_percentage >= 0 and personal_percentage <= 100),
  constraint spending_plan_settings_other_range check (other_percentage >= 0 and other_percentage <= 100),
  -- The UI already blocks saving over 100% (see safeToSpend.js /
  -- AllocationForm), but the database is the real boundary — never trust
  -- the browser alone.
  constraint spending_plan_settings_total_not_over_100 check (
    food_percentage + travel_percentage + entertainment_percentage + shopping_percentage + personal_percentage + other_percentage <= 100
  )
);

create index if not exists spending_plan_settings_user_id_idx on public.spending_plan_settings (user_id);

-- Reuses the set_updated_at() trigger function created in 0001.
drop trigger if exists spending_plan_settings_set_updated_at on public.spending_plan_settings;
create trigger spending_plan_settings_set_updated_at
  before update on public.spending_plan_settings
  for each row
  execute function public.set_updated_at();

alter table public.spending_plan_settings enable row level security;

create policy "Users can view own spending plan settings"
  on public.spending_plan_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own spending plan settings"
  on public.spending_plan_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own spending plan settings"
  on public.spending_plan_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own spending plan settings"
  on public.spending_plan_settings for delete
  using (auth.uid() = user_id);
