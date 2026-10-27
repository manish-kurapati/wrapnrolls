import { supabase, money, safeExternalUrl } from './supabase.js';
import { productImage } from './product-images.js';

const $ = selector => document.querySelector(selector);
let statusTimer;
const status = message => {
  $('#status').textContent = message;
  clearTimeout(statusTimer);
  if (message) statusTimer = setTimeout(() => { $('#status').textContent = ''; }, 7000);
};
const form = $('#product-form');
let products = [];
let offersAvailable = false;
const page = document.body.dataset.adminPage || 'overview';
document.querySelector(`[data-page-link="${page}"]`)?.setAttribute('aria-current', 'page');
const pageTitles = { overview: ['Menu manager', 'Keep every item fresh and ready to order.'], products: ['Products', 'Edit photos, prices and product visibility.'], ordering: ['Ordering links', 'Send customers to your delivery partners.'] };
$('.dashboard-header h1').innerHTML = `${pageTitles[page][0]}<span class="title-dot">.</span>`;
$('.dashboard-header p').textContent = pageTitles[page][1];

const sections = {
  wraps: [['special', 'Special Wraps'], ['breakfast', 'Breakfast Wraps']],
  sides: [['regular', 'Regular Sides'], ['breakfast', 'Breakfast Sides']],
  sodas: [['classic', 'Classic Dirty Sodas'], ['alani', 'Alani NU']],
  burgers: [['standard', 'Burgers']]
};
function setSubcategory(category, value) {
  const select = form.elements.subcategory;
  select.replaceChildren(...sections[category].map(([id, label]) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = label;
    return option;
  }));
  select.value = value && sections[category].some(([id]) => id === value) ? value : sections[category][0][0];
  $('#subcategory-help').textContent = category === 'burgers' ? 'Burgers appear in the burger menu.' : 'This controls the category menu where the product appears.';
}
form.elements.category.addEventListener('change', event => setSubcategory(event.target.value));
setSubcategory(form.elements.category.value);

function applyFilters() {
  const query = $('#product-search').value.trim().toLowerCase();
  const category = $('#category-filter').value;
  let count = 0;
  $('#product-list').querySelectorAll('.product-row').forEach(row => {
    row.hidden = Boolean((category && row.dataset.category !== category) || (query && !row.dataset.search.includes(query)));
    if (!row.hidden) count++;
  });
  $('#product-list').querySelector('.empty-list')?.remove();
  if (!count) {
    const empty = document.createElement('p');
    empty.className = 'empty-list';
    empty.textContent = products.length ? 'No products match your search.' : 'No products yet. Add your first item.';
    $('#product-list').append(empty);
  }
  $('#product-count').textContent = `${count} item${count === 1 ? '' : 's'}`;
}

async function refresh() {
  const [{ data, error }, settings] = await Promise.all([
    supabase.from('products').select('*').order('category').order('sort_order').order('name'),
    supabase.from('site_settings').select('*').eq('id', 1).maybeSingle()
  ]);
  if (error) return status(error.message);
  products = data || [];
  offersAvailable = products.length > 0 && Object.hasOwn(products[0], 'offer_percent');
  $('#stat-total').textContent = products.length;
  $('#stat-active').textContent = products.filter(product => product.is_active).length;
  $('#stat-images').textContent = products.filter(product => product.image_path).length;
  const list = $('#product-list');
  list.replaceChildren();
  for (const product of products) {
    const row = document.createElement('div');
    row.className = 'product-row' + (product.is_active ? '' : ' muted');
    row.dataset.category = product.category;
    row.dataset.search = `${product.name} ${product.description || ''} ${product.slug}`.toLowerCase();
    const imageSource = productImage(product);
    const img = document.createElement(imageSource ? 'img' : 'span');
    if (imageSource) { img.src = imageSource; img.alt = ''; }
    else { row.classList.add('no-photo'); img.className = 'product-thumbnail'; img.setAttribute('aria-label', 'No product photo'); }
    const info = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = product.name;
    const detail = document.createElement('p');
    detail.textContent = `${product.category}${product.subcategory ? ' / ' + product.subcategory : ''} · ${money(product.price)}${product.price_medium != null ? ' / ' + money(product.price_medium) : ''}${product.price_large != null ? ' / ' + money(product.price_large) : ''}${product.is_active ? '' : ' · hidden'}`;
    info.append(title, detail);
    if (product.offer_percent != null) {
      const offer = document.createElement('span');
      offer.className = 'admin-offer-tag';
      offer.textContent = product.offer_label?.trim() || `${Number(Number(product.offer_percent).toFixed(2))}% OFF`;
      info.append(offer);
    }
    const actions = document.createElement('div');
    actions.className = 'actions';
    for (const [label, action] of [['Edit', 'edit'], [product.is_active ? 'Hide' : 'Show', 'toggle'], ['Delete', 'delete']]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.action = action;
      button.dataset.id = product.id;
      button.textContent = label;
      if (action !== 'edit') button.className = 'secondary';
      actions.append(button);
    }
    row.append(img, info, actions);
    list.append(row);
  }
  applyFilters();
  if (settings.error) status(settings.error.message);
  else if (settings.data) {
    $('#settings-form').elements.uber_eats_url.value = settings.data.uber_eats_url || '';
    $('#settings-form').elements.doordash_url.value = settings.data.doordash_url || '';
    $('#settings-form').elements.skip_url.value = settings.data.skip_url || 'https://www.skipthedishes.com/wrap-n-roll-619';
  }
}

$('#product-search').addEventListener('input', applyFilters);
$('#category-filter').addEventListener('change', applyFilters);
form.elements.name.addEventListener('input', event => {
  if (form.elements.id.value || form.elements.slug.dataset.edited === 'true') return;
  form.elements.slug.value = event.target.value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
});
form.elements.slug.addEventListener('input', () => { form.elements.slug.dataset.edited = 'true'; });
form.elements.image.addEventListener('change', event => {
  const file = event.target.files[0];
  if (!file) return;
  const preview = $('#image-preview');
  if (preview.dataset.objectUrl) URL.revokeObjectURL(preview.dataset.objectUrl);
  preview.dataset.objectUrl = URL.createObjectURL(file);
  preview.src = preview.dataset.objectUrl;
  preview.hidden = false;
});

async function checkSession() {
  if (!supabase) {
    $('#login-panel').hidden = false;
    $('#auth-loading').hidden = true;
    return status('Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY, then rebuild.');
  }
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  $('#auth-loading').hidden = true;
  if (authError) status(authError.message);
  if (!user) {
    $('#login-panel').hidden = false;
    $('#admin-panel').hidden = true;
    $('#sign-out').hidden = true;
    return;
  }
  const { data, error } = await supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
  if (error?.code === 'PGRST205') {
    $('#login-panel').hidden = false;
    status('Database setup is incomplete. Run the SQL migration in Supabase, then reload this page.');
    return;
  }
  if (error || !data) {
    await supabase.auth.signOut();
    $('#login-panel').hidden = false;
    status('This account is not an administrator. Ask the Supabase project owner to add it to admin_users.');
    return;
  }
  $('#login-panel').hidden = true;
  $('#admin-panel').hidden = false;
  $('#sign-out').hidden = false;
  await refresh();
}

$('#login-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (!supabase) return status('Supabase is not configured yet.');
  const { email, password } = event.currentTarget.elements;
  const { error } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value });
  if (error) return status(error.message);
  status('Signed in.');
  await checkSession();
});

$('#sign-out').addEventListener('click', async () => {
  $('#admin-panel').hidden = true;
  $('#auth-loading').hidden = false;
  await supabase.auth.signOut();
  status('Signed out.');
  checkSession();
});

$('#settings-form').addEventListener('submit', async event => {
  event.preventDefault();
  const f = event.currentTarget.elements;
  const urls = [f.uber_eats_url.value.trim(), f.doordash_url.value.trim(), f.skip_url.value.trim()];
  if (urls.some(url => url && !safeExternalUrl(url))) return status('Delivery links must start with https://.');
  const { error } = await supabase.from('site_settings').upsert({ id: 1, uber_eats_url: urls[0] || null, doordash_url: urls[1] || null, skip_url: urls[2] || null });
  status(error ? error.message : 'Delivery links saved.');
});

function resetForm() {
  form.reset();
  form.elements.id.value = '';
  setSubcategory(form.elements.category.value);
  delete form.elements.slug.dataset.edited;
  if ($('#image-preview').dataset.objectUrl) URL.revokeObjectURL($('#image-preview').dataset.objectUrl);
  delete $('#image-preview').dataset.objectUrl;
  $('#product-form-title').textContent = 'Add product';
  $('#cancel-edit').hidden = true;
  $('#image-preview').hidden = true;
}
$('#cancel-edit').addEventListener('click', resetForm);

$('#product-list').addEventListener('click', async event => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const product = products.find(item => item.id === button.dataset.id);
  if (!product) return;
  if (button.dataset.action === 'edit') {
    delete form.elements.slug.dataset.edited;
    form.elements.category.value = product.category;
    setSubcategory(product.category, product.subcategory);
    for (const key of ['id','name','slug','description','price','offer_percent','offer_label','price_medium','price_large','sort_order']) form.elements[key].value = product[key] ?? '';
    form.elements.is_active.checked = product.is_active;
    form.elements.remove_image.checked = false;
    $('#image-preview').src = productImage(product);
    $('#image-preview').hidden = !product.image_path;
    $('#product-form-title').textContent = `Edit ${product.name}`;
    $('#cancel-edit').hidden = false;
    form.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  if (button.dataset.action === 'delete' && !confirm(`Delete ${product.name}?`)) return;
  const result = button.dataset.action === 'delete'
    ? await supabase.from('products').delete().eq('id', product.id)
    : await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id);
  if (result.error) return status(result.error.message);
  if (button.dataset.action === 'delete' && product.image_path) await supabase.storage.from('product-images').remove([product.image_path]);
  status('Product updated.');
  await refresh();
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  const f = form.elements;
  const image = f.image.files[0];
  if (image && (image.type !== 'image/png' || !image.name.toLowerCase().endsWith('.png') || image.size > 5 * 1024 * 1024)) return status('Use a PNG image up to 5 MB.');
  const offerPercent = f.offer_percent.value === '' ? null : Number(f.offer_percent.value);
  const offerLabel = f.offer_label.value.trim() || null;
  if (offerPercent != null && (!Number.isFinite(offerPercent) || offerPercent <= 0 || offerPercent > 100)) return status('Discount must be greater than 0% and at most 100%.');
  if (offerLabel && offerPercent == null) return status('Enter a discount percentage before adding an offer badge.');
  if (offerPercent != null && !offersAvailable) return status('Offer database setup is pending. Run the new Supabase SQL migration first.');
  const existing = products.find(item => item.id === f.id.value);
  let path = f.remove_image.checked ? null : existing?.image_path || null;
  let uploadedPath = null;
  if (image) {
    uploadedPath = `${crypto.randomUUID()}.png`;
    const { error } = await supabase.storage.from('product-images').upload(uploadedPath, image, { contentType: image.type, upsert: false });
    if (error) return status('Image upload failed: ' + error.message);
    path = uploadedPath;
  }
  const record = { name: f.name.value.trim(), slug: f.slug.value.trim(), category: f.category.value,
    subcategory: f.subcategory.value.trim() || null, description: f.description.value.trim(),
    price: Number(f.price.value), price_medium: f.price_medium.value ? Number(f.price_medium.value) : null,
    price_large: f.price_large.value ? Number(f.price_large.value) : null,
    sort_order: Number(f.sort_order.value), is_active: f.is_active.checked, image_path: path };
  if (offersAvailable) {
    record.offer_percent = offerPercent;
    record.offer_label = offerLabel;
  }
  const result = existing
    ? await supabase.from('products').update(record).eq('id', existing.id)
    : await supabase.from('products').insert(record);
  if (result.error) {
    if (uploadedPath) await supabase.storage.from('product-images').remove([uploadedPath]);
    return status(result.error.message);
  }
  if (existing?.image_path && existing.image_path !== path) await supabase.storage.from('product-images').remove([existing.image_path]);
  status('Product saved.');
  resetForm();
  await refresh();
});

checkSession();
