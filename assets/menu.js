// Set this URL when the ordering app is ready.
const ORDER_URL = '';
const orderLink = document.querySelector('[data-order-link]');
if (orderLink && ORDER_URL) {
  orderLink.href = ORDER_URL;
  orderLink.target = '_blank';
  orderLink.rel = 'noopener noreferrer';
} else if (orderLink) {
  orderLink.addEventListener('click', event => {
    event.preventDefault();
    const note = document.getElementById('order-note');
    note.hidden = false;
    orderLink.setAttribute('aria-expanded', 'true');
  });
}
// Offer prices appear only when a valid discount has been configured.
document.querySelectorAll('.menu-card').forEach(card => {
  const slug = card.querySelector('img').getAttribute('src').split('/').pop().replace('.png', '');
  const offer = (window.WRAP_OFFERS || {})[slug];
  const price = card.querySelector('.menu-price');
  const regular = Number(price.textContent.replace('$', ''));
  if (!offer || !Number.isFinite(offer.price) || offer.price < 0 || offer.price >= regular) return;
  const badge = document.createElement('span');
  badge.className = 'offer-badge';
  const percent = Math.round((1 - offer.price / regular) * 100);
  const amount = document.createElement('strong');
  amount.textContent = percent + '%';
  const caption = document.createElement('small');
  caption.textContent = 'OFF';
  badge.append(amount, caption);
  badge.setAttribute('aria-label', percent + '% off');
  card.querySelector('.menu-picture').append(badge);
  price.replaceChildren();
  const oldPrice = document.createElement('del');
  oldPrice.textContent = '$' + regular.toFixed(2);
  oldPrice.setAttribute('aria-label', 'Regular price ' + regular.toFixed(2));
  const salePrice = document.createElement('span');
  salePrice.textContent = '$' + offer.price.toFixed(2);
  salePrice.setAttribute('aria-label', 'Offer price ' + offer.price.toFixed(2));
  price.append(oldPrice, salePrice);
});


