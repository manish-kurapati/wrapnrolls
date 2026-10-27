-- Wrap N Roll: run once in a fresh Supabase project via the SQL Editor.
-- Creates the schema and starter rows, then adds PNG offers and SkipTheDishes.

-- BEGIN 202610270001_menu_admin.sql
-- Run in the Supabase SQL editor before configuring the website.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_menu_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.admin_users where user_id = (select auth.uid())) $$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) between 1 and 120),
  description text not null default '',
  category text not null check (category in ('wraps','burgers','sides','sodas')),
  subcategory text,
  price numeric(8,2) not null check (price >= 0),
  price_medium numeric(8,2) check (price_medium >= 0),
  price_large numeric(8,2) check (price_large >= 0),
  image_path text check (image_path is null or image_path ~ '^[a-zA-Z0-9_-]+\.(jpg|png|webp|avif)$'),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id integer primary key default 1 check (id = 1),
  uber_eats_url text check (uber_eats_url is null or uber_eats_url ~ '^https://'),
  doordash_url text check (doordash_url is null or doordash_url ~ '^https://'),
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create trigger products_updated_at before update on public.products for each row execute function public.touch_updated_at();
create trigger settings_updated_at before update on public.site_settings for each row execute function public.touch_updated_at();

alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.site_settings enable row level security;

revoke all on public.admin_users, public.products, public.site_settings from anon, authenticated;
grant select on public.admin_users to authenticated;
grant select on public.products, public.site_settings to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant insert, update on public.site_settings to authenticated;

create policy "Admins can read their own membership" on public.admin_users for select to authenticated using (user_id = (select auth.uid()));
create policy "Visitors can read active products" on public.products for select to anon, authenticated using (is_active or public.is_menu_admin());
create policy "Admins can add products" on public.products for insert to authenticated with check (public.is_menu_admin());
create policy "Admins can update products" on public.products for update to authenticated using (public.is_menu_admin()) with check (public.is_menu_admin());
create policy "Admins can delete products" on public.products for delete to authenticated using (public.is_menu_admin());
create policy "Visitors can read ordering links" on public.site_settings for select to anon, authenticated using (true);
create policy "Admins can add ordering links" on public.site_settings for insert to authenticated with check (public.is_menu_admin());
create policy "Admins can update ordering links" on public.site_settings for update to authenticated using (public.is_menu_admin()) with check (public.is_menu_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Public can view product images" on storage.objects for select to public using (bucket_id = 'product-images');
create policy "Admins can upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.is_menu_admin());
create policy "Admins can update product images" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.is_menu_admin()) with check (bucket_id = 'product-images' and public.is_menu_admin());
create policy "Admins can delete product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.is_menu_admin());

-- The current site menu is the initial catalogue. Replace its images in Admin.
insert into public.products (slug,name,description,category,subcategory,price,price_medium,price_large,sort_order) values
('breakfast','Healthy Breakfast Roll','Omelet, bacon, Canadian cheese, lettuce, tomato, red onion and mayo.','wraps','breakfast',11.50,null,null,10),
('veggie','The House Veggie Roll','Mediterranean chickpea patties, lettuce, tomato, red onion, pickles, tahini and garlic aioli.','wraps','special',13.00,null,null,20),
('island','Exotic Island Roll','Shrimp, sautéed pineapple, red onion and green pepper, fresh tomato and lettuce, sweet chili and Hawaiian aioli.','wraps','special',15.50,null,null,30),
('crispy-caesar','The Caesar Roll Crispy Chicken','Crispy chicken, lettuce, bacon, Parmesan cheese and creamy Caesar dressing.','wraps','special',13.50,null,null,40),
('steak','Loaded Sackville Steak Wrap','Thinly sliced steak, grilled green pepper, onion and mushrooms, Canadian cheese, lettuce, tomato, red onion, pickles, garlic aioli and BBQ dressing.','wraps','special',15.00,null,null,50),
('classic-burger','Our Classic Burger','Fresh beef patty, lettuce, tomato, red onion, pickles, ketchup and mayo. Beyond Meat or veggie patty available for +$1.','burgers',null,9.00,null,null,10),
('crisp-onion-burger','Crisp Onion Burger','Double fresh beef patties, Canadian cheese, crispy onion, lettuce, tomato, pickles, ketchup and mayo.','burgers',null,14.50,null,null,20),
('royal-burger','The Royal Burger','Fresh beef patty, sunny-side-up egg, bacon, Canadian cheese, lettuce, tomato, red onion, pickles, ketchup and mayo.','burgers',null,14.00,null,null,30),
('bacon-burger','Cheese & Bacon Burger','Fresh beef patty topped with bacon, Canadian cheese, lettuce, tomato, red onion, pickles, ketchup and mayo.','burgers',null,12.50,null,null,40),
('double-double-burger','Double Double Burger','Two fresh beef patties, two bacon strips, two slices of Canadian cheese, lettuce, tomato, red onion, pickles, ketchup and mayo.','burgers',null,17.00,null,null,50),
('duet-shrimp-beef-burger','Duet Shrimp & Beef Burger','Fresh beef patty, grilled shrimp in herbs and garlic sauce, lettuce, tomato and mayo.','burgers',null,13.50,null,null,60),
('onion-mushroom-burger','Onion Mushroom Burger','Fresh beef patty, sautéed mushrooms and onions, Canadian cheese, lettuce, tomato, pickles, BBQ sauce and mayo.','burgers',null,13.00,null,null,70),
('ring-burger','The Ring Burger','Double fresh beef patties, two golden onion rings, lettuce, red onion, tomato, pickles, ketchup and mayo.','burgers',null,14.50,null,null,80),
('regular-fries','Regular Fries','7 oz of classic golden fries.','sides','regular',5.00,null,null,10),
('seasoned-fries','Seasoned Fries','7 oz of fries with a savoury seasoning.','sides','regular',5.00,null,null,20),
('onion-rings','Onion Rings','5 oz of golden, crispy onion rings.','sides','regular',5.00,null,null,30),
('sweet-potato-fries','Sweet Potato Fries','5 oz of sweet potato fries.','sides','regular',5.00,null,null,40),
('crispy-shrimp','Crispy Shrimp','Seven pieces of crispy shrimp.','sides','regular',12.00,null,null,50),
('caesar-salad','Caesar Salad','A small Caesar salad.','sides','regular',5.00,null,null,60),
('tortilla-salad','Tortilla Salad','A small tortilla salad.','sides','regular',6.00,null,null,70),
('tiramisu','Tiramisu','A little something sweet to finish.','sides','regular',5.00,null,null,80),
('sunrise-crush','Sunrise Crush','Strawberry, peach and 7UP Zero.','sodas','classic',5.89,6.89,7.89,10),
('midnight-madness','Midnight Madness','Blue raspberry, lime and 7UP Zero.','sodas','classic',5.89,6.89,7.89,20),
('golden-hour','The Golden Hour','Peach, vanilla, lime and iced tea.','sodas','classic',5.89,6.89,7.89,30),
('coco-cherry-bliss','Coco Cherry Bliss','Cherry, vanilla, coconut cream and Diet Coke.','sodas','classic',5.89,6.89,7.89,40),
('dirty-root-float','Dirty Root Float','Coconut, raspberry, cream and root beer.','sodas','classic',5.89,6.89,7.89,50),
('berry-breeze','Berry Breeze','Raspberry, strawberry, cream and Alani Lime.','sodas','alani',8.00,null,null,60),
('mermaid-fizz','Mermaid Fizz','Blue raspberry, coconut, cream and Alani Lime.','sodas','alani',8.00,null,null,70),
('pink-cloud','Pink Cloud','Strawberry, coconut cream and Alani Cotton Candy.','sodas','alani',8.00,null,null,80),
('cotton-candy-colada','Cotton Candy Colada','Coconut, coconut cream and Alani Cotton Candy.','sodas','alani',8.00,null,null,90)
on conflict (slug) do nothing;

-- END 202610270001_menu_admin.sql

-- BEGIN 202610270002_png_offers.sql
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

-- END 202610270002_png_offers.sql

-- BEGIN 202610270003_skip_ordering.sql
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

-- END 202610270003_skip_ordering.sql
-- BEGIN 202610270004_ingredients_images.sql

-- Run after 202610270003_skip_ordering.sql.
alter table public.products add column if not exists ingredients text not null default '';

alter table public.products drop constraint if exists products_image_path_check;
alter table public.products add constraint products_image_path_check
  check (image_path is null or image_path ~ '^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp|gif|avif|bmp)$');

update storage.buckets
set allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','image/avif','image/bmp'],
    file_size_limit = 5242880
where id = 'product-images';

-- END 202610270004_ingredients_images.sql

-- BEGIN 202610270005_best_seller.sql

-- Run after 202610270004_ingredients_images.sql.
alter table public.products
  add column if not exists is_best_seller boolean not null default false;

-- END 202610270005_best_seller.sql
