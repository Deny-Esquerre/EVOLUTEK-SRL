// ===== STRATEGY RAIL: conexión progresiva al llegar al bloque =====
(function () {
  const observers = new WeakMap();
  const timers = new WeakMap();

  function initStrategyRail(root) {
    root = root || document;
    const rail = root.querySelector('#strategyRail');
    if (!rail) return;

    rail.classList.add('is-animated');

    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          rail.classList.add('is-connected', 'is-running');
          clearTimeout(timers.get(rail));
          timers.set(rail, setTimeout(function () {
            rail.classList.remove('is-running');
          }, 1050));
        } else {
          rail.classList.remove('is-connected', 'is-running');
        }
      });
    }, { threshold: 0.4 });

    observer.observe(rail);
    observers.set(root, observer);
  }

  function destroyStrategyRail(root) {
    const observer = observers.get(root);
    if (observer) { observer.disconnect(); observers.delete(root); }
    const rail = root.querySelector ? root.querySelector('#strategyRail') : null;
    if (rail) clearTimeout(timers.get(rail));
  }

  onPageInit(initStrategyRail);
  onPageDestroy(destroyStrategyRail);
})();
