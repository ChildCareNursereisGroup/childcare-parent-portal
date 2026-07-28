-- Branch admin passwords: locked down, no RLS policies at all so anon/authenticated
-- clients can never read or write this table directly. Only service-role edge
-- functions (branch-admin) touch it.
create table if not exists branch_admin_passwords (
  branch text primary key,
  password text not null,
  updated_at timestamptz not null default now()
);
alter table branch_admin_passwords enable row level security;

insert into branch_admin_passwords (branch, password) values
  ('farha', 'CASYQ73B'),
  ('saada', '4UWCJKXY'),
  ('dolphin', 'EVP5WHHQ'),
  ('saadakids', '5HAH9XDX'),
  ('abtal', 'J2E8ZC4G')
on conflict (branch) do nothing;

-- Short-lived session tokens issued after a successful branch password check.
create table if not exists branch_sessions (
  token uuid primary key default gen_random_uuid(),
  branch text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '12 hours')
);
alter table branch_sessions enable row level security;

-- Classes (فصول) per branch.
create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  branch text not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique (branch, name)
);
alter table classes enable row level security;

alter table portal_registrations
  add column if not exists class_id uuid references classes(id) on delete set null;

-- Daily food/sleep/activity reports per child.
create table if not exists daily_reports (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references portal_registrations(id) on delete cascade,
  parent_user_id uuid,
  branch text not null,
  report_date date not null default current_date,
  meals text,
  sleep text,
  activity text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (registration_id, report_date)
);
alter table daily_reports enable row level security;

-- Parents can read only their own child's reports.
create policy "parents_select_own_reports" on daily_reports
  for select
  to authenticated
  using (parent_user_id = auth.uid());

-- The main admin (smbkfamily@gmail.com) can read every report too.
create policy "admin_select_all_reports" on daily_reports
  for select
  to authenticated
  using (auth.jwt() ->> 'email' = 'smbkfamily@gmail.com');
