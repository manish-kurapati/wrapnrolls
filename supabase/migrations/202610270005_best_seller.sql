-- Run after 202610270004_ingredients_images.sql.
alter table public.products
  add column if not exists is_best_seller boolean not null default false;
