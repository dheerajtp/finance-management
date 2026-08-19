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

create policy "Users can view own budgets"
  on public.budgets for select
  using (auth.uid() = user_id);

create policy "Users can insert own budgets"
  on public.budgets for insert
  with check (auth.uid() = user_id);

create policy "Users can update own budgets"
  on public.budgets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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
