import { money } from './supabase.js';

export function offerFor(product) {
  const percent = product.offer_percent == null ? null : Number(product.offer_percent);
  if (percent == null || !Number.isFinite(percent) || percent <= 0 || percent > 100) return null;
  return {
    percent,
    label: String(product.offer_label || '').trim() || `${Number(percent.toFixed(2))}% OFF`
  };
}

export function discountedPrice(value, percent) {
  return Math.round(Number(value) * (1 - percent / 100) * 100) / 100;
}

export function showPrice(element, product) {
  const offer = offerFor(product);
  element.replaceChildren();
  if (!offer) {
    element.textContent = money(product.price);
    return;
  }
  const oldPrice = document.createElement('del');
  oldPrice.textContent = money(product.price);
  const newPrice = document.createElement('strong');
  newPrice.className = 'offer-price';
  newPrice.textContent = money(discountedPrice(product.price, offer.percent));
  element.append(oldPrice, newPrice);
}

export function showOfferTag(container, product) {
  container.querySelector('.product-offer-tag')?.remove();
  const offer = offerFor(product);
  if (!offer) return;
  const tag = document.createElement('span');
  tag.className = 'product-offer-tag';
  tag.textContent = offer.label;
  container.append(tag);
}
