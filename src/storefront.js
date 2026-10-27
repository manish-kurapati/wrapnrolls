import { supabase, money, safeExternalUrl } from './supabase.js';
import { productImage } from './product-images.js';
import { discountedPrice, offerFor, showOfferTag, showPrice } from './offers.js';

const category = document.body.classList.contains('soda-page') ? 'sodas' :
  document.querySelector('[data-menu-selection]')?.dataset.menuSelection ||
  (location.pathname.endsWith('burgers.html') ? 'burgers' : null);
const removedBurgerSlugs = new Set([
  'double-double-burger',
  'duet-shrimp-beef-burger',
  'onion-mushroom-burger',
  'ring-burger'
]);

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

function updateCard(element, product) {
  element.dataset.productSlug = product.slug;
  element.dataset.wrapCategory = product.subcategory || '';
  element.querySelector('h3').textContent = product.name;
  const description = element.querySelector('.menu-card-body p');
  if (description) description.textContent = product.description || '';
  showPrice(element.querySelector('.menu-price'), product);
  const picture = element.querySelector('.menu-picture');
  setPicture(picture, product);
  showOfferTag(picture, product);
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

function updateSodaRow(element, product) {
  element.querySelector('h3, h4').textContent = product.name;
  showOfferTag(element.querySelector('h3, h4').parentElement, product);
  const description = element.querySelector('p');
  if (description) description.textContent = product.description || '';
  const prices = [...element.querySelectorAll('.drink-price')];
  const offer = offerFor(product);
  updateDrinkPrice(prices[0], product.price, element.classList.contains('dirty-menu-row') ? 'Regular' : '', offer?.percent);
  updateDrinkPrice(prices[1], product.price_medium, 'Medium', offer?.percent);
  updateDrinkPrice(prices[2], product.price_large, 'Large', offer?.percent);
  const url = productImage(product);
  const holder = element.querySelector('.drink-info') || element;
  holder.querySelector('svg.drink-mini')?.remove();
  if (url) {
    holder.querySelector('.drink-mini-placeholder')?.remove();
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
    if (!holder.querySelector('.drink-mini-placeholder')) {
      const placeholder = document.createElement('span');
      placeholder.className = 'drink-mini drink-mini-placeholder';
      placeholder.setAttribute('aria-hidden', 'true');
      holder.prepend(placeholder);
    }
  }
}

function createSodaRow(product) {
  const isAlani = product.subcategory === 'alani';
  const article = document.createElement('article');
  article.className = isAlani ? 'alani-card' : 'dirty-menu-row';
  const info = document.createElement('div');
  if (!isAlani) info.className = 'drink-info';
  const image = document.createElement('span');
  image.className = 'drink-mini drink-mini-placeholder';
  image.setAttribute('aria-hidden', 'true');
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
