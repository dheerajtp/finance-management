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

create policy "Users can view own financial freedom settings"
  on public.financial_freedom_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own financial freedom settings"
  on public.financial_freedom_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own financial freedom settings"
  on public.financial_freedom_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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
