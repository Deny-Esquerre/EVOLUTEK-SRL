// ===== PASARELA DE IMÁGENES =====
// Mejora progresiva sobre una pista con scroll-snap: sin este script la
// galería ya se puede arrastrar; con él aparecen flechas, puntos, teclado y
// avance automático.
// Uso: <div class="gallery" data-gallery> <div class="gallery__track">
//        <article class="gallery__slide"> ... </article> ...
(function () {
  var AVANCE = 6500;   // ms entre diapositivas
  var instancias = [];

  function crear(etiqueta, clase, texto) {
    var el = document.createElement(etiqueta);
    el.className = clase;
    if (texto) el.textContent = texto;
    return el;
  }

  function initGallery(page, root) {
    var track = root.querySelector('.gallery__track');
    if (!track) return;

    var slides = Array.prototype.slice.call(track.querySelectorAll('.gallery__slide'));
    if (slides.length < 2) return;

    var indice = 0;
    var temporizador = null;

    // ---- Controles ----
    var prev = crear('button', 'gallery__nav gallery__nav--prev');
    var next = crear('button', 'gallery__nav gallery__nav--next');
    prev.type = next.type = 'button';
    prev.setAttribute('aria-label', 'Servicio anterior');
    next.setAttribute('aria-label', 'Servicio siguiente');

    var dots = crear('div', 'gallery__dots');
    dots.setAttribute('role', 'tablist');
    dots.setAttribute('aria-label', 'Elegir servicio');

    var puntos = slides.map(function (slide, i) {
      var d = crear('button', 'gallery__dot');
      d.type = 'button';
      d.setAttribute('role', 'tab');
      d.setAttribute('aria-label', 'Servicio ' + (i + 1) + ' de ' + slides.length);
      d.addEventListener('click', function () { irA(i, true); });
      dots.appendChild(d);
      return d;
    });

    root.appendChild(prev);
    root.appendChild(next);
    root.appendChild(dots);

    // La pista pasa a ser alcanzable por teclado una vez hay navegación
    track.tabIndex = 0;
    track.setAttribute('aria-label', 'Servicios. Usa las flechas del teclado para recorrerlos.');

    // ---- Movimiento ----
    function irA(i, manual) {
      indice = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: slides[indice].offsetLeft - slides[0].offsetLeft });
      pintar();
      if (manual) detener();
    }

    function pintar() {
      puntos.forEach(function (d, i) {
        d.setAttribute('aria-current', i === indice ? 'true' : 'false');
      });
      prev.disabled = indice === 0;
      next.disabled = indice === slides.length - 1;
    }

    // El scroll manda: si el visitante arrastra, el índice se recalcula.
    var pendiente = null;
    function alDesplazar() {
      if (pendiente) return;
      pendiente = setTimeout(function () {
        pendiente = null;
        var x = track.scrollLeft + slides[0].offsetLeft;
        var cerca = 0, dist = Infinity;
        slides.forEach(function (s, i) {
          var d = Math.abs(s.offsetLeft - x);
          if (d < dist) { dist = d; cerca = i; }
        });
        if (cerca !== indice) { indice = cerca; pintar(); }
      }, 120);
    }

    prev.addEventListener('click', function () { irA(indice - 1, true); });
    next.addEventListener('click', function () { irA(indice + 1, true); });
    track.addEventListener('scroll', alDesplazar, { passive: true });

    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); irA(indice + 1, true); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); irA(indice - 1, true); }
    });

    // ---- Avance automático ----
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function arrancar() {
      if (reduce || temporizador) return;
      temporizador = setInterval(function () {
        irA(indice >= slides.length - 1 ? 0 : indice + 1, false);
      }, AVANCE);
    }

    function detener() {
      if (temporizador) { clearInterval(temporizador); temporizador = null; }
    }

    // Se pausa mientras se mira o se usa, y no corre si la pestaña está oculta.
    root.addEventListener('mouseenter', detener);
    root.addEventListener('mouseleave', arrancar);
    root.addEventListener('focusin', detener);
    root.addEventListener('touchstart', detener, { passive: true });

    function alCambiarVisibilidad() {
      if (document.hidden) detener(); else arrancar();
    }
    document.addEventListener('visibilitychange', alCambiarVisibilidad);

    pintar();
    arrancar();

    instancias.push({
      page: page,
      destruir: function () {
        detener();
        if (pendiente) clearTimeout(pendiente);
        document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      }
    });
  }

  function initPageGallery(page) {
    page.querySelectorAll('[data-gallery]').forEach(function (root) {
      initGallery(page, root);
    });
  }

  function destroyPageGallery(page) {
    instancias = instancias.filter(function (it) {
      if (it.page !== page) return true;
      it.destruir();
      return false;
    });
  }

  onPageInit(initPageGallery);
  onPageDestroy(destroyPageGallery);
})();
