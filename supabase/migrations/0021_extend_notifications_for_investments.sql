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
