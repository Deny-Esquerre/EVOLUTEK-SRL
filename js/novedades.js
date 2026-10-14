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
//    El iframe recibe bastante más alto del que se ve, y el marco se queda
//    con el alto del contenido: lo que sobra —la franja en blanco de LinkedIn
//    y el seguro contra su barra de desplazamiento— cae fuera del marco y lo
//    recorta su overflow:hidden. Así nunca hay ni barra ni hueco, y da igual
//    lo estrecha que sea la columna.
//
//    CROMO está medido, no supuesto: con 212px sobraba una franja blanca de
//    92px bajo cada publicación a 432 de ancho. Despejando con esa medida da
//    72, que además reproduce el otro dato conocido —a 504 el alto justo es
//    el que declara LinkedIn, por eso ahí salía barra sin holgura alguna—.
//    Casi todo el alto de un incrustado es la imagen; la cabecera, el texto
//    plegado y la barra de acciones ocupan mucho menos de lo que parecía.
//
// 2. El filtro. Oculta con el atributo hidden lo que no toca y mantiene
//    aria-selected y los contadores al día.
(function () {
  var CROMO = 72;             // parte del incrustado que no escala, en px
  var ANCHO_BASE = 504;       // ancho al que LinkedIn mide sus alturas

  // Franja en blanco con la que LinkedIn termina su página, medida sobre una
  // captura. Forma parte de su documento: acortar el iframe no la quita, solo
  // provoca la barra de desplazamiento. Se tapa desde fuera.
  var RECORTE = 92;

  // Sobrante que se le da al iframe por encima de lo que se ve. Queda fuera
  // del marco, así que no cuesta nada: es el seguro de que LinkedIn no saque
  // barra aunque su contenido crezca más de lo previsto.
  var HOLGURA = 120;

  // En columnas estrechas el texto de la publicación ocupa más líneas de las
  // que tiene a 504, y eso baja el contenido. Por debajo de 400px se le suma
  // un cuarto de píxel por cada uno que falte.
  var REFLOW_DESDE = 400;
  var REFLOW_RATIO = 0.25;
  var instancias = [];

  // ---------- 1. Alto ----------
  function ajustarAlto(iframe) {
    var h504 = parseInt(iframe.getAttribute('data-h504'), 10);
    if (!h504) return;
    var ancho = iframe.getBoundingClientRect().width;
    if (!ancho) return;                       // aún sin layout (página oculta)
    // Lo que se ve: el contenido de la publicación, sin la franja del final.
    var visible = Math.round(CROMO + (h504 - CROMO) * ancho / ANCHO_BASE)
      + Math.round(Math.max(0, REFLOW_DESDE - ancho) * REFLOW_RATIO);

    // Al iframe se le da bastante más, y lo que sobra queda fuera del marco.
    iframe.style.height = (visible + RECORTE + HOLGURA) + 'px';

    var marco = iframe.parentNode;
    if (marco && marco.classList && marco.classList.contains('embed-card')) {
      marco.style.height = Math.max(160, visible) + 'px';
    }
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
    // Los incrustados no viven solo en la página de novedades: el inicio
    // lleva dos. Basta con que haya alguno para que haya algo que ajustar.
    if (!page.querySelector('iframe[data-h504]')) return;

    initFiltro(page);          // devuelve sin hacer nada si no hay pestañas
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
