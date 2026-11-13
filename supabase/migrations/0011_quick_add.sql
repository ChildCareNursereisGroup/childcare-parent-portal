-- Children added by branch staff from existing (paper) records, and whether the
-- parent has already been sent the sign-in invitation e-mail.
alter table portal_registrations
  add column if not exists source text,
  add column if not exists invited_at timestamptz;
