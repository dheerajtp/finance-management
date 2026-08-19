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

create policy "Users can view own notification preferences"
  on public.notification_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert own notification preferences"
  on public.notification_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notification preferences"
  on public.notification_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own notification preferences"
  on public.notification_preferences for delete
  using (auth.uid() = user_id);
