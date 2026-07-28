-- Marks a daily report as "absent" (child didn't attend, no meals/sleep/
-- activity to log). status on portal_registrations already accepts any text
-- value ('pending' | 'approved' so far); branch admins can now also set it
-- to 'stopped' when a parent withdraws their child, which immediately hides
-- the parent's data (handled in the app, not RLS, since the parent's SELECT
-- policy already scopes to their own row regardless of status).

alter table daily_reports add column if not exists absent boolean not null default false;
