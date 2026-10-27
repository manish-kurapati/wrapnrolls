-- Run once in the Supabase SQL Editor after 202610270001_menu_admin.sql.
-- Existing product image links should be cleared before applying the PNG constraint.
alter table public.products
  add column if not exists offer_percent numeric(5,2),
  add column if not exists offer_label text;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass and conname = 'products_offer_percent_valid'
  ) then
    alter table public.products add constraint products_offer_percent_valid
      check (offer_percent is null or (offer_percent > 0 and offer_percent <= 100));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass and conname = 'products_offer_label_valid'
  ) then
    alter table public.products add constraint products_offer_label_valid
      check (offer_label is null or length(trim(offer_label)) between 1 and 32);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.products'::regclass and conname = 'products_offer_label_needs_percent'
  ) then
    alter table public.products add constraint products_offer_label_needs_percent
      check (offer_label is null or offer_percent is not null);
  end if;
end $$;

-- From this point on, every uploaded product photo must be a PNG.
alter table public.products drop constraint if exists products_image_path_check;
alter table public.products add constraint products_image_path_check
  check (image_path is null or image_path ~ '^[a-zA-Z0-9_-]+\.png$');

update storage.buckets
set allowed_mime_types = array['image/png'], file_size_limit = 5242880
where id = 'product-images';
