// ===== PASARELA DE FOTOS =====
// Tira horizontal con scroll-snap: el desplazamiento y el gesto de deslizar los
// pone el navegador. Aquí solo se añaden flechas, puntos y avance automático
// cada TURNO ms mientras la pasarela está a la vista y nadie la toca. Con
// prefers-reduced-motion no avanza sola.
(function () {
  const TURNO = 5000;
  const instancias = new WeakMap();

  function initPasarela(root) {
    if (instancias.has(root)) return;
    const quitar = [];

    root.querySelectorAll('[data-pasarela]').forEach(function (caja) {
      const pista = caja.querySelector('.fz-pasarela__pista');
      const fotos = Array.prototype.slice.call(pista.children);
      const puntosCaja = caja.querySelector('.fz-pasarela__puntos');
      const prev = caja.querySelector('.fz-pasarela__flecha--prev');
      const next = caja.querySelector('.fz-pasarela__flecha--next');
      const quieto = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (fotos.length < 2) return;

      let actual = 0;
      let timer = null;
      let visible = false;
      let encima = false;

      const puntos = fotos.map(function (_, i) {
        const b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('aria-label', t('Ver foto ', 'Show photo ') + (i + 1) + t(' de ', ' of ') + fotos.length);
        puntosCaja.appendChild(b);
        return b;
      });

      function marcar(i) {
        actual = i;
        puntos.forEach(function (p, j) { p.setAttribute('aria-current', j === i ? 'true' : 'false'); });
      }

      function ir(i) {
        const destino = (i + fotos.length) % fotos.length;
        pista.scrollTo({ left: destino * pista.clientWidth });
        marcar(destino);
      }

      function programar() {
        clearInterval(timer);
        timer = null;
        if (!quieto && visible && !encima) timer = setInterval(function () { ir(actual + 1); }, TURNO);
      }

      // Al deslizar con el dedo o la rueda, el punto sigue a la foto visible.
      function alDesplazar() {
        const i = Math.round(pista.scrollLeft / pista.clientWidth);
        if (i !== actual && i >= 0 && i < fotos.length) marcar(i);
      }

      function alPulsarPunto(e) {
        const i = puntos.indexOf(e.target);
        if (i >= 0) { ir(i); programar(); }
      }
      function alPrev() { ir(actual - 1); programar(); }
      function alNext() { ir(actual + 1); programar(); }
      function entra() { encima = true; programar(); }
      function sale() { encima = false; programar(); }

      const observador = new IntersectionObserver(function (entradas) {
        visible = entradas[0].isIntersecting;
        programar();
      }, { threshold: 0.35 });

      caja.classList.add('is-js');
      marcar(0);
      pista.addEventListener('scroll', alDesplazar, { passive: true });
      puntosCaja.addEventListener('click', alPulsarPunto);
      prev.addEventListener('click', alPrev);
      next.addEventListener('click', alNext);
      caja.addEventListener('mouseenter', entra);
      caja.addEventListener('mouseleave', sale);
      caja.addEventListener('focusin', entra);
      caja.addEventListener('focusout', sale);
      observador.observe(caja);

      quitar.push(function () {
        clearInterval(timer);
        observador.disconnect();
        pista.removeEventListener('scroll', alDesplazar);
        puntosCaja.removeEventListener('click', alPulsarPunto);
        prev.removeEventListener('click', alPrev);
        next.removeEventListener('click', alNext);
        caja.removeEventListener('mouseenter', entra);
        caja.removeEventListener('mouseleave', sale);
        caja.removeEventListener('focusin', entra);
        caja.removeEventListener('focusout', sale);
        puntosCaja.textContent = '';
        caja.classList.remove('is-js');
      });
    });

    instancias.set(root, quitar);
  }

  function destroyPasarela(root) {
    const quitar = instancias.get(root);
    if (quitar) { quitar.forEach(function (fn) { fn(); }); instancias.delete(root); }
  }

  onPageInit(initPasarela);
  onPageDestroy(destroyPasarela);
})();
