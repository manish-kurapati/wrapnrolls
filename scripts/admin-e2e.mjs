import { chromium } from 'playwright-core';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
process.loadEnvFile?.(path.join(root, '.env.local'));
const email = process.env.WRAP_ADMIN_EMAIL;
const password = process.env.WRAP_ADMIN_PASSWORD;
if (!email || !password) throw new Error('Set WRAP_ADMIN_EMAIL and WRAP_ADMIN_PASSWORD for the admin end-to-end test.');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});
const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
if (signInError) throw signInError;

const { data: originalSettings, error: settingsError } = await supabase.from('site_settings')
  .select('*').eq('id', 1).single();
if (settingsError) throw settingsError;
if (!Object.hasOwn(originalSettings, 'skip_url')) throw new Error('Run 202610270003_skip_ordering.sql before the admin end-to-end test.');
const { count: originalCount, error: countError } = await supabase.from('products')
  .select('id', { count: 'exact', head: true });
if (countError) throw countError;

const base = process.env.WRAP_TEST_BASE || 'http://127.0.0.1:8000/';
const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
const name = `Admin E2E Test ${suffix}`;
const slug = `admin-e2e-test-${suffix}`;
const imageOne = path.join(root, 'assets/logos/submark-orange.png');
const imageTwo = path.join(root, 'assets/logos/submark-ivory.png');
const temporaryPaths = new Set();
const testUberUrl = 'https://example.com/e2e-uber-eats';
const testDoorDashUrl = 'https://example.com/e2e-doordash';
const testSkipUrl = 'https://example.com/e2e-skip';
let browser;
let orderingChanged = false;
let passed = false;

async function product() {
  const { data, error } = await supabase.from('products').select('*').eq('slug', slug).maybeSingle();
  if (error) throw error;
  if (data?.image_path) temporaryPaths.add(data.image_path);
  return data;
}
async function waitForSettings(expected) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const { data, error } = await supabase.from('site_settings')
      .select('*').eq('id', 1).single();
    if (error) throw error;
    if (data.uber_eats_url === (expected.uber_eats_url || null)
      && data.doordash_url === (expected.doordash_url || null)
      && data.skip_url === (expected.skip_url || null)) return;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Ordering settings did not reach the expected saved values.');
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const visit = route => page.goto(new URL(route, base).href, { waitUntil: 'domcontentloaded' });
  const row = () => page.locator('#product-list .product-row').filter({ hasText: name });
  const waitForMenu = async (site, hasProduct) => {
    await site.goto(new URL('wraps.html', base).href, { waitUntil: 'domcontentloaded' });
    await site.waitForFunction(({ slug, hasProduct }) => Array.isArray(window.WRAP_MENU_PRODUCTS)
      && window.WRAP_MENU_PRODUCTS.some(item => item.slug === slug) === hasProduct,
    { slug, hasProduct }, { timeout: 25000 });
  };
  const site = await context.newPage();
  site.on('pageerror', error => errors.push(error.message));

  await visit('admin.html');
  await page.locator('#login-form input[name="email"]').fill(email);
  await page.locator('#login-form input[name="password"]').fill(password);
  await page.locator('#login-form button').click();
  await page.locator('#admin-panel').waitFor({ state: 'visible', timeout: 25000 });
  await page.waitForFunction(expected => document.querySelector('#stat-total')?.textContent === String(expected), originalCount);
  console.log('Sign-in and overview: OK');

  await page.locator('[data-page-link="products"]').click();
  await page.waitForURL('**/admin-products.html');
  await page.locator('#admin-panel').waitFor({ state: 'visible', timeout: 25000 });
  await page.waitForFunction(expected => document.querySelectorAll('#product-list .product-row').length === expected, originalCount, { timeout: 25000 });
  assert(await page.locator('#product-list .product-row').count() === originalCount, 'Product list count differs from database');
  await page.locator('#product-form input[name="name"]').fill(name);
  await page.locator('#product-form input[name="price"]').fill('11.50');
  await page.locator('#product-form textarea[name="ingredients"]').fill('Lettuce, tomato, test sauce');
  await page.locator('#product-form input[name="is_best_seller"]').check();
  await page.locator('#product-form input[name="image"]').setInputFiles(imageOne);
  assert(await page.locator('#product-form input[name="slug"]').inputValue() === slug, 'Slug did not auto-generate');
  await page.locator('#product-form button[type="submit"]').click();
  await row().waitFor({ state: 'visible', timeout: 25000 });
  assert(await page.locator('#product-list .product-row').count() === originalCount + 1, 'New product did not appear in admin');
  assert(await row().locator('img').count() === 1, 'Uploaded image is missing in admin');
  const created = await product();
  assert(created?.image_path && created.price === 11.5 && created.subcategory === 'special' && created.ingredients === 'Lettuce, tomato, test sauce' && created.is_best_seller, 'Create/upload did not persist');
  const offersReady = Object.hasOwn(created, 'offer_percent');
  await page.locator('#product-search').fill(name);
  assert(await page.locator('#product-list .product-row:visible').count() === 1, 'Product search did not filter');
  await page.locator('#category-tabs [data-category="burgers"]').click();
  assert(await page.locator('#product-list .product-row:visible').count() === 0, 'Category filter did not filter');
  await page.locator('#category-tabs [data-category="wraps"]').click();
  await page.locator('#product-search').fill('');
  console.log('Create, image upload, slug, search, filter: OK');

  await row().locator('[data-action="edit"]').click();
  await page.locator('#product-form input[name="image"]').setInputFiles({
    name: 'not-an-image.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image')
  });
  await page.locator('#product-form button[type="submit"]').click();
  await page.getByText('Use a JPG, PNG, WebP, GIF, AVIF or BMP image up to 5 MB.').waitFor();
  assert((await product())?.image_path === created.image_path, 'Rejected image changed the product');
  await page.locator('#cancel-edit').click();
  console.log('Non-image upload rejected: OK');

  await waitForMenu(site, true);
  await site.locator('[data-wrap-filter="special"]').click();
  const specialCard = site.locator('.category-card').filter({ hasText: name });
  await specialCard.waitFor({ state: 'visible' });
  assert((await specialCard.textContent()).includes('$11.50'), 'New product price missing from website');
  await specialCard.locator('.best-seller-tag').waitFor();
  await specialCard.locator('.ingredient-info').click();
  await site.locator('.ingredients-dialog').getByText('Lettuce, tomato, test sauce').waitFor();
  await site.locator('.ingredients-close').click();
  await site.locator('#wrap-favourites [data-product-slug="' + slug + '"]').waitFor();
  await specialCard.locator('img').waitFor({ state: 'visible' });
  console.log('New product and image on website: OK');

  await row().locator('[data-action="toggle"]').click();
  await row().locator('[data-action="toggle"]').getByText('Show').waitFor();
  assert((await product())?.is_active === false, 'Hide did not persist');
  await waitForMenu(site, false);
  console.log('Hide from website: OK');

  await row().locator('[data-action="toggle"]').click();
  await row().locator('[data-action="toggle"]').getByText('Hide').waitFor();
  await row().locator('[data-action="edit"]').click();
  await page.locator('#product-form select[name="subcategory"]').selectOption('breakfast');
  await page.locator('#product-form input[name="price"]').fill('12.34');
  if (offersReady) {
    await page.locator('#product-form input[name="offer_percent"]').fill('20');
    await page.locator('#product-form input[name="offer_label"]').fill('Test special');
  }
  await page.locator('#product-form input[name="image"]').setInputFiles(imageTwo);
  await page.locator('#product-form button[type="submit"]').click();
  await page.waitForFunction(({ slug, price }) => {
    const rows = [...document.querySelectorAll('.product-row')];
    return rows.some(row => row.dataset.search.includes(slug) && row.textContent.includes(price));
  }, { slug, price: '$12.34' }, { timeout: 25000 });
  const edited = await product();
  assert(edited?.subcategory === 'breakfast' && edited.price === 12.34 && edited.image_path !== created.image_path, 'Edit or image replacement did not persist');
  if (offersReady) assert(edited.offer_percent === 20 && edited.offer_label === 'Test special', 'Offer did not persist');
  await waitForMenu(site, true);
  await site.locator('[data-wrap-filter="breakfast"]').click();
  const breakfastCard = site.locator('.category-card').filter({ hasText: name });
  await breakfastCard.waitFor({ state: 'visible' });
  assert((await breakfastCard.textContent()).includes(offersReady ? '$9.87' : '$12.34'), 'Edited price missing from website');
  if (offersReady) assert((await breakfastCard.textContent()).includes('Test special'), 'Offer badge missing from website');
  await site.locator('[data-wrap-filter="special"]').click();
  assert(await site.locator('.category-card').filter({ hasText: name }).count() === 0, 'Product remained in former section');
  console.log(`Edit price, section, replace image${offersReady ? ', and offer' : ''}: OK`);

  await row().locator('[data-action="edit"]').click();
  await page.locator('#product-form input[name="remove_image"]').check();
  await page.locator('#product-form button[type="submit"]').click();
  await page.waitForFunction(slug => [...document.querySelectorAll('.product-row.no-photo')]
    .some(row => row.dataset.search.includes(slug)), slug, { timeout: 25000 });
  assert((await product())?.image_path === null, 'Remove image did not persist');
  console.log('Remove image: OK');

  page.once('dialog', dialog => dialog.accept());
  await row().locator('[data-action="delete"]').click();
  await row().waitFor({ state: 'detached', timeout: 25000 });
  assert(!(await product()), 'Delete did not persist');
  assert(await page.locator('#product-list .product-row').count() === originalCount, 'Product count did not return to original');
  console.log('Delete and catalogue count restored: OK');

  await page.locator('[data-page-link="ordering"]').click();
  await page.waitForURL('**/admin-ordering.html');
  await page.locator('#admin-panel').waitFor({ state: 'visible', timeout: 25000 });
  await page.waitForFunction(settings => {
    const form = document.querySelector('#settings-form');
    return form?.elements.uber_eats_url.value === (settings.uber_eats_url || '')
      && form?.elements.doordash_url.value === (settings.doordash_url || '')
      && form?.elements.skip_url.value === (settings.skip_url || '');
  }, originalSettings, { timeout: 25000 });
  assert(await page.locator('#settings-form input[name="uber_eats_url"]').inputValue() === (originalSettings.uber_eats_url || ''), 'Uber Eats setting did not load');
  assert(await page.locator('#settings-form input[name="doordash_url"]').inputValue() === (originalSettings.doordash_url || ''), 'DoorDash setting did not load');
  assert(await page.locator('#settings-form input[name="skip_url"]').inputValue() === (originalSettings.skip_url || ''), 'SkipTheDishes setting did not load');
  await page.locator('#settings-form input[name="uber_eats_url"]').fill(testUberUrl);
  await page.locator('#settings-form input[name="doordash_url"]').fill(testDoorDashUrl);
  await page.locator('#settings-form input[name="skip_url"]').fill(testSkipUrl);
  await page.locator('#settings-form button').click();
  orderingChanged = true;
  await page.getByText('Delivery links saved.').waitFor({ timeout: 25000 });
  await waitForSettings({ uber_eats_url: testUberUrl, doordash_url: testDoorDashUrl, skip_url: testSkipUrl });
  await site.goto(base + 'order.html');
  await site.waitForFunction(([uber, door, skip]) => {
    return document.querySelector('[data-provider="uber_eats_url"]')?.href === uber
      && document.querySelector('[data-provider="doordash_url"]')?.href === door
      && document.querySelector('[data-provider="skip_url"]')?.href === skip;
  }, [testUberUrl, testDoorDashUrl, testSkipUrl], { timeout: 25000 });
  console.log('Save all three ordering links and choice page: OK');

  await page.locator('#settings-form input[name="uber_eats_url"]').fill(originalSettings.uber_eats_url || '');
  await page.locator('#settings-form input[name="doordash_url"]').fill(originalSettings.doordash_url || '');
  await page.locator('#settings-form input[name="skip_url"]').fill(originalSettings.skip_url || '');
  await page.locator('#settings-form button').click();
  await page.getByText('Delivery links saved.').waitFor({ timeout: 25000 });
  await waitForSettings(originalSettings);
  orderingChanged = false;
  await page.locator('[data-page-link="overview"]').click();
  await page.waitForURL('**/admin.html');
  await page.locator('#admin-panel').waitFor({ state: 'visible', timeout: 25000 });
  await page.waitForFunction(expected => document.querySelector('#stat-total')?.textContent === String(expected), originalCount);
  await page.locator('#sign-out').click();
  await page.locator('#login-panel').waitFor({ state: 'visible', timeout: 25000 });
  assert(!(await page.locator('#admin-panel').isVisible()), 'Admin panel remained visible after sign-out');
  assert(errors.length === 0, `Browser errors: ${errors.join('; ')}`);
  console.log('Restore links, overview, sign-out: OK');
  passed = true;
} finally {
  await browser?.close();
  const residual = await product();
  if (residual) {
    const { error } = await supabase.from('products').delete().eq('id', residual.id);
    if (error) console.error('Cleanup product failed:', error.message);
  }
  for (const imagePath of temporaryPaths) {
    const { error } = await supabase.storage.from('product-images').remove([imagePath]);
    if (error) console.error('Cleanup image failed:', error.message);
  }
  if (orderingChanged) {
    const { error } = await supabase.from('site_settings').upsert({ id: 1, ...originalSettings });
    if (error) console.error('Restore ordering links failed:', error.message);
  }
  await supabase.auth.signOut();
}
if (passed) console.log('Admin end-to-end test passed. Temporary product and settings restored.');
