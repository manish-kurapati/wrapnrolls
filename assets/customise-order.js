// Set the delivery-app URL here when it is ready.
const CUSTOM_ORDER_URL = '';
const customOrderLink = document.querySelector('.custom-order-link');
if (CUSTOM_ORDER_URL) {
  customOrderLink.href = CUSTOM_ORDER_URL;
  customOrderLink.target = '_blank';
  customOrderLink.rel = 'noopener noreferrer';
} else {
  customOrderLink.addEventListener('click', event => {
    event.preventDefault();
    document.getElementById('custom-order-note').hidden = false;
    customOrderLink.setAttribute('aria-expanded', 'true');
  });
}
