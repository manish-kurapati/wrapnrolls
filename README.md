# Wrap N'Roll

Static restaurant website with a Supabase powered catalogue and admin dashboard. The public pages are Home, Wraps, Burgers, Sides, Sodas, Customise, Contact, and Order Online. The admin dashboard has separate `/admin.html` (overview), `/admin-products.html` (products), and `/admin-ordering.html` (delivery links) pages.

## Supabase setup

1. Create a Supabase project and run [`supabase/migrations/202610270001_menu_admin.sql`](supabase/migrations/202610270001_menu_admin.sql), then [`supabase/migrations/202610270002_png_offers.sql`](supabase/migrations/202610270002_png_offers.sql), then [`supabase/migrations/202610270003_skip_ordering.sql`](supabase/migrations/202610270003_skip_ordering.sql), then [`supabase/migrations/202610270004_ingredients_images.sql`](supabase/migrations/202610270004_ingredients_images.sql), then [`supabase/migrations/202610270005_best_seller.sql`](supabase/migrations/202610270005_best_seller.sql), in its SQL Editor. These add discounts, delivery links, ingredients, common image formats, and Best Seller badges.
2. In Supabase Authentication, create an email/password user for the manager. Copy that user's UUID from the Users screen. Add the user as an admin in the SQL Editor:

   ```sql
   insert into public.admin_users (user_id) values ('YOUR_AUTH_USER_UUID');
   ```

3. Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` as environment variables in Vercel (Project Settings → Environment Variables) or in a local `.env.local` file. The local project is configured through `.env.local`, which is ignored by Git. Use the project's **publishable/anon** key, never its secret or service role key. The build writes these public values to `assets/config.js` and bundles the Supabase browser client.
4. Run `npm install && npm run build`, then deploy `public/` or let Vercel run the configured build. Open `/admin.html`, sign in, upload product images, and enter the restaurant's Uber Eats, DoorDash, and SkipTheDishes ordering page URLs.

Every Order now button opens `/order.html`, where customers choose from the delivery services with URLs configured. The supplied SkipTheDishes link appears by default, even before the third migration runs. Checkout and payment happen on the chosen delivery service. This site does not send a cart or product selections to those services; the restaurant's listing must also contain the same products and prices.

Products have a category, menu section, price, optional medium/large prices for sodas, optional percentage discount and offer badge, image, ingredients, and visibility switch. A percentage discount applies to every listed size of that product. Wraps and Sides keep their shortlists, and the full category list appears when a visitor chooses a menu section. Burgers use the main card grid; the four former "More to love" listings are hidden from the storefront but remain in Supabase. New burgers appear as cards with or without photos. Product images can be JPG, PNG, WebP, GIF, AVIF, or BMP files up to 5 MB. Customers can select products to see their ingredients. Product edits appear on the website on the next page load. Only an authenticated user listed in `admin_users` can change products, settings, or images. Public visitors can read active products and ordering links.

All 30 starter products currently have no linked image. The menu and admin show patterned placeholders until the client uploads an image for a product. Homepage food artwork remains in place. The Breakfast Sides section currently has no real products configured.

Without Supabase configuration, the original HTML menu remains visible. Once configured, Supabase is the menu source, including for new, hidden, or deleted products. If the menu fetch fails, the site shows an unavailable message instead of displaying stale products. Product images on the menu come from the public `product-images` Storage bucket. Existing decorative hero art and the Build Your Own Wrap ingredient price list are still static HTML.

The Wraps and Burgers landing sections play transparent WebM versions of the supplied animations in `assets/videos/`, with the original MP4 files as a browser fallback. The Contact page links to the restaurant phone, WhatsApp, Instagram, and email. Its form opens a prefilled email draft to `wrapnrollns@gmail.com`; visitors must send that draft from their email app. No form submissions are stored by the website.

## Development

`npm run build` bundles `src/storefront.js`, `src/admin.js`, `src/order.js`, and the page transitions, writes browser bundles into `assets/`, and creates `public/` for Vercel. Keep `public/` out of Git. For a local build, set the two environment variables before running the command. The bundled Lilita One font license is in `assets/fonts/OFL-Lilita-One.txt`.

With the local server running at `http://127.0.0.1:8000/`, run `npm run smoke` to check menu sections and admin routes. Set `WRAP_ADMIN_EMAIL` and `WRAP_ADMIN_PASSWORD` in the shell to include the authenticated product list and photo checks.

Run `npm run test:admin` with those same admin environment variables for a live browser test of sign-in, product and image management, menu visibility, ordering links, and sign-out. The test uses a uniquely named temporary product and restores the ordering links when finished.

## Moving to a new Supabase project

Run `supabase/setup-new-project.sql` once in the new project's SQL Editor. It creates the app tables, policies, Storage bucket, and starter menu. If you already ran that file before merging the latest `main`, also run `supabase/setup-remaining-project.sql` to add ingredients, Best Seller flags, and common image formats. API keys cannot execute this schema setup. Keep the old and new project URLs and server-only secret keys in ignored `.env.source.local` and `.env.target.local` files. Run `node scripts/migrate-supabase.mjs export` to save a local snapshot. With `WRAP_ADMIN_PASSWORD` set to the manager's chosen password, run `node scripts/migrate-supabase.mjs import`. The import refreshes the snapshot, copies products, ordering links and product images, recreates the admin login, and verifies the target. Only after verification does it write `supabase/public-config.json` and switch `.env.local` to the new project's public URL and publishable key. The public config takes precedence over stale Vercel variables during future builds. Commit the generated public config and browser bundle, then rebuild and deploy. Never commit secret keys or `.migration-backup`.
