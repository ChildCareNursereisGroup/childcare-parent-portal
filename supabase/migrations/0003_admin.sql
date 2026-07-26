-- Admin visibility + new-registration notification webhook.

create policy "admin can view all registrations"
  on public.portal_registrations
  for select
  to authenticated
  using (auth.jwt() ->> 'email' = 'smbkfamily@gmail.com');

create extension if not exists pg_net;

create or replace function public.notify_new_registration() returns trigger as $$
begin
  perform net.http_post(
    url := 'https://gsosfpjknvoqltzusmsu.supabase.co/functions/v1/notify-registration',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdzb3NmcGprbnZvcWx0enVzbXN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MDA4MTQsImV4cCI6MjA4NzQ3NjgxNH0.d2h2mi7rxzgC4vYgPKiFdh5OCVJk_mHlQ1SVaiTVauM'
    ),
    body := jsonb_build_object('type', 'INSERT', 'table', 'portal_registrations', 'record', to_jsonb(new))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger notify_new_registration_trigger
  after insert on public.portal_registrations
  for each row
  execute function public.notify_new_registration();
