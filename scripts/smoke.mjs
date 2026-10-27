import { chromium } from 'playwright-core';

const executablePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
const base = 'http://127.0.0.1:8000/';
const errors = [];
page.on('pageerror', error => errors.push(error.message));

async function open(path) {
  await page.goto(base + path, { waitUntil: 'domcontentloaded' });
  if (!path.startsWith('admin')) await page.waitForFunction(() => Array.isArray(window.WRAP_MENU_PRODUCTS), { timeout: 20000 });
}
async function count(selector, expected, label) {
  const actual = await page.locator(selector).count();
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, got ${actual}`);
  console.log(`${label}: ${actual}`);
}

await open('wraps.html');
await count('#wrap-favourites .menu-card', 5, 'Wrap shortlist');
await count('#wrap-favourites .menu-picture img', 0, 'Wrap photos cleared');
if (process.env.SMOKE_SCREENSHOTS) {
  await page.evaluate(() => { document.querySelector('.loader')?.remove(); document.querySelector('#menu')?.scrollIntoView({ behavior: 'instant' }); });
  await page.screenshot({ path: 'public/wraps-hierarchy-check.png' });
}
await page.evaluate(() => document.querySelector('[data-wrap-filter="special"]').click());
await count('.category-menu .category-card', 4, 'Special wraps');
await page.evaluate(() => document.querySelector('[data-wrap-filter="breakfast"]').click());
await count('.category-menu .category-card', 1, 'Breakfast wraps');
await page.evaluate(() => {
  window.WRAP_MENU_PRODUCTS.push({ name: 'Smoke Test Wrap', slug: 'smoke-test-wrap', category: 'wraps', subcategory: 'special', price: 10, image_url: '' });
  document.querySelector('[data-wrap-filter="special"]').click();
});
await count('.category-menu .category-card', 5, 'New wrap stays in Special Wraps');
await count('#wrap-favourites .menu-card', 5, 'Wrap shortlist stays curated');

await open('sides.html');
await count('[data-menu-favourites] .menu-grid .menu-card', 4, 'Side shortlist');
await count('[data-menu-favourites] .menu-picture img', 0, 'Side photos cleared');
await count('[data-menu-favourites] .text-menu-item, [data-menu-favourites] .category-subheading', 0, 'Extra shrimp, salad and dessert block removed');
if (process.env.SMOKE_SCREENSHOTS) {
  await page.evaluate(() => document.querySelector('#menu')?.scrollIntoView({ behavior: 'instant' }));
  await page.screenshot({ path: 'public/sides-hierarchy-check.png' });
}
await page.evaluate(() => document.querySelector('[data-wrap-filter="regular"]').click());
await count('.category-menu .category-card', 8, 'Regular sides');
await page.evaluate(() => document.querySelector('[data-wrap-filter="breakfast"]').click());
await count('.category-menu .category-card', 0, 'Breakfast sides pending');
await page.evaluate(() => {
  window.WRAP_MENU_PRODUCTS.push({ name: 'Smoke Test Side', slug: 'smoke-test-side', category: 'sides', subcategory: 'regular', price: 4, image_url: '' });
  document.querySelector('[data-wrap-filter="regular"]').click();
});
await count('.category-menu .category-card', 9, 'New side stays in Regular Sides');
await count('[data-menu-favourites] .menu-grid .menu-card', 4, 'Side shortlist stays curated');

await open('burgers.html');
await count('.menu-section .menu-grid .menu-card', 4, 'Burger cards');
await count('.menu-section .menu-grid .menu-picture img', 0, 'Burger photos cleared');
await count('.menu-section .text-menu-item', 0, 'Removed burger text entries');
if (await page.getByText('More to love').count()) throw new Error('Removed burger heading is still visible');

await open('sodas.html');
await count('.dirty-menu-row', 5, 'Classic sodas');
await count('.alani-card', 4, 'Alani sodas');
await count('.dirty-menu-row svg.drink-mini, .alani-card svg.drink-mini', 0, 'Soda product art cleared');
await count('.dirty-menu-row .drink-mini-placeholder, .alani-card .drink-mini-placeholder', 9, 'Soda placeholders');

// Mock one database response to verify prices update inside the original layouts.
const priceRoute = '**/rest/v1/products?**';
await page.route(priceRoute, async route => {
  const response = await route.fetch();
  const data = await response.json();
  for (const product of data) {
    if (product.slug === 'veggie') { product.offer_percent = 20; product.offer_label = 'Wrap deal'; }
    if (product.slug === 'regular-fries') { product.price = 7.25; product.offer_percent = 20; product.offer_label = 'Fries deal'; }
    if (product.slug === 'crisp-onion-burger') { product.price = 19; product.offer_percent = 25; product.offer_label = 'Burger deal'; }
    if (product.slug === 'sunrise-crush') { product.price_medium = 9.89; product.offer_percent = 10; product.offer_label = 'Soda deal'; }
  }
  await route.fulfill({ response, json: data });
});
await open('wraps.html');
const veggie = page.locator('[data-product-slug="veggie"]');
if (!(await veggie.textContent()).includes('$10.40') || !(await veggie.textContent()).includes('Wrap deal')) throw new Error('Wrap offer did not render');
await page.evaluate(() => document.querySelector('[data-wrap-filter="special"]').click());
const veggieCategory = page.locator('.category-card').filter({ hasText: 'The House Veggie Roll' });
if (!(await veggieCategory.textContent()).includes('$10.40') || !(await veggieCategory.textContent()).includes('Wrap deal')) throw new Error('Wrap category offer did not render');
await open('sides.html');
if (!(await page.locator('[data-product-slug="regular-fries"] .menu-price').textContent()).includes('$5.80')) throw new Error('Side shortlist offer price did not update');
if (!(await page.locator('[data-product-slug="regular-fries"] .product-offer-tag').textContent()).includes('Fries deal')) throw new Error('Side offer badge did not render');
await page.evaluate(() => document.querySelector('[data-wrap-filter="regular"]').click());
const friesCard = page.locator('.category-card').filter({ hasText: 'Regular Fries' }).first();
if (!(await friesCard.textContent()).includes('$5.80')) throw new Error('Side category offer price did not update');
await open('burgers.html');
const onionBurger = page.locator('[data-product-slug="crisp-onion-burger"]');
if (!(await onionBurger.textContent()).includes('$14.25') || !(await onionBurger.textContent()).includes('Burger deal')) throw new Error('Burger offer did not update');
await open('sodas.html');
const sunrise = page.locator('.dirty-menu-row').filter({ hasText: 'Sunrise Crush' });
if (!(await sunrise.textContent()).includes('$8.90') || !(await sunrise.textContent()).includes('Soda deal')) throw new Error('Soda offer did not update');
console.log('Percentage offers in all menu layouts: OK');
await page.unroute(priceRoute);

// The website's Order now button opens one page with all delivery choices.
const settingsRoute = '**/rest/v1/site_settings?**';
await page.route(settingsRoute, async route => {
  const response = await route.fetch();
  const data = await response.json();
  await route.fulfill({ response, json: {
    ...data,
    uber_eats_url: 'https://example.com/uber',
    doordash_url: 'https://example.com/doordash',
    skip_url: 'https://www.skipthedishes.com/wrap-n-roll-619'
  } });
});
await open('wraps.html');
await page.locator('[data-order-link]').click();
await page.waitForURL('**/order.html');
await page.waitForFunction(() => [...document.querySelectorAll('[data-provider]')].every(link => !link.hidden));
for (const [provider, url] of Object.entries({
  uber_eats_url: 'https://example.com/uber',
  doordash_url: 'https://example.com/doordash',
  skip_url: 'https://www.skipthedishes.com/wrap-n-roll-619'
})) {
  const actual = await page.locator(`[data-provider="${provider}"]`).getAttribute('href');
  if (actual !== url) throw new Error(`${provider} ordering link: expected ${url}, got ${actual}`);
}
console.log('Order now opens three delivery choices: OK');
await page.unroute(settingsRoute);

// The sign-in form must stay hidden while a new admin page checks the session.
await page.route('**/assets/admin.js', async route => {
  await new Promise(resolve => setTimeout(resolve, 700));
  await route.continue();
});
await page.goto(base + 'admin.html', { waitUntil: 'commit' });
await page.locator('#auth-loading').waitFor({ state: 'visible' });
if (await page.locator('#login-panel').isVisible()) throw new Error('Login form flashed before session check');
if (!(await page.locator('#auth-loading').isVisible())) throw new Error('Admin loading state is missing');
await page.waitForLoadState('domcontentloaded');
await page.unroute('**/assets/admin.js');

for (const [path, route] of [['admin.html', 'overview'], ['admin-products.html', 'products'], ['admin-ordering.html', 'ordering']]) {
  await open(path);
  const actual = await page.locator('body').getAttribute('data-admin-page');
  if (actual !== route) throw new Error(`Admin route ${path}: ${actual}`);
  console.log(`Admin route: ${route}`);
}

if (process.env.WRAP_ADMIN_EMAIL && process.env.WRAP_ADMIN_PASSWORD) {
  await open('admin-products.html');
  await page.locator('#login-form input[name="email"]').fill(process.env.WRAP_ADMIN_EMAIL);
  await page.locator('#login-form input[name="password"]').fill(process.env.WRAP_ADMIN_PASSWORD);
  await page.locator('#login-form button').click();
  await page.locator('#admin-panel').waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForFunction(() => document.querySelectorAll('#product-list .product-row').length === 30, null, { timeout: 20000 });
  await count('#product-list .product-row', 30, 'Admin product rows');
  await count('#product-list .product-row img', 0, 'Admin product photos cleared');
  if (process.env.SMOKE_SCREENSHOTS) await page.screenshot({ path: 'public/admin-products-verified.png', fullPage: true });
  await page.goto(base + 'admin-ordering.html');
  await page.locator('#admin-panel').waitFor({ state: 'visible', timeout: 20000 });
  console.log('Admin sign-in and page navigation: OK');
}

if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`);
await browser.close();
