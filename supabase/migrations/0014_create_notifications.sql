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

create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can insert own notifications"
  on public.notifications for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);
