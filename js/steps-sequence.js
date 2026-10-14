// ===== SECUENCIA DE PASOS LIGADA AL SCROLL =====
// El paso resaltado avanza (y retrocede) según el scroll dentro de la sección.
// Al llegar a la imagen de resultado, aparece el brillo en su contorno.
// Uso: <div class="exp-grid" data-steps> ... .exp-card ...
//      <figure data-steps-result> ... </figure>
(function () {
  // { page, update } — así se pueden descartar los de una página retirada.
  var entries = [];

  function runAll() {
    entries.forEach(function (entry) { entry.update(); });
  }

  // Permite recalcular la secuencia desde otros scripts (p. ej. al cambiar de página)
  window.updateStepsSequence = runAll;

  function initSteps(page, root) {
    var cards = Array.prototype.slice.call(root.querySelectorAll('.exp-card'));
    if (!cards.length) return;

    var section = root.closest('.section') || root.parentElement;
    var result = section.querySelector('[data-steps-result]');
    var states = cards.length + (result ? 1 : 0);

    function setState(idx) {
      var glow = result && idx >= cards.length;
      var cardIdx = glow ? cards.length - 1 : idx;
      cards.forEach(function (card, i) {
        card.classList.toggle('is-active', i === cardIdx);
      });
      if (result) result.classList.toggle('is-glow', glow);
    }

    function update() {
      // Ignora si la página está oculta o sin layout
      if (!root.getClientRects().length) return;

      var vh = window.innerHeight || document.documentElement.clientHeight;
      var sy = window.pageYOffset || window.scrollY;

      var gridTop = root.getBoundingClientRect().top + sy;
      var figBottom = (result ? result.getBoundingClientRect().bottom : root.getBoundingClientRect().bottom) + sy;

      // 0% cuando la cuadrícula entra en la parte baja del viewport,
      // 100% cuando la imagen queda a media altura de la pantalla.
      var start = gridTop - vh * 0.8;
      var end = figBottom - vh * 0.4;
      if (end <= start) return;

      var p = (sy - start) / (end - start);
      p = Math.max(0, Math.min(1, p));
      setState(Math.min(states - 1, Math.floor(p * states)));
    }

    entries.push({ page: page, update: update });
    update();
  }

  function initPageSteps(page) {
    page.querySelectorAll('[data-steps]').forEach(function (root) {
      initSteps(page, root);
    });
  }

  function destroyPageSteps(page) {
    entries = entries.filter(function (entry) { return entry.page !== page; });
  }

  // Un solo par de listeners globales para todas las secuencias.
  window.addEventListener('scroll', runAll, { passive: true });
  window.addEventListener('resize', runAll);

  onPageInit(initPageSteps);
  onPageDestroy(destroyPageSteps);
})();
