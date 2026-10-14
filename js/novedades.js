// ===== NOVEDADES: ALTO DE LOS INCRUSTADOS Y FILTRO POR CATEGORÍA =====
// Dos cosas que el CSS no puede resolver solo:
//
// 1. El alto de cada iframe. Es contenido de otro dominio: no podemos medirlo
//    ni él nos avisa de cuánto ocupa, así que si se deja el alto fijo que da
//    LinkedIn (medido a 504px de ancho) sobra hueco en blanco cuando la
//    columna es más estrecha. Un incrustado se compone de una parte fija
//    —cabecera, texto plegado y barra de acciones— y de la imagen o el vídeo,
//    que escala con el ancho. De ahí sale el alto a cualquier ancho:
//        alto = CROMO + (alto a 504 - CROMO) * ancho / 504
//    data-h504 lleva el valor de LinkedIn de cada publicación.
//
// 2. El filtro. Oculta con el atributo hidden lo que no toca y mantiene
//    aria-selected y los contadores al día.
(function () {
  var CROMO = 212;            // parte del incrustado que no escala, en px
  var ANCHO_BASE = 504;       // ancho al que LinkedIn mide sus alturas

  // Holgura sobre el alto calculado. Las cifras de LinkedIn se quedan cortas y
  // el incrustado acaba sacando su propia barra de desplazamiento; con esto el
  // contenido entra entero. Es el unico numero que hay que mover si alguna
  // publicacion vuelve a salir con barra (subirlo) o con hueco (bajarlo).
  var MARGEN = 72;
  var instancias = [];

  // ---------- 1. Alto ----------
  function ajustarAlto(iframe) {
    var h504 = parseInt(iframe.getAttribute('data-h504'), 10);
    if (!h504) return;
    var ancho = iframe.getBoundingClientRect().width;
    if (!ancho) return;                       // aún sin layout (página oculta)
    var alto = Math.round(CROMO + (h504 - CROMO) * ancho / ANCHO_BASE) + MARGEN;
    iframe.style.height = alto + 'px';
  }

  function ajustarTodos(page) {
    page.querySelectorAll('iframe[data-h504]').forEach(ajustarAlto);
  }

  // ---------- 2. Filtro ----------
  function initFiltro(page) {
    var tabs = Array.prototype.slice.call(page.querySelectorAll('.novedades-tab'));
    var mosaico = page.querySelector('.novedades-mosaico');
    if (!tabs.length || !mosaico) return null;

    var tarjetas = Array.prototype.slice.call(mosaico.querySelectorAll('[data-categoria]'));

    // Los contadores se calculan aquí: así no hay que tocarlos al añadir una
    // publicación, basta con ponerle su data-categoria.
    tabs.forEach(function (tab) {
      var filtro = tab.dataset.filtro;
      var n = filtro === 'todo'
        ? tarjetas.length
        : tarjetas.filter(function (c) { return c.dataset.categoria === filtro; }).length;
      var cont = tab.querySelector('.novedades-tab__n');
      if (cont) cont.textContent = '(' + n + ')';
    });

    function activar(tab, mover) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });

      var filtro = tab.dataset.filtro;
      tarjetas.forEach(function (c) {
        c.hidden = !(filtro === 'todo' || c.dataset.categoria === filtro);
      });

      mosaico.setAttribute('aria-labelledby', tab.id);
      if (mover) tab.focus();

      // Al cambiar lo visible cambian los anchos de columna del mosaico
      ajustarTodos(page);
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { activar(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var paso = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!paso) return;
        e.preventDefault();
        activar(tabs[(i + paso + tabs.length) % tabs.length], true);
      });
    });

    return activar;
  }

  // ---------- Ciclo de vida ----------
  function initNovedades(page) {
    if (!page.querySelector('.novedades-mosaico')) return;

    initFiltro(page);
    ajustarTodos(page);

    var pendiente = null;
    function alRedimensionar() {
      if (pendiente) return;
      pendiente = setTimeout(function () {
        pendiente = null;
        ajustarTodos(page);
      }, 120);
    }

    window.addEventListener('resize', alRedimensionar);

    // Las fuentes web cambian el ancho de las columnas al terminar de cargar
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ajustarTodos(page); });
    }

    instancias.push({
      page: page,
      destruir: function () {
        window.removeEventListener('resize', alRedimensionar);
        if (pendiente) clearTimeout(pendiente);
      }
    });
  }

  function destroyNovedades(page) {
    instancias = instancias.filter(function (it) {
      if (it.page !== page) return true;
      it.destruir();
      return false;
    });
  }

  onPageInit(initNovedades);
  onPageDestroy(destroyNovedades);
})();
