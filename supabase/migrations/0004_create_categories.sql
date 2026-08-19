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

create policy "Users can view own categories"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Users can insert own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own categories"
  on public.categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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
