-- FILE: 0001_create_profiles.sql
-- profiles: 1:1 with auth.users. `id` IS the auth user id (no surrogate key,
-- no separate user_id column) since a profile never exists independently of its user.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  currency text not null default 'USD',
  monthly_income numeric(14, 2),
  monthly_savings_target numeric(14, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_created_at_idx on public.profiles (created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- FILE: 0002_financial_profile_constraints.sql
-- Tighten profiles constraints: non-empty name/currency, ISO-4217-shaped currency
-- code, non-negative money fields. Existing NOT NULL columns and RLS from 0001
-- are untouched. Money fields stay nullable — a profile row is created at
-- registration before income/savings are known.

alter table public.profiles drop constraint if exists profiles_name_not_blank;
alter table public.profiles
  add constraint profiles_name_not_blank check (btrim(name) <> '');

alter table public.profiles drop constraint if exists profiles_currency_not_blank;
alter table public.profiles
  add constraint profiles_currency_not_blank check (btrim(currency) <> '');

alter table public.profiles drop constraint if exists profiles_currency_format;
alter table public.profiles
  add constraint profiles_currency_format check (currency ~ '^[A-Z]{3}$');

alter table public.profiles drop constraint if exists profiles_monthly_income_non_negative;
alter table public.profiles
  add constraint profiles_monthly_income_non_negative
    check (monthly_income is null or monthly_income >= 0);

alter table public.profiles drop constraint if exists profiles_monthly_savings_target_non_negative;
alter table public.profiles
  add constraint profiles_monthly_savings_target_non_negative
    check (monthly_savings_target is null or monthly_savings_target >= 0);

alter table public.profiles
  alter column currency set default 'INR';

-- FILE: 0003_create_accounts.sql
-- accounts: one row per user-owned account (bank, cash, credit card,
-- investment, other) — where the user's money currently exists.
--
-- Balance sign convention: for asset-type accounts (bank/cash/investment), a
-- positive balance is asset value. For credit_card, a positive balance is the
-- amount owed (a liability) — never stored as negative. See
-- src/constants/accountTypes.js for the classification the app uses to turn
-- this into assets vs. liabilities.

create extension if not exists "pgcrypto";

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null,
  balance numeric(14, 2) not null default 0,
  currency text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accounts_name_not_blank check (btrim(name) <> ''),
  constraint accounts_name_length check (char_length(name) <= 80),
  constraint accounts_type_supported check (type in ('bank', 'cash', 'credit_card', 'investment', 'other')),
  constraint accounts_balance_non_negative check (balance >= 0),
  constraint accounts_currency_format check (currency ~ '^[A-Z]{3}$')
);

create index if not exists accounts_user_id_idx on public.accounts (user_id);
create index if not exists accounts_user_id_is_active_idx on public.accounts (user_id, is_active);

-- Reuses the set_updated_at() trigger function created in 0001.
drop trigger if exists accounts_set_updated_at on public.accounts;
create trigger accounts_set_updated_at
  before update on public.accounts
  for each row
  execute function public.set_updated_at();

alter table public.accounts enable row level security;

drop policy if exists "Users can view own accounts" on public.accounts;
create policy "Users can view own accounts"
  on public.accounts for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own accounts" on public.accounts;
create policy "Users can insert own accounts"
  on public.accounts for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own accounts" on public.accounts;
create policy "Users can update own accounts"
  on public.accounts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own accounts" on public.accounts;
create policy "Users can delete own accounts"
  on public.accounts for delete
  using (auth.uid() = user_id);

-- FILE: 0004_create_categories.sql
-- categories: user-owned transaction categories (income / expense), with
-- expense categories further split into essential vs discretionary via
-- is_essential. Categories are user-owned rows, not globally shared, so each
-- user can freely rename/archive their own copy without affecting anyone else.
--
-- Uniqueness strategy: (user_id, name, type) is UNIQUE. This is the single
-- mechanism that both (a) stops a user from creating two categories with the
-- same name+type, and (b) makes default-category seeding idempotent — the
-- seed function below relies on "on conflict (user_id, name, type) do
-- nothing", so calling it any number of times never creates duplicates.

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null,
  is_essential boolean not null default false,
  is_active boolean not null default true,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_not_blank check (btrim(name) <> ''),
  constraint categories_name_length check (char_length(name) <= 60),
  constraint categories_type_supported check (type in ('income', 'expense')),
  -- income categories can never be flagged essential — that classification
  -- only means something for expenses.
  constraint categories_income_not_essential check (type <> 'income' or is_essential = false),
  constraint categories_user_name_type_unique unique (user_id, name, type)
);

create index if not exists categories_user_id_idx on public.categories (user_id);
create index if not exists categories_user_id_type_idx on public.categories (user_id, type);
create index if not exists categories_user_id_type_is_active_idx on public.categories (user_id, type, is_active);

-- Reuses the set_updated_at() trigger function created in 0001.
drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
  before update on public.categories
  for each row
  execute function public.set_updated_at();

alter table public.categories enable row level security;

drop policy if exists "Users can view own categories" on public.categories;
create policy "Users can view own categories"
  on public.categories for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own categories" on public.categories;
create policy "Users can insert own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own categories" on public.categories;
create policy "Users can update own categories"
  on public.categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own categories" on public.categories;
create policy "Users can delete own categories"
  on public.categories for delete
  using (auth.uid() = user_id);

-- Default category seeding.
--
-- SECURITY INVOKER (the default — stated explicitly for clarity): this
-- function runs with the CALLING user's own privileges, not elevated ones.
-- The inserts below still go through RLS exactly as if the client had run
-- them directly, so no service-role key or elevated grant is needed. The
-- unique (user_id, name, type) constraint + "on conflict ... do nothing"
-- make repeated calls a no-op after the first.
create or replace function public.initialize_default_categories()
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'initialize_default_categories() requires an authenticated user';
  end if;

  insert into public.categories (user_id, name, type, is_essential, is_system)
  select auth.uid(), d.name, d.type, d.is_essential, true
  from (values
    ('Salary', 'income', false),
    ('Freelance', 'income', false),
    ('Business', 'income', false),
    ('Interest', 'income', false),
    ('Other Income', 'income', false),
    ('Housing', 'expense', true),
    ('Utilities', 'expense', true),
    ('Groceries', 'expense', true),
    ('Transportation', 'expense', true),
    ('Healthcare', 'expense', true),
    ('Insurance', 'expense', true),
    ('Debt Payment', 'expense', true),
    ('Education', 'expense', true),
    ('Childcare', 'expense', true),
    ('Other Essential', 'expense', true),
    ('Dining Out', 'expense', false),
    ('Shopping', 'expense', false),
    ('Entertainment', 'expense', false),
    ('Subscriptions', 'expense', false),
    ('Travel', 'expense', false),
    ('Hobbies', 'expense', false),
    ('Other Discretionary', 'expense', false)
  ) as d(name, type, is_essential)
  on conflict (user_id, name, type) do nothing;
end;
$$;

grant execute on function public.initialize_default_categories() to authenticated;

-- FILE: 0005_create_transactions.sql
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

drop policy if exists "Users can view own transactions" on public.transactions;
create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own transactions" on public.transactions;
create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own transactions" on public.transactions;
create policy "Users can update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own transactions" on public.transactions;
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

-- FILE: 0006_create_emergency_fund_settings.sql
-- emergency_fund_settings: one settings row per user (target duration,
-- planned monthly contribution, and which account represents the fund).
-- Unlike profiles, this table keeps its own uuid PK (per the task spec)
-- rather than reusing auth.users.id directly, with a UNIQUE(user_id) doing
-- the "at most one row per user" job instead.

create table if not exists public.emergency_fund_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  target_months integer not null default 6,
  monthly_contribution numeric(14, 2) not null default 0,
  emergency_account_id uuid references public.accounts (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint emergency_fund_settings_user_unique unique (user_id),
  constraint emergency_fund_settings_target_months_supported check (target_months in (3, 6, 9, 12)),
  constraint emergency_fund_settings_contribution_non_negative check (monthly_contribution >= 0)
);

create index if not exists emergency_fund_settings_user_id_idx on public.emergency_fund_settings (user_id);

-- Reuses the set_updated_at() trigger function created in 0001.
drop trigger if exists emergency_fund_settings_set_updated_at on public.emergency_fund_settings;
create trigger emergency_fund_settings_set_updated_at
  before update on public.emergency_fund_settings
  for each row
  execute function public.set_updated_at();

alter table public.emergency_fund_settings enable row level security;

drop policy if exists "Users can view own emergency fund settings" on public.emergency_fund_settings;
create policy "Users can view own emergency fund settings"
  on public.emergency_fund_settings for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own emergency fund settings" on public.emergency_fund_settings;
create policy "Users can insert own emergency fund settings"
  on public.emergency_fund_settings for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own emergency fund settings" on public.emergency_fund_settings;
create policy "Users can update own emergency fund settings"
  on public.emergency_fund_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- The UI doesn't expose delete for this MVP, but the policy stays consistent
-- with every other user-owned settings table in this project.
drop policy if exists "Users can delete own emergency fund settings" on public.emergency_fund_settings;
create policy "Users can delete own emergency fund settings"
  on public.emergency_fund_settings for delete
  using (auth.uid() = user_id);

-- CHECK constraints can't see other tables, so the cross-table rules —
-- selected account belongs to this user, is active, is bank/cash, and
-- matches the user's profile currency — are enforced here instead.
-- SECURITY INVOKER (the default, stated explicitly): runs as the calling
-- user, so its lookups against accounts/profiles stay governed by those
-- tables' own RLS (same pattern as 0004's initialize_default_categories()
-- and 0005's validate_transaction()).
create or replace function public.validate_emergency_fund_settings()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  account_owner uuid;
  account_type text;
  account_currency text;
  account_active boolean;
  profile_currency text;
begin
  if new.emergency_account_id is null then
    return new;
  end if;

  select user_id, type, currency, is_active
    into account_owner, account_type, account_currency, account_active
  from public.accounts
  where id = new.emergency_account_id;

  if account_owner is null or account_owner <> auth.uid() then
    raise exception 'Emergency fund account not found';
  end if;

  if not account_active then
    raise exception 'Emergency fund account must be active';
  end if;

  if account_type not in ('bank', 'cash') then
    raise exception 'Emergency fund account must be a bank or cash account';
  end if;

  select currency into profile_currency from public.profiles where id = auth.uid();

  if profile_currency is not null and account_currency <> profile_currency then
    raise exception 'Emergency fund account must use your profile currency';
  end if;

  return new;
end;
$$;

drop trigger if exists emergency_fund_settings_validate on public.emergency_fund_settings;
create trigger emergency_fund_settings_validate
  before insert or update on public.emergency_fund_settings
  for each row
  execute function public.validate_emergency_fund_settings();

-- FILE: 0007_create_goals.sql
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

drop policy if exists "Users can view own goals" on public.goals;
create policy "Users can view own goals"
  on public.goals for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own goals" on public.goals;
create policy "Users can insert own goals"
  on public.goals for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own goals" on public.goals;
create policy "Users can update own goals"
  on public.goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own goals" on public.goals;
create policy "Users can delete own goals"
  on public.goals for delete
  using (auth.uid() = user_id);

-- FILE: 0008_create_financial_freedom_settings.sql
-- financial_freedom_settings: one settings row per user. Only assumptions
-- are persisted (multiplier, analysis window, assumed return, an optional
-- contribution override, and which accounts count as FI assets) — every
-- calculated value (target, progress, projection) is always re-derived from
-- current data, never stored.

create table if not exists public.financial_freedom_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  fi_multiplier integer not null default 25,
  analysis_months integer not null default 6,
  expected_annual_return numeric(5, 2) not null default 6,
  monthly_contribution numeric(14, 2),
  selected_account_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financial_freedom_settings_user_unique unique (user_id),
  constraint financial_freedom_settings_multiplier_supported check (fi_multiplier in (20, 25, 30)),
  constraint financial_freedom_settings_analysis_months_supported check (analysis_months in (3, 6, 12)),
  constraint financial_freedom_settings_return_range
    check (expected_annual_return >= 0 and expected_annual_return <= 100),
  constraint financial_freedom_settings_contribution_non_negative
    check (monthly_contribution is null or monthly_contribution >= 0)
);

-- Reuses the set_updated_at() trigger function created in 0001.
drop trigger if exists financial_freedom_settings_set_updated_at on public.financial_freedom_settings;
create trigger financial_freedom_settings_set_updated_at
  before update on public.financial_freedom_settings
  for each row
  execute function public.set_updated_at();

alter table public.financial_freedom_settings enable row level security;

drop policy if exists "Users can view own financial freedom settings" on public.financial_freedom_settings;
create policy "Users can view own financial freedom settings"
  on public.financial_freedom_settings for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own financial freedom settings" on public.financial_freedom_settings;
create policy "Users can insert own financial freedom settings"
  on public.financial_freedom_settings for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own financial freedom settings" on public.financial_freedom_settings;
create policy "Users can update own financial freedom settings"
  on public.financial_freedom_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own financial freedom settings" on public.financial_freedom_settings;
create policy "Users can delete own financial freedom settings"
  on public.financial_freedom_settings for delete
  using (auth.uid() = user_id);

-- selected_account_ids is an array, so no single-row CHECK constraint or FK
-- can validate its members against another table. This trigger does it
-- instead: every id must resolve to an account owned by the caller with an
-- eligible type. SECURITY INVOKER (the default, stated explicitly) — the
-- lookup runs under the caller's own session, governed by accounts' RLS,
-- same pattern as every other cross-table trigger in this project (0004,
-- 0005, 0006).
--
-- Currency is deliberately NOT enforced here (unlike 0006's emergency fund
-- account, which rejects a currency mismatch outright): a user may
-- legitimately select accounts in multiple currencies, and the application
-- excludes non-primary-currency selections from the actual FI sum with a
-- visible notice rather than blocking the selection itself.
create or replace function public.validate_financial_freedom_settings()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  invalid_count integer;
begin
  if new.selected_account_ids is null or array_length(new.selected_account_ids, 1) is null then
    return new;
  end if;

  select count(*)
  into invalid_count
  from unnest(new.selected_account_ids) as account_id
  where not exists (
    select 1 from public.accounts a
    where a.id = account_id
      and a.user_id = auth.uid()
      and a.type in ('bank', 'cash', 'investment')
  );

  if invalid_count > 0 then
    raise exception 'Selected financial independence accounts must belong to you and be a bank, cash, or investment account';
  end if;

  return new;
end;
$$;

drop trigger if exists financial_freedom_settings_validate on public.financial_freedom_settings;
create trigger financial_freedom_settings_validate
  before insert or update on public.financial_freedom_settings
  for each row
  execute function public.validate_financial_freedom_settings();

-- FILE: 0009_create_budgets.sql
-- budgets: user-defined monthly spending limits per category. The budget
-- definition is persistent; actual monthly spending is always derived from
-- transactions at read time — no monthly budget rows are created or stored.

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  amount numeric(14, 2) not null,
  currency text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budgets_amount_positive check (amount > 0),
  constraint budgets_currency_format check (currency ~ '^[A-Z]{3}$')
);

-- Partial (not table-level) unique index: uniqueness only applies among
-- ACTIVE budgets. A table-level UNIQUE(user_id, category_id, currency) would
-- permanently block recreating a budget for a category after deactivating
-- the old one — the task explicitly wants deactivate-then-recreate to work,
-- same as accounts/categories/goals.
create unique index if not exists budgets_user_category_currency_active_unique
  on public.budgets (user_id, category_id, currency)
  where is_active;

create index if not exists budgets_user_id_idx on public.budgets (user_id);
create index if not exists budgets_user_id_is_active_idx on public.budgets (user_id, is_active);
create index if not exists budgets_user_id_category_id_idx on public.budgets (user_id, category_id);

-- Reuses the set_updated_at() trigger function created in 0001.
drop trigger if exists budgets_set_updated_at on public.budgets;
create trigger budgets_set_updated_at
  before update on public.budgets
  for each row
  execute function public.set_updated_at();

alter table public.budgets enable row level security;

drop policy if exists "Users can view own budgets" on public.budgets;
create policy "Users can view own budgets"
  on public.budgets for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own budgets" on public.budgets;
create policy "Users can insert own budgets"
  on public.budgets for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own budgets" on public.budgets;
create policy "Users can update own budgets"
  on public.budgets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own budgets" on public.budgets;
create policy "Users can delete own budgets"
  on public.budgets for delete
  using (auth.uid() = user_id);

-- Cross-table validation a CHECK/FK can't express: the category must belong
-- to the caller and be an expense category. SECURITY INVOKER (the default,
-- stated explicitly) — governed by categories' own RLS, same pattern as
-- every other cross-table trigger in this project (0004, 0005, 0006, 0008).
--
-- Category-active is only enforced on INSERT, not UPDATE: a budget must
-- survive its category later being deactivated (the task explicitly wants
-- "Category inactive" shown in the UI with the budget still editable/
-- deactivatable, not blocked or auto-deleted).
create or replace function public.validate_budget()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  category_owner uuid;
  category_type text;
  category_active boolean;
begin
  select user_id, type, is_active
    into category_owner, category_type, category_active
  from public.categories
  where id = new.category_id;

  if category_owner is null or category_owner <> auth.uid() then
    raise exception 'Category not found';
  end if;

  if category_type <> 'expense' then
    raise exception 'Budgets can only be created for expense categories';
  end if;

  if TG_OP = 'INSERT' and not category_active then
    raise exception 'Cannot create a budget for an inactive category';
  end if;

  return new;
end;
$$;

drop trigger if exists budgets_validate on public.budgets;
create trigger budgets_validate
  before insert or update on public.budgets
  for each row
  execute function public.validate_budget();

-- FILE: 0010_create_goal_contributions.sql
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

drop policy if exists "Users can view own goal contributions" on public.goal_contributions;
create policy "Users can view own goal contributions"
  on public.goal_contributions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own goal contributions" on public.goal_contributions;
create policy "Users can insert own goal contributions"
  on public.goal_contributions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own goal contributions" on public.goal_contributions;
create policy "Users can update own goal contributions"
  on public.goal_contributions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own goal contributions" on public.goal_contributions;
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

-- FILE: 0011_create_subscriptions.sql
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

drop policy if exists "Users can view own subscriptions" on public.subscriptions;
create policy "Users can view own subscriptions"
  on public.subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own subscriptions" on public.subscriptions;
create policy "Users can insert own subscriptions"
  on public.subscriptions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own subscriptions" on public.subscriptions;
create policy "Users can update own subscriptions"
  on public.subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own subscriptions" on public.subscriptions;
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

-- FILE: 0012_create_recurring_transactions.sql
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

drop policy if exists "Users can view own recurring transactions" on public.recurring_transactions;
create policy "Users can view own recurring transactions"
  on public.recurring_transactions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own recurring transactions" on public.recurring_transactions;
create policy "Users can insert own recurring transactions"
  on public.recurring_transactions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own recurring transactions" on public.recurring_transactions;
create policy "Users can update own recurring transactions"
  on public.recurring_transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own recurring transactions" on public.recurring_transactions;
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

-- FILE: 0013_create_goal_transaction_allocations.sql
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

drop policy if exists "Users can view own goal transaction allocations" on public.goal_transaction_allocations;
create policy "Users can view own goal transaction allocations"
  on public.goal_transaction_allocations for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own goal transaction allocations" on public.goal_transaction_allocations;
create policy "Users can insert own goal transaction allocations"
  on public.goal_transaction_allocations for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own goal transaction allocations" on public.goal_transaction_allocations;
create policy "Users can update own goal transaction allocations"
  on public.goal_transaction_allocations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own goal transaction allocations" on public.goal_transaction_allocations;
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

-- FILE: 0014_create_notifications.sql
-- notifications: informational, in-app only. Nothing in this migration (or
-- anything that writes to this table) ever creates a transaction, changes
-- accounts.balance, or mutates any other feature's data — a notification
-- is a read-only observation about data that already exists elsewhere,
-- generated client-side by utils/finance/notificationRules.js and persisted
-- via useNotificationSync (see task notes). entity_id is deliberately a
-- plain uuid, not a foreign key: entity_type varies per notification type
-- (goal, budget, recurring transaction, ...), so a single FK can't target
-- the right table — it's informational only, used for deep-linking.
--
-- dedupe_key is the actual duplicate-prevention mechanism: it encodes the
-- specific event (e.g. 'recurring_due:{id}:{occurrence_date}',
-- 'goal_milestone:{id}:{milestone}') so the same event can never produce a
-- second row for the same user, enforced by the unique index below — not
-- just by client-side "did I already see this" logic.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  severity text not null default 'info',
  entity_type text,
  entity_id uuid,
  action_path text,
  dedupe_key text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  expires_at timestamptz,
  constraint notifications_type_supported check (
    type in (
      'recurring_due',
      'recurring_overdue',
      'subscription_upcoming',
      'subscription_due',
      'budget_attention',
      'budget_over_limit',
      'goal_milestone',
      'goal_target_reached',
      'emergency_fund_milestone',
      'emergency_fund_target_reached',
      'profile_incomplete',
      'financial_freedom_insufficient_history'
    )
  ),
  constraint notifications_severity_supported check (severity in ('info', 'success', 'warning')),
  constraint notifications_title_not_blank check (btrim(title) <> ''),
  constraint notifications_title_length check (char_length(title) <= 150),
  constraint notifications_message_length check (char_length(message) <= 280),
  constraint notifications_action_path_format check (action_path is null or action_path ~ '^/'),
  constraint notifications_dedupe_key_not_blank check (btrim(dedupe_key) <> '')
);

-- The actual duplicate-prevention backstop — not merely an index for query
-- speed. A second insert for the same (user, event) is rejected by the
-- database itself, regardless of what the client believes it already sent.
create unique index if not exists notifications_user_id_dedupe_key_unique
  on public.notifications (user_id, dedupe_key);

create index if not exists notifications_user_id_idx on public.notifications (user_id);
create index if not exists notifications_user_id_is_read_idx on public.notifications (user_id, is_read);
create index if not exists notifications_user_id_created_at_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_id_type_idx on public.notifications (user_id, type);

alter table public.notifications enable row level security;

drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own notifications" on public.notifications;
create policy "Users can insert own notifications"
  on public.notifications for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own notifications" on public.notifications;
create policy "Users can delete own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);

-- FILE: 0015_create_notification_preferences.sql
-- notification_preferences: one row per user, each column a per-domain
-- on/off switch. useNotificationSync (see 0014 notes) checks these before
-- persisting a candidate notification — turning a domain off stops new
-- notifications of that kind from being created, it never deletes ones
-- that already exist.

create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  recurring_transactions boolean not null default true,
  subscriptions boolean not null default true,
  budgets boolean not null default true,
  goals boolean not null default true,
  emergency_fund boolean not null default true,
  financial_freedom boolean not null default true,
  profile boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notification_preferences_user_id_idx on public.notification_preferences (user_id);

-- Reuses the set_updated_at() trigger function created in 0001.
drop trigger if exists notification_preferences_set_updated_at on public.notification_preferences;
create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row
  execute function public.set_updated_at();

alter table public.notification_preferences enable row level security;

drop policy if exists "Users can view own notification preferences" on public.notification_preferences;
create policy "Users can view own notification preferences"
  on public.notification_preferences for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own notification preferences" on public.notification_preferences;
create policy "Users can insert own notification preferences"
  on public.notification_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own notification preferences" on public.notification_preferences;
create policy "Users can update own notification preferences"
  on public.notification_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own notification preferences" on public.notification_preferences;
create policy "Users can delete own notification preferences"
  on public.notification_preferences for delete
  using (auth.uid() = user_id);

-- FILE: 0016_create_investment_holdings.sql
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

drop policy if exists "Users can view own investment holdings" on public.investment_holdings;
create policy "Users can view own investment holdings"
  on public.investment_holdings for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own investment holdings" on public.investment_holdings;
create policy "Users can insert own investment holdings"
  on public.investment_holdings for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own investment holdings" on public.investment_holdings;
create policy "Users can update own investment holdings"
  on public.investment_holdings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own investment holdings" on public.investment_holdings;
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

-- FILE: 0017_create_investment_plans.sql
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

drop policy if exists "Users can view own investment plans" on public.investment_plans;
create policy "Users can view own investment plans"
  on public.investment_plans for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own investment plans" on public.investment_plans;
create policy "Users can insert own investment plans"
  on public.investment_plans for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own investment plans" on public.investment_plans;
create policy "Users can update own investment plans"
  on public.investment_plans for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own investment plans" on public.investment_plans;
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

-- FILE: 0018_create_investment_contributions.sql
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

drop policy if exists "Users can view own investment contributions" on public.investment_contributions;
create policy "Users can view own investment contributions"
  on public.investment_contributions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own investment contributions" on public.investment_contributions;
create policy "Users can insert own investment contributions"
  on public.investment_contributions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own investment contributions" on public.investment_contributions;
create policy "Users can update own investment contributions"
  on public.investment_contributions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own investment contributions" on public.investment_contributions;
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

-- FILE: 0019_extend_transactions_for_investments.sql
-- Extends 0005's transactions table with a 4th type: 'investment'. Reuses
-- the exact same row shape 'transfer' already has (account_id +
-- destination_account_id, no category_id) — an investment transaction IS
-- an account-to-account movement, just one where the destination is
-- specifically an investment account and the money is never counted as
-- income or expense. This is additive only: existing income/expense/
-- transfer rows and behavior are completely unchanged, and this migration
-- never edits 0005's file, only supersedes its function/constraints via
-- create-or-replace / drop-and-recreate, the normal way to evolve a
-- constraint across migrations.

alter table public.transactions drop constraint transactions_type_supported;
alter table public.transactions add constraint transactions_type_supported
  check (type in ('income', 'expense', 'transfer', 'investment'));

alter table public.transactions drop constraint transactions_type_shape;
alter table public.transactions add constraint transactions_type_shape check (
  (type in ('income', 'expense') and category_id is not null and destination_account_id is null)
  or
  (type in ('transfer', 'investment') and category_id is null and destination_account_id is not null)
);

-- Adds one rule on top of 0005's validate_transaction(): when type =
-- 'investment', the destination account must itself be an investment-type
-- account (0003's accounts.type = 'investment') — you can't "invest into"
-- a bank or cash account. Everything else (ownership, currency matching,
-- category validation) is unchanged from 0005.
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
  destination_type text;
  category_owner uuid;
  category_type text;
begin
  select user_id, currency into account_owner, account_currency
  from public.accounts where id = new.account_id;

  if account_owner is null or account_owner <> auth.uid() then
    raise exception 'Account not found';
  end if;

  if new.destination_account_id is not null then
    select user_id, currency, type into destination_owner, destination_currency, destination_type
    from public.accounts where id = new.destination_account_id;

    if destination_owner is null or destination_owner <> auth.uid() then
      raise exception 'Destination account not found';
    end if;

    if destination_currency <> account_currency then
      raise exception 'Cannot transfer between accounts with different currencies';
    end if;

    if new.type = 'investment' and destination_type <> 'investment' then
      raise exception 'Destination account must be an investment account';
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

-- FILE: 0020_add_investment_notification_preference.sql
-- Adds the 8th per-domain toggle to 0015's notification_preferences,
-- matching every existing column's shape exactly (not null, default true
-- so existing rows opt in automatically rather than silently losing
-- coverage for a domain that didn't exist when their row was created).

alter table public.notification_preferences
  add column if not exists investments boolean not null default true;

-- FILE: 0021_extend_notifications_for_investments.sql
-- Adds the two investment SIP notification types alongside the existing
-- ones — same "supersede via CREATE OR REPLACE / drop+add constraint in a
-- new migration" pattern used by 0019 for validate_transaction(), never
-- editing 0014's file directly.

alter table public.notifications
  drop constraint notifications_type_supported;

alter table public.notifications
  add constraint notifications_type_supported check (
    type in (
      'recurring_due',
      'recurring_overdue',
      'subscription_upcoming',
      'subscription_due',
      'budget_attention',
      'budget_over_limit',
      'goal_milestone',
      'goal_target_reached',
      'emergency_fund_milestone',
      'emergency_fund_target_reached',
      'profile_incomplete',
      'financial_freedom_insufficient_history',
      'investment_due',
      'investment_overdue'
    )
  );

-- FILE: 0022_create_spending_plan_settings.sql
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

drop policy if exists "Users can view own spending plan settings" on public.spending_plan_settings;
create policy "Users can view own spending plan settings"
  on public.spending_plan_settings for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own spending plan settings" on public.spending_plan_settings;
create policy "Users can insert own spending plan settings"
  on public.spending_plan_settings for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own spending plan settings" on public.spending_plan_settings;
create policy "Users can update own spending plan settings"
  on public.spending_plan_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own spending plan settings" on public.spending_plan_settings;
create policy "Users can delete own spending plan settings"
  on public.spending_plan_settings for delete
  using (auth.uid() = user_id);
