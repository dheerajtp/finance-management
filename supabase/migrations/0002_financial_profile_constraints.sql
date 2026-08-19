-- Tighten profiles constraints: non-empty name/currency, ISO-4217-shaped currency
-- code, non-negative money fields. Existing NOT NULL columns and RLS from 0001
-- are untouched. Money fields stay nullable — a profile row is created at
-- registration before income/savings are known.

alter table public.profiles
  add constraint profiles_name_not_blank check (btrim(name) <> '');

alter table public.profiles
  add constraint profiles_currency_not_blank check (btrim(currency) <> '');

alter table public.profiles
  add constraint profiles_currency_format check (currency ~ '^[A-Z]{3}$');

alter table public.profiles
  add constraint profiles_monthly_income_non_negative
    check (monthly_income is null or monthly_income >= 0);

alter table public.profiles
  add constraint profiles_monthly_savings_target_non_negative
    check (monthly_savings_target is null or monthly_savings_target >= 0);

alter table public.profiles
  alter column currency set default 'INR';
