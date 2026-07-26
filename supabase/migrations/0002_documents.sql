-- Adds document-upload support to the parent portal registration form.

alter table public.portal_registrations
  add column if not exists documents jsonb;

-- Private storage bucket for uploaded ID/photo/vaccination documents.
insert into storage.buckets (id, name, public)
values ('registration-documents', 'registration-documents', false)
on conflict (id) do nothing;

-- Anyone (including not-yet-logged-in parents) can upload a document while
-- filling out the registration form. No read/list policy is granted, so
-- uploaded files stay private — only visible via the Supabase dashboard
-- (service role) or later, to the parent themselves, once we build that.
create policy "anyone can upload registration documents"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'registration-documents');
