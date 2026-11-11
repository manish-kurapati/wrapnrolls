(() => {
  const src = document.querySelector('header nav[aria-label="Main navigation"]');
  if (!src) return;
  const bar = document.createElement('div');
  bar.className = 'sticky-nav';
  bar.setAttribute('aria-hidden', 'true');
  const links = [...src.querySelectorAll('a:not(.page-home-link)')].map(a => {
    const c = document.createElement('a');
    c.href = a.getAttribute('href');
    c.textContent = a.textContent;
    c.tabIndex = -1;
    if (a.hasAttribute('aria-current')) c.className = 'is-current';
    if (a.classList.contains('nav-contact')) c.className += ' is-cta';
    return c;
  });
  bar.innerHTML = '<a class="sn-logo" tabindex="-1" href="index.html"><img src="logo-ivory.png" alt=""></a>' +
    '<a class="sn-home" tabindex="-1" href="index.html"><svg viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg></a>' +
    '<nav></nav>';
  links.forEach(l => bar.querySelector('nav').appendChild(l));
  document.body.appendChild(bar);
  let shown = false;
  const update = () => {
    const on = scrollY > 160;
    if (on !== shown) { shown = on; bar.classList.toggle('show', on); }
  };
  addEventListener('scroll', update, { passive: true });
  update();
})();
