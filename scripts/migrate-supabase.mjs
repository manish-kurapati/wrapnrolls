import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const root = fileURLToPath(new URL('../', import.meta.url));
const snapshotPath = path.join(root, '.migration-backup', 'source-20261027.json');

async function readEnv(name) {
  const text = (await readFile(path.join(root, name), 'utf8')).replace(/^\uFEFF/, '');
  return Object.fromEntries(text.split(/\r?\n/).filter(line => line && !line.startsWith('#'))
    .map(line => {
      const index = line.indexOf('=');
      if (index < 1) throw new Error(`Invalid line in ${name}`);
      return [line.slice(0, index), line.slice(index + 1)];
    }));
}

function makeClient(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) throw new Error('Migration credentials are incomplete');
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function check(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

async function listUsers(client) {
  const users = [];
  for (let page = 1; ; page++) {
    const data = check(await client.auth.admin.listUsers({ page, perPage: 100 }), 'List Auth users');
    users.push(...data.users);
    if (data.users.length < 100) return users;
  }
}

async function listFiles(client, folder = '') {
  const files = [];
  for (let offset = 0; ; offset += 100) {
    const entries = check(await client.storage.from('product-images').list(folder, {
      limit: 100, offset, sortBy: { column: 'name', order: 'asc' }
    }), 'List product images');
    for (const entry of entries) {
      const name = folder ? `${folder}/${entry.name}` : entry.name;
      if (entry.id) files.push(name);
      else files.push(...await listFiles(client, name));
    }
    if (entries.length < 100) return files;
  }
}

async function exportSource(source, sourceUrl) {
  const products = check(await source.from('products').select('*').order('slug'), 'Export products');
  const siteSettings = check(await source.from('site_settings').select('*'), 'Export settings');
  const adminUsers = check(await source.from('admin_users').select('*'), 'Export admin memberships');
  const authUsers = (await listUsers(source)).map(user => ({
    id: user.id, email: user.email, email_confirmed_at: user.email_confirmed_at
  }));
  const storageFiles = await listFiles(source);
  const snapshot = {
    source_url: sourceUrl, exported_at_utc: new Date().toISOString(), products,
    site_settings: siteSettings, admin_users: adminUsers,
    auth_users: authUsers, storage_files: storageFiles
  };
  await mkdir(path.dirname(snapshotPath), { recursive: true });
  await writeFile(snapshotPath, JSON.stringify(snapshot, null, 2) + '\n', { mode: 0o600 });
  console.log(`Exported ${products.length} products, ${siteSettings.length} settings rows, ` +
    `${adminUsers.length} admin memberships, ${authUsers.length} Auth users, ${storageFiles.length} images.`);
}

async function importTarget(source, target, sourceUrl, targetEnv) {
  const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));
  if (snapshot.source_url !== sourceUrl) throw new Error('Snapshot belongs to another source project');
  if (!Array.isArray(snapshot.products) || !Array.isArray(snapshot.site_settings) ||
      !Array.isArray(snapshot.admin_users) || !Array.isArray(snapshot.auth_users) ||
      !Array.isArray(snapshot.storage_files)) throw new Error('Invalid migration snapshot');
  if (snapshot.auth_users.length !== 1 || snapshot.admin_users.length !== 1 ||
      snapshot.auth_users[0].id !== snapshot.admin_users[0].user_id) {
    throw new Error('Expected the single existing admin account; inspect Auth data before importing');
  }
  if (!process.env.WRAP_ADMIN_PASSWORD) throw new Error('Set WRAP_ADMIN_PASSWORD for the new Auth account');

  const existingProducts = check(await target.from('products').select('slug'), 'Check target products');
  check(await target.from('products').select('ingredients,is_best_seller').limit(1),
    'Check target migrations 004 and 005 (run supabase/setup-remaining-project.sql)');
  check(await target.from('site_settings').select('id').limit(1), 'Check target settings');
  check(await target.from('admin_users').select('user_id').limit(1), 'Check target admin table');
  check(await target.storage.getBucket('product-images'), 'Check target image bucket');
  const sourceSlugs = new Set(snapshot.products.map(product => product.slug));
  if (existingProducts.some(product => !sourceSlugs.has(product.slug))) {
    throw new Error('Target contains products outside the source catalogue; import stopped');
  }

  const existingUsers = await listUsers(target);
  const sourceUser = snapshot.auth_users[0];
  let targetUser = existingUsers.find(user => user.email?.toLowerCase() === sourceUser.email.toLowerCase());
  if (existingUsers.some(user => user.id !== targetUser?.id)) {
    throw new Error('Target contains another Auth user; import stopped');
  }
  if (!targetUser) {
    const result = await target.auth.admin.createUser({
      email: sourceUser.email, password: process.env.WRAP_ADMIN_PASSWORD, email_confirm: true
    });
    targetUser = check(result, 'Create target admin account').user;
  } else {
    check(await target.auth.admin.updateUserById(targetUser.id, {
      password: process.env.WRAP_ADMIN_PASSWORD, email_confirm: true
    }), 'Update target admin account');
  }

  for (const file of snapshot.storage_files) {
    const extension = file.split('.').pop()?.toLowerCase();
    const mime = {
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
      gif: 'image/gif', avif: 'image/avif', bmp: 'image/bmp'
    }[extension];
    if (!mime) throw new Error(`Unsupported source image format: ${file}`);
    const blob = check(await source.storage.from('product-images').download(file), `Download ${file}`);
    check(await target.storage.from('product-images').upload(file, blob, {
      contentType: mime, upsert: true
    }), `Upload ${file}`);
  }

  check(await target.from('admin_users').upsert({ user_id: targetUser.id }), 'Add admin membership');
  check(await target.from('products').upsert(snapshot.products, { onConflict: 'slug' }), 'Import products');
  check(await target.from('site_settings').upsert(snapshot.site_settings, { onConflict: 'id' }), 'Import settings');

  const products = check(await target.from('products').select('*'), 'Verify products');
  const settings = check(await target.from('site_settings').select('*').eq('id', 1).single(), 'Verify settings');
  const membership = check(await target.from('admin_users').select('user_id').eq('user_id', targetUser.id), 'Verify admin');
  const targetBySlug = new Map(products.map(product => [product.slug, product]));
  const productsMatch = snapshot.products.every(sourceProduct => {
    const targetProduct = targetBySlug.get(sourceProduct.slug);
    return targetProduct && Object.entries(sourceProduct).every(([key, value]) =>
      key === 'updated_at' || JSON.stringify(targetProduct[key]) === JSON.stringify(value));
  });
  if (products.length !== snapshot.products.length || !productsMatch ||
      !membership.length ||
      ['uber_eats_url', 'doordash_url', 'skip_url'].some(key =>
        settings[key] !== snapshot.site_settings[0][key])) {
    throw new Error('Target verification failed; source project was not modified');
  }
  if (!targetEnv.SUPABASE_ANON_KEY) throw new Error('Target publishable key is missing');
  await writeFile(path.join(root, 'supabase/public-config.json'), JSON.stringify({
    supabaseUrl: targetEnv.SUPABASE_URL,
    supabaseAnonKey: targetEnv.SUPABASE_ANON_KEY
  }, null, 2) + '\n');
  await writeFile(path.join(root, '.env.local'),
    `SUPABASE_URL=${targetEnv.SUPABASE_URL}\nSUPABASE_ANON_KEY=${targetEnv.SUPABASE_ANON_KEY}\n`, { mode: 0o600 });
  console.log(`Verified target: ${products.length} products, ordering links, ` +
    `${membership.length} admin membership, ${snapshot.storage_files.length} images. Public config switched.`);
}

const mode = process.argv[2];
if (!['export', 'import'].includes(mode)) throw new Error('Usage: node scripts/migrate-supabase.mjs export|import');
const sourceEnv = await readEnv('.env.source.local');
const targetEnv = await readEnv('.env.target.local');
if (sourceEnv.SUPABASE_URL === targetEnv.SUPABASE_URL) throw new Error('Source and target projects are identical');
const source = makeClient(sourceEnv);
if (mode === 'export') await exportSource(source, sourceEnv.SUPABASE_URL);
else {
  await exportSource(source, sourceEnv.SUPABASE_URL);
  await importTarget(source, makeClient(targetEnv), sourceEnv.SUPABASE_URL, targetEnv);
}
