import { animate } from 'framer-motion/dom';

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const key = 'wrap-page-wave';
const colours = ['#d13e26', '#f5b106', '#ffefd2'];
const path = 'M0 90C240 210 400-35 680 75S1100 215 1440 60V220H0Z';
let busy = false;

function overlay(covered = false) {
 const root = document.createElement('div');
 root.className = 'route-wave-overlay';
 root.setAttribute('aria-hidden', 'true');
 const layers = colours.map(colour => {
  const layer = document.createElement('div');
  layer.className = 'route-wave-layer';
  layer.style.setProperty('--wave-colour', colour);
  layer.innerHTML = `<svg viewBox="0 0 1440 220" preserveAspectRatio="none"><path d="${path}"/></svg><svg class="route-wave-tail" viewBox="0 0 1440 220" preserveAspectRatio="none"><path d="${path}"/></svg>`;
  if (covered) layer.style.transform = 'translateY(0)';
  root.append(layer);
  return layer;
 });
 document.body.append(root);
 return { root, layers };
}

// Keep one linear timeline across the document change; never park at the centre.
const duration = 900;
const stagger = 55;
const coverAt = duration / 2 + stagger * (colours.length - 1);
function sweep(layers, startedAt = Date.now()) {
 const elapsed = Date.now() - startedAt;
 return Promise.all(layers.map((layer, index) => {
  const progress = Math.max(0, Math.min(1, (elapsed - index * stagger) / duration));
  const from = 135 - 270 * progress;
  layer.style.transform = 'translateY(' + from + '%)';
  return animate(layer,
   { transform: ['translateY(' + from + '%)', 'translateY(-135%)'] },
   { duration: (duration * (1 - progress)) / 1000, delay: Math.max(0, index * stagger - elapsed) / 1000, ease: 'linear' }
  );
 }));
}
function after(milliseconds) { return new Promise(resolve => setTimeout(resolve, milliseconds)); }
function clearFlag() { try { sessionStorage.removeItem(key); } catch {} }
let entering = null;
try { entering = JSON.parse(sessionStorage.getItem(key)); } catch {}
clearFlag();
if (entering?.startedAt && !reduce.matches) {
 const { root, layers } = overlay();
 const finished = sweep(layers, entering.startedAt);
 document.documentElement.classList.remove('route-wave-pending');
 finished.finally(() => root.remove());
} else document.documentElement.classList.remove('route-wave-pending');

// The opening intro uses the same wipe, so no second animation engine competes.
window.WrapPageTransition = {
 async reveal(action) {
  if (reduce.matches) { action(); return; }
  const { root, layers } = overlay();
  try {
   const finished = sweep(layers);
   await after(coverAt);
   action();
   await finished;
  } finally { root.remove(); }
 }
};

const warmed = new Map();
function warmPage(href) {
 if (!warmed.has(href)) {
  warmed.set(href, fetch(href, { cache: 'force-cache' }).then(response => {
   if (!response.ok) throw new Error('Page unavailable');
   return response.text();
  }).catch(() => {}));
 }
 return warmed.get(href);
}
function warmLink(event) {
 const link = event.target.closest('a[href]');
 if (!link) return;
 const url = new URL(link.href, location.href);
 if (url.origin === location.origin && url.pathname.endsWith('.html') && url.pathname !== location.pathname) warmPage(url.href);
}
document.addEventListener('pointerover', warmLink, { passive: true });
document.addEventListener('focusin', warmLink);
document.addEventListener('touchstart', warmLink, { passive: true });

document.addEventListener('click', async event => {
 const link = event.target.closest('a[href]');
 if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
 const url = new URL(link.href, location.href);
 if (url.origin !== location.origin || !url.pathname.endsWith('.html') || url.pathname === location.pathname || reduce.matches) return;
 event.preventDefault();
 if (busy) return;
 busy = true;
 // Load the document before the wipe starts so its midpoint never waits on I/O.
 await warmPage(url.href);
 const { root, layers } = overlay();
 try {
  const startedAt = Date.now();
  sweep(layers, startedAt).catch(() => {});
  await after(coverAt);
  try { sessionStorage.setItem(key, JSON.stringify({ startedAt })); } catch {}
  location.assign(url.href);
 } catch {
  root.remove();
  location.assign(url.href);
 }
});

addEventListener('pageshow', event => {
 if (!event.persisted) return;
 document.querySelectorAll('.route-wave-overlay').forEach(node => node.remove());
 document.documentElement.classList.remove('route-wave-pending');
 clearFlag();
 busy = false;
});
