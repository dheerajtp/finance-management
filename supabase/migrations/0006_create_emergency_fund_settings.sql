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

create policy "Users can view own emergency fund settings"
  on public.emergency_fund_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own emergency fund settings"
  on public.emergency_fund_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own emergency fund settings"
  on public.emergency_fund_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- The UI doesn't expose delete for this MVP, but the policy stays consistent
-- with every other user-owned settings table in this project.
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
