(() => {
 const root = document.querySelector('[data-menu-selection]');
 if (!root) return;
 const buttons = [...root.querySelectorAll('[data-wrap-filter]')];
 const favourites = root.querySelector('[data-menu-favourites]');
 const panel = root.querySelector('.category-menu');
 const heading = panel.querySelector('h2');
 const grid = panel.querySelector('.category-card-grid');
 const back = panel.querySelector('.category-menu-back');
 const sourceCards = [...favourites.querySelectorAll('.menu-card')];
 let selectedButton;

 function readCard(card) {
  const price = card.querySelector('.menu-price');
  return {
   title: card.querySelector('h3').textContent,
   // Category cards show the listed menu price, without promotional badges.
   price: price.querySelector('del')?.textContent || price.textContent.trim(),
   category: card.dataset.wrapCategory
  };
 }
 const products = sourceCards.map(readCard);
 // Sample breakfast sides use the listed side prices.
 // Replace this group with the final breakfast menu when supplied.
 const breakfastSides = [
  { title: 'Breakfast Fries', price: '$5.00' },
  { title: 'Seasoned Breakfast Fries', price: '$5.00' },
  { title: 'Sweet Potato Breakfast Fries', price: '$5.00' }
 ];

 function createCard(product) {
  const card = document.createElement('article');
  card.className = 'category-card';
  const art = document.createElement('div');
  art.className = 'category-card-art';
  // Leave the patterned artwork area empty until the final PNGs are supplied.
  art.setAttribute('aria-hidden', 'true');
  const info = document.createElement('div');
  info.className = 'category-card-info';
  const title = document.createElement('h3');
  title.textContent = product.title;
  const price = document.createElement('span');
  price.className = 'category-card-price';
  price.textContent = product.price;
  info.append(title, price);
  card.append(art, info);
  return card;
 }

 buttons.forEach(button => button.addEventListener('click', () => {
  const category = button.dataset.wrapFilter;
  selectedButton = button;
  buttons.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
  const items = root.dataset.menuSelection === 'wraps'
   ? products.filter(product => product.category === category)
   : category === 'breakfast' ? breakfastSides : products;
  grid.replaceChildren(...items.map(createCard));
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
