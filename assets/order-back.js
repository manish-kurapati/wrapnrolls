(() => {
  const back = document.querySelector('.back');
  if (!back) return;
  try {
    const source = sessionStorage.getItem('wrap-order-source');
    if (source && new URL(source).origin === location.origin) back.href = source;
  } catch {}
  back.addEventListener('click', event => {
    if (!document.referrer || new URL(document.referrer).origin !== location.origin) return;
    event.preventDefault();
    history.back();
  });
})();
