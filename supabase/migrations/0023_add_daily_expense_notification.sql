-- Adds daily expense reminder notifications (in-app + browser push).
-- 1) New per-domain toggle to 0015's notification_preferences.
-- 2) New notification type to 0014's check constraint.

alter table public.notification_preferences
  add column if not exists daily_expenses boolean not null default true;

-- Extend allowed notification types to include daily_expense_reminder.
-- Recreate the check constraint with the new value added.
alter table public.notifications drop constraint if exists notifications_type_supported;

alter table public.notifications add constraint notifications_type_supported check (
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
    'investment_overdue',
    'daily_expense_reminder'
  )
);
