(() => {
  const wraps = document.querySelector('.wraps-intro .floating-fillings');
  if (wraps) {
    const cheese = wraps.querySelector('.title-cheese');
    if (cheese) {
      const second = cheese.cloneNode(true);
      second.classList.add('title-cheese-extra');
      wraps.append(second);
    }
  }
  const burgers = document.querySelector('#burgers .category-title-scene');
  if (burgers) {
    const tomato = burgers.querySelector('.title-tomato');
    if (tomato) {
      const second = tomato.cloneNode(true);
      second.classList.add('title-tomato-extra');
      burgers.append(second);
    }
  }
})();
