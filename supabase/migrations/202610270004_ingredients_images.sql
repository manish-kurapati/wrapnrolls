-- Run after 202610270003_skip_ordering.sql.
alter table public.products add column if not exists ingredients text not null default '';

alter table public.products drop constraint if exists products_image_path_check;
alter table public.products add constraint products_image_path_check
  check (image_path is null or image_path ~ '^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif|avif|bmp)$');

update storage.buckets
set allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','image/avif','image/bmp'],
    file_size_limit = 5242880
where id = 'product-images';
