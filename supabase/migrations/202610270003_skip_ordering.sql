-- Run in the Supabase SQL Editor after the menu admin migration.
alter table public.site_settings
  add column if not exists skip_url text;

update public.site_settings
set skip_url = 'https://www.skipthedishes.com/wrap-n-roll-619'
where id = 1 and skip_url is null;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.site_settings'::regclass
      and conname = 'site_settings_skip_url_https'
  ) then
    alter table public.site_settings add constraint site_settings_skip_url_https
      check (skip_url is null or skip_url ~ '^https://');
  end if;
end $$;
