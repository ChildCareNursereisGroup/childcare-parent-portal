-- Parent Portal tables, isolated from the existing Index payments/attendance
-- tables. Nothing here touches or references those.

create table if not exists public.portal_registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  branch text not null default 'farha',
  contact_email text,
  parent_user_id uuid references auth.users(id) on delete set null,
  form_data jsonb not null,
  status text not null default 'pending'
);

alter table public.portal_registrations enable row level security;

-- Anyone (including not-yet-logged-in parents) can submit a registration.
create policy "anyone can submit a registration"
  on public.portal_registrations
  for insert
  to anon, authenticated
  with check (true);

-- A logged-in parent can see registrations they submitted while authenticated.
create policy "parents can view their own registrations"
  on public.portal_registrations
  for select
  to authenticated
  using (parent_user_id = auth.uid());

-- No update/delete policies: only the Index/admin team (via the Supabase
-- dashboard, which uses the service role and bypasses RLS) can manage rows.
