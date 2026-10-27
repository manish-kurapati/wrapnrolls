(() => {
 const root = document.querySelector('[data-menu-selection]');
 if (!root) return;
 const buttons = [...root.querySelectorAll('[data-wrap-filter]')];
 const favourites = root.querySelector('[data-menu-favourites]');
 const panel = root.querySelector('.category-menu');
 const heading = panel.querySelector('h2');
 const grid = panel.querySelector('.category-card-grid');
 const back = panel.querySelector('.category-menu-back');
 let selectedButton;

 function products() {
  if (window.WRAP_MENU_PRODUCTS) return window.WRAP_MENU_PRODUCTS.map(product => ({
   slug: product.slug,
   title: product.name,
   price: Number(product.price),
   offerPercent: product.offer_percent == null ? null : Number(product.offer_percent),
   offerLabel: product.offer_label || '',
   bestSeller: Boolean(product.is_best_seller),
   category: product.subcategory || '',
   image: product.image_url || ''
  }));
  return [...favourites.querySelectorAll('.menu-card')].map(card => ({
   slug: card.dataset.productSlug,
   title: card.querySelector('h3').textContent,
   price: Number((card.querySelector('.menu-price del')?.textContent || card.querySelector('.menu-price').textContent).replace(/[^0-9.]/g, '')),
   offerPercent: null,
   offerLabel: '',
   bestSeller: false,
   category: card.dataset.wrapCategory || '',
   image: card.querySelector('.menu-picture img')?.src || ''
  }));
 }

 function createCard(product) {
  const card = document.createElement('article');
  card.className = 'category-card';
  if (product.slug) {
   card.dataset.productSlug = product.slug;
  }
  const art = document.createElement('div');
  art.className = 'category-card-art';
  art.setAttribute('aria-hidden', 'true');
  if (product.image) {
   const image = document.createElement('img');
   image.src = product.image;
   image.alt = '';
   image.loading = 'lazy';
   art.append(image);
  }
  const hasOffer = product.offerPercent != null && Number.isFinite(product.offerPercent)
   && product.offerPercent > 0 && product.offerPercent <= 100;
  const offerLabel = hasOffer ? (product.offerLabel.trim()
   || Number(product.offerPercent.toFixed(2)) + '% OFF') : '';
  if (offerLabel) {
   const tag = document.createElement('span');
   tag.className = 'product-offer-tag';
   tag.textContent = offerLabel;
   art.append(tag);
  }
  if (product.bestSeller) {
   const tag = document.createElement('span');
   tag.className = 'best-seller-tag';
   tag.textContent = 'Best Seller';
   art.append(tag);
  }
  const info = document.createElement('div');
  info.className = 'category-card-info';
  const title = document.createElement('h3');
  title.textContent = product.title;
  const price = document.createElement('span');
  price.className = 'category-card-price';
  if (hasOffer) {
   const oldPrice = document.createElement('del');
   oldPrice.textContent = '$' + product.price.toFixed(2);
   const salePrice = document.createElement('strong');
   salePrice.textContent = '$' + (Math.round(product.price * (1 - product.offerPercent / 100) * 100) / 100).toFixed(2);
   price.append(oldPrice, salePrice);
  } else price.textContent = '$' + product.price.toFixed(2);
  info.append(title, price);
  if (product.slug) {
   const button = document.createElement('button');
   button.type = 'button';
   button.className = 'ingredient-info';
   button.textContent = 'i';
   button.setAttribute('aria-label', `Ingredients for ${product.title}`);
   info.append(button);
  }
  card.append(art, info);
  return card;
 }

 buttons.forEach(button => button.addEventListener('click', () => {
  const choice = button.dataset.wrapFilter;
  selectedButton = button;
  buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  const items = products().filter(product => root.dataset.menuSelection === 'sides'
   ? choice === 'breakfast' ? product.category === 'breakfast' : product.category !== 'breakfast'
   : product.category === choice);
  grid.replaceChildren(...items.map(createCard));
  if (!items.length) {
   const empty = document.createElement('p');
   empty.textContent = 'No products in this category yet.';
   grid.append(empty);
  }
  heading.textContent = button.textContent.trim();
  favourites.hidden = true;
  panel.hidden = false;
  heading.focus({ preventScroll: true });
  panel.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
 }));

 back.addEventListener('click', () => {
  panel.hidden = true;
  favourites.hidden = false;
  buttons.forEach(button => button.setAttribute('aria-pressed', 'false'));
  selectedButton?.focus({ preventScroll: true });
  root.querySelector('.wrap-choices').scrollIntoView({ behavior: 'instant', block: 'start' });
 });
})();
