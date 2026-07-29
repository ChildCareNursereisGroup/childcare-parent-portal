-- Monthly developmental evaluation per child (6 domains, 1-5 star ratings,
-- observation + next-step text per domain, follow-up flags). Same access
-- pattern as daily_reports: no RLS policies for anon/authenticated writes —
-- only the branch-admin edge function (service role) can insert/update.
create table if not exists monthly_evaluations (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references portal_registrations(id) on delete cascade,
  parent_user_id uuid,
  branch text not null,
  month text not null, -- 'YYYY-MM'
  teacher_name text,
  ratings jsonb not null default '{}'::jsonb,
  observations jsonb not null default '{}'::jsonb,
  next_steps jsonb not null default '{}'::jsonb,
  flags text[] not null default '{}',
  general_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (registration_id, month)
);
alter table monthly_evaluations enable row level security;

-- Parents can read only their own child's evaluations.
create policy "parents_select_own_evaluations" on monthly_evaluations
  for select
  to authenticated
  using (parent_user_id = auth.uid());

-- The main admin (smbkfamily@gmail.com) can read every evaluation too.
create policy "admin_select_all_evaluations" on monthly_evaluations
  for select
  to authenticated
  using (auth.jwt() ->> 'email' = 'smbkfamily@gmail.com');
