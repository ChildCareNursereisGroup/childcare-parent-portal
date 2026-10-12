-- Parent partnership (SPEA indicators 2.4 / 4.3): quarterly parent survey +
-- complaints/feedback log + manager's "you said, we did" note per month.
-- All writes go through edge functions (service role): no anon/authenticated
-- write policies. Only the main admin can read everything directly.

create table if not exists parent_surveys (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references portal_registrations(id) on delete cascade,
  parent_user_id uuid,
  branch text not null,
  period text not null,                         -- '2026-Q4'
  answers jsonb not null default '{}'::jsonb,   -- { questionId: 1..5 }
  nps int,                                      -- 0..10
  positive text,
  improve text,
  anonymous boolean not null default false,
  lang text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (registration_id, period)
);
alter table parent_surveys enable row level security;
drop policy if exists "admin_select_all_surveys" on parent_surveys;
create policy "admin_select_all_surveys" on parent_surveys
  for select to authenticated
  using (auth.jwt() ->> 'email' = 'smbkfamily@gmail.com');

create sequence if not exists feedback_case_seq;

create table if not exists feedback_cases (
  id uuid primary key default gen_random_uuid(),
  ref text not null default ('FB-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('feedback_case_seq')::text, 4, '0')),
  registration_id uuid references portal_registrations(id) on delete set null,
  parent_user_id uuid,
  branch text not null,
  parent_name text,
  contact text,
  child_name text,
  source text not null default 'portal',        -- portal | phone | whatsapp | in_person | other
  kind text not null default 'complaint',       -- complaint | suggestion | compliment
  category text not null default 'other',
  subject text,
  description text,
  sensitive boolean not null default false,
  status text not null default 'new',           -- new | review | action | resolved
  action_taken text,
  parent_satisfied boolean,
  received_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  created_by text not null default 'parent',    -- parent | staff
  updated_at timestamptz not null default now()
);
alter table feedback_cases enable row level security;
drop policy if exists "admin_select_all_cases" on feedback_cases;
create policy "admin_select_all_cases" on feedback_cases
  for select to authenticated
  using (auth.jwt() ->> 'email' = 'smbkfamily@gmail.com');
create index if not exists feedback_cases_branch_idx on feedback_cases (branch, received_at desc);

create table if not exists partnership_notes (
  branch text not null,
  month text not null,                          -- 'YYYY-MM'
  you_said_we_did text,
  updated_at timestamptz not null default now(),
  primary key (branch, month)
);
alter table partnership_notes enable row level security;
