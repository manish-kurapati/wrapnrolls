import { supabase, money, safeExternalUrl } from './supabase.js';
import { productImage } from './product-images.js';
import { discountedPrice, offerFor, showOfferTag, showPrice } from './offers.js';

const category = document.body.classList.contains('soda-page') ? 'sodas' :
  document.querySelector('[data-menu-selection]')?.dataset.menuSelection ||
  (/\/burgers(?:\.html)?\/?$/.test(location.pathname) ? 'burgers' : null);
const removedBurgerSlugs = new Set([
  'double-double-burger',
  'duet-shrimp-beef-burger',
  'onion-mushroom-burger',
  'ring-burger'
]);
let visibleProducts = [];

function prepareIngredientDialog() {
  const dialog = document.createElement('dialog');
  dialog.className = 'ingredients-dialog';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'ingredients-close';
  close.textContent = 'Close';
  close.addEventListener('click', () => dialog.close());
  const title = document.createElement('h2');
  const heading = document.createElement('h3');
  heading.textContent = 'Ingredients';
  const content = document.createElement('p');
  dialog.append(close, title, heading, content);
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  document.body.append(dialog);
  document.addEventListener('click', event => {
    const card = event.target.closest('.menu-card, .category-card, .dirty-menu-row, .alani-card');
    if (!card || !card.dataset.productSlug) return;
    const product = visibleProducts.find(item => item.slug === card.dataset.productSlug);
    if (!product) return;
    title.textContent = product.name;
    content.textContent = product.ingredients?.trim() || 'Ingredients have not been listed yet.';
    dialog.showModal();
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = event.target.closest('.menu-card, .category-card, .dirty-menu-row, .alani-card');
    if (!card || !card.dataset.productSlug) return;
    event.preventDefault();
    card.click();
  });
}
prepareIngredientDialog();

function makeSelectable(element, product) {
  element.dataset.productSlug = product.slug;
  element.tabIndex = 0;
  element.setAttribute('role', 'button');
  element.setAttribute('aria-label', `View ingredients for ${product.name}`);
}

function setPicture(container, product) {
  if (!container) return;
  const url = productImage(product);
  let image = container.querySelector('img');
  if (!url) {
    image?.remove();
    return;
  }
  if (!image) {
    image = document.createElement('img');
    container.prepend(image);
  }
  image.src = url;
  image.alt = product.name;
  image.loading = 'eager';
}

function showBestSeller(container, product) {
  container.querySelector('.best-seller-tag')?.remove();
  if (!product.is_best_seller) return;
  const tag = document.createElement('span');
  tag.className = 'best-seller-tag';
  tag.textContent = 'Best Seller';
  container.append(tag);
}

function updateCard(element, product) {
  makeSelectable(element, product);
  element.dataset.wrapCategory = product.subcategory || '';
  element.querySelector('h3').textContent = product.name;
  const description = element.querySelector('.menu-card-body p');
  if (description) description.textContent = product.description || '';
  showPrice(element.querySelector('.menu-price'), product);
  const picture = element.querySelector('.menu-picture');
  setPicture(picture, product);
  showOfferTag(picture, product);
  showBestSeller(picture, product);
}

function createCard(product) {
  const article = document.createElement('article');
  article.className = 'menu-card';
  const picture = document.createElement('div');
  picture.className = 'menu-picture';
  const body = document.createElement('div');
  body.className = 'menu-card-body';
  const title = document.createElement('h3');
  const description = document.createElement('p');
  const price = document.createElement('span');
  price.className = 'menu-price';
  body.append(title, description, price);
  article.append(picture, body);
  updateCard(article, product);
  return article;
}

function renderCardHierarchy(items) {
  const section = document.querySelector('.menu-section');
  const bySlug = new Map(items.map(item => [item.slug, item]));
  const used = new Set();
  section.querySelectorAll('.menu-card[data-product-slug]').forEach(element => {
    const product = bySlug.get(element.dataset.productSlug);
    if (!product) element.remove();
    else { updateCard(element, product); used.add(product.slug); }
  });
  // Wraps and sides have category panels for the full menu. Their main cards
  // stay as the original shortlist. New items appear in their selected panel.
  if (category === 'burgers') {
    const grid = section.querySelector('.menu-grid');
    for (const product of items.filter(item => !used.has(item.slug))) {
      if (!removedBurgerSlugs.has(product.slug)) grid.append(createCard(product));
    }
  }
}

function updateDrinkPrice(element, value, label, discountPercent = null) {
  if (!element) return;
  if (value == null) { element.hidden = true; return; }
  element.hidden = false;
  element.replaceChildren();
  if (discountPercent != null) {
    const oldPrice = document.createElement('del');
    oldPrice.textContent = money(value);
    const newPrice = document.createElement('strong');
    newPrice.className = 'offer-price';
    newPrice.textContent = money(discountedPrice(value, discountPercent));
    element.append(oldPrice, newPrice);
  } else element.textContent = money(value);
  if (label) {
    const small = document.createElement('small');
    small.textContent = label;
    element.append(small);
  }
}

function createSodaIllustration() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'drink-mini');
  svg.setAttribute('viewBox', '0 0 100 140');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = '<path d="M24 40L31 125Q50 135 69 125L76 40Z" fill="#f7a277" stroke="#42191f" stroke-width="2.2"/><path d="M26 55Q41 42 50 57T74 52" fill="none" stroke="#fff0d2" stroke-width="7"/><path d="M52 37L59 10L80 5" fill="none" stroke="#42191f" stroke-width="5"/><ellipse cx="50" cy="39" rx="29" ry="8" fill="#fff0d2" stroke="#42191f" stroke-width="2.2"/><circle cx="50" cy="88" r="20" fill="#ed5428" stroke="#fff0d2"/>';
  return svg;
}

function updateSodaRow(element, product) {
  makeSelectable(element, product);
  element.querySelector('h3, h4').textContent = product.name;
  showOfferTag(element.querySelector('h3, h4').parentElement, product);
  showBestSeller(element.querySelector('h3, h4').parentElement, product);
  const description = element.querySelector('p');
  if (description) description.textContent = product.description || '';
  const prices = [...element.querySelectorAll('.drink-price')];
  const offer = offerFor(product);
  updateDrinkPrice(prices[0], product.price, element.classList.contains('dirty-menu-row') ? 'Regular' : '', offer?.percent);
  updateDrinkPrice(prices[1], product.price_medium, 'Medium', offer?.percent);
  updateDrinkPrice(prices[2], product.price_large, 'Large', offer?.percent);
  const url = productImage(product);
  const holder = element.querySelector('.drink-info') || element;
  if (url) {
    holder.querySelector('svg.drink-mini')?.remove();
    let image = holder.querySelector('img.drink-mini');
    if (!image) {
      image = document.createElement('img');
      image.className = 'drink-mini';
      image.alt = '';
      image.loading = 'lazy';
      holder.prepend(image);
    }
    image.src = url;
  } else {
    holder.querySelector('img.drink-mini')?.remove();
    if (!holder.querySelector('svg.drink-mini')) holder.prepend(createSodaIllustration());
  }
}

function createSodaRow(product) {
  const isAlani = product.subcategory === 'alani';
  const article = document.createElement('article');
  article.className = isAlani ? 'alani-card' : 'dirty-menu-row';
  const info = document.createElement('div');
  if (!isAlani) info.className = 'drink-info';
  const image = createSodaIllustration();
  const copy = document.createElement('div');
  copy.append(document.createElement(isAlani ? 'h4' : 'h3'), document.createElement('p'));
  if (isAlani) article.append(image, copy);
  else { info.append(image, copy); article.append(info); }
  for (let i = 0; i < (isAlani ? 1 : 3); i++) {
    const price = document.createElement('div');
    price.className = 'drink-price';
    article.append(price);
  }
  updateSodaRow(article, product);
  return article;
}

function renderSodas(items) {
  const root = document.querySelector('.dirty-menu');
  const existing = [...root.querySelectorAll('.dirty-menu-row, .alani-card')];
  const used = new Set();
  for (const row of existing) {
    const title = row.querySelector('h3, h4')?.textContent.trim().toLowerCase();
    const product = items.find(item => item.name.toLowerCase() === title);
    if (!product) row.remove();
    else { updateSodaRow(row, product); used.add(product.slug); }
  }
  for (const product of items.filter(item => !used.has(item.slug))) {
    const target = product.subcategory === 'alani' ? root.querySelector('.alani-grid') : root.querySelector('.dirty-menu-table');
    target?.append(createSodaRow(product));
  }
}

function renderProducts(products, unavailable = false) {
  if (!category) return;
  const items = products.filter(item => item.category === category && item.is_active);
  visibleProducts = items;
  window.WRAP_MENU_PRODUCTS = items.map(item => ({ ...item, image_url: productImage(item) }));
  if (unavailable) {
    const section = document.querySelector('.dirty-menu, .menu-section');
    section.querySelectorAll('.menu-card, .text-menu-item, .dirty-menu-row, .alani-card').forEach(element => element.remove());
    const message = document.createElement('p');
    message.textContent = 'Menu temporarily unavailable. Please try again shortly.';
    message.className = 'menu-unavailable';
    section.prepend(message);
    return;
  }
  if (category === 'sodas') renderSodas(items);
  else renderCardHierarchy(items);
}

async function load() {
  if (!supabase) return;
  const products = await supabase.from('products').select('*').eq('is_active', true).order('sort_order').order('name');
  if (products.error) {
    console.error('Could not load menu:', products.error.message);
    renderProducts([], true);
  } else renderProducts(products.data || []);
}
load();
