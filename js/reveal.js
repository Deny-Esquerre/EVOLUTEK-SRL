// ===== REVEAL ON SCROLL (IntersectionObserver) =====
// Se engancha al ciclo de vida de la página: cada página que entra estrena su
// propio observer y lo desconecta al salir, sin dejar observers huérfanos.
(function () {
  const SELECTOR = '.reveal, .reveal-left, .reveal-right, .stagger';
  const observers = new WeakMap();

  function initReveal(root) {
    root = root || document;
    const els = root.querySelectorAll(SELECTOR);
    if (!els.length) return;

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    els.forEach(function (el) { observer.observe(el); });
    observers.set(root, observer);
  }

  function destroyReveal(root) {
    const observer = observers.get(root);
    if (observer) { observer.disconnect(); observers.delete(root); }
  }

  window.initReveal = initReveal;
  onPageInit(initReveal);
  onPageDestroy(destroyReveal);
})();
