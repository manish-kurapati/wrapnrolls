// Set this URL when the ordering app is ready.
const ORDER_URL = '';
const orderLink = document.querySelector('[data-order-link]');
if (ORDER_URL) {
  orderLink.href = ORDER_URL;
  orderLink.target = '_blank';
  orderLink.rel = 'noopener noreferrer';
} else {
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


const making = document.querySelector('.making');
const steps = [...document.querySelectorAll('.making-step')];
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const stage = document.createElement('div');
stage.className = 'making-stage';
const stepContainer = making.querySelector('.making-steps');
stepContainer.before(stage);
stage.append(stepContainer);
stage.prepend(making.querySelector('.making-header'));
const progress = document.createElement('div');
progress.className = 'making-progress';
progress.setAttribute('aria-hidden', 'true');
progress.innerHTML = '<span></span>'.repeat(4);
stage.append(progress);
let scheduled = false;
function drawMaking() {
  scheduled = false;
  const animated = !motionPreference.matches;
  making.classList.toggle('scroll-making', animated);
  if (!animated) {
    steps.forEach(step => { step.style.cssText = ''; step.removeAttribute('aria-hidden'); });
    return;
  }
  const distance = making.offsetHeight - stage.offsetHeight;
  const progressValue = Math.max(0, Math.min(1, -making.getBoundingClientRect().top / Math.max(1, distance)));
  const position = progressValue * 3;
  const active = Math.round(position);
  steps.forEach((step, index) => {
    const offset = index - position;
    step.style.opacity = String(Math.max(0, 1 - Math.abs(offset) * 1.8));
    step.style.transform = `translateY(${offset * 70}px) scale(${1 - Math.min(Math.abs(offset), 1) * .08})`;
    step.style.pointerEvents = index === active ? 'auto' : 'none';
    step.setAttribute('aria-hidden', String(index !== active));
    const art = step.querySelector('.step-art');
    art.style.transform = `rotate(${offset * -12}deg) translateY(${offset * -25}px)`;
  });
  [...progress.children].forEach((dot, index) => dot.classList.toggle('active', index === active));
}
function scheduleMaking() {
  if (!scheduled) { scheduled = true; requestAnimationFrame(drawMaking); }
}
addEventListener('scroll', scheduleMaking, {passive:true});
addEventListener('resize', scheduleMaking);
motionPreference.addEventListener('change', drawMaking);
drawMaking();