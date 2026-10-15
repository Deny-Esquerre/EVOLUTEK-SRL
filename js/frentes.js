// ===== SERVICIOS: SEIS FRENTES DE TRABAJO =====
// Pestañas con un panel por frente. Avanzan solas cada TURNO ms mientras la
// seccion esta a la vista y nadie la toca; en cuanto el visitante elige una,
// el avance se detiene para no quitarle lo que esta leyendo. Con
// prefers-reduced-motion no avanzan nunca. Sin JS se ven los seis paneles.
(function () {
  const TURNO = 6000;
  const instancias = new WeakMap();

  function initFrentes(root) {
    const cuerpo = root.querySelector('[data-frentes]');
    // El router reinicia la pagina si se vuelve a pulsar la que ya esta
    // abierta: sin esta guarda se duplicarian el temporizador y los listeners.
    if (!cuerpo || instancias.has(root)) return;
    const seccion = cuerpo.closest('.sv-frentes');
    const tabs = Array.prototype.slice.call(cuerpo.querySelectorAll('[role="tab"]'));
    const paneles = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    const quieto = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let actual = 0;
    let timer = null;
    let visible = false;
    let encima = false;
    let detenido = quieto;

    function elegir(i, foco) {
      actual = (i + tabs.length) % tabs.length;
      tabs.forEach(function (t, j) {
        const on = j === actual;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        paneles[j].hidden = !on;
      });
      if (foco) tabs[actual].focus();
    }

    function puedeAvanzar() { return !detenido && visible && !encima; }

    function programar() {
      clearInterval(timer);
      timer = null;
      seccion.classList.toggle('is-auto', puedeAvanzar());
      if (puedeAvanzar()) timer = setInterval(function () { elegir(actual + 1, false); }, TURNO);
    }

    function detener() { detenido = true; programar(); }

    function alPulsar(e) {
      const tab = e.target.closest('[role="tab"]');
      if (!tab) return;
      elegir(tabs.indexOf(tab), false);
      detener();
    }

    function alTeclear(e) {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      let destino = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') destino = i + 1;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') destino = i - 1;
      else if (e.key === 'Home') destino = 0;
      else if (e.key === 'End') destino = tabs.length - 1;
      if (destino === null) return;
      e.preventDefault();
      elegir(destino, true);
      detener();
    }

    function entra() { encima = true; programar(); }
    function sale() { encima = false; programar(); }

    const observador = new IntersectionObserver(function (entradas) {
      visible = entradas[0].isIntersecting;
      programar();
    }, { threshold: 0.35 });

    seccion.style.setProperty('--sv-turno', TURNO + 'ms');
    seccion.classList.add('is-js');
    elegir(0, false);
    cuerpo.addEventListener('click', alPulsar);
    cuerpo.addEventListener('keydown', alTeclear);
    cuerpo.addEventListener('mouseenter', entra);
    cuerpo.addEventListener('mouseleave', sale);
    cuerpo.addEventListener('focusin', entra);
    cuerpo.addEventListener('focusout', sale);
    observador.observe(seccion);

    instancias.set(root, function () {
      clearInterval(timer);
      observador.disconnect();
      cuerpo.removeEventListener('click', alPulsar);
      cuerpo.removeEventListener('keydown', alTeclear);
      cuerpo.removeEventListener('mouseenter', entra);
      cuerpo.removeEventListener('mouseleave', sale);
      cuerpo.removeEventListener('focusin', entra);
      cuerpo.removeEventListener('focusout', sale);
    });
  }

  function destroyFrentes(root) {
    const quitar = instancias.get(root);
    if (quitar) { quitar(); instancias.delete(root); }
  }

  onPageInit(initFrentes);
  onPageDestroy(destroyFrentes);
})();
