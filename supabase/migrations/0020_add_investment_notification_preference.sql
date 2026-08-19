-- Adds the 8th per-domain toggle to 0015's notification_preferences,
-- matching every existing column's shape exactly (not null, default true
-- so existing rows opt in automatically rather than silently losing
-- coverage for a domain that didn't exist when their row was created).

alter table public.notification_preferences
  add column if not exists investments boolean not null default true;
