// MODO DESARROLLO — no entra en el bundle de producción.
// Inyecta los parciales compartidos (navbar, footer, modales) y deja el
// contenedor de página vacío: igual que en producción, el router carga la
// página de la ruta y las siguientes bajo demanda.
(function () {
  window.EVOLUTEK_DEV = true;

  // Versión en inglés: todo lo que cuelga de /en usa partials/en/. El lang del
  // <html> lo leen los scripts (js/ready.js) para elegir rutas y textos.
  var EN = /^\/en(\/|$)/.test(location.pathname);
  var DIR = EN ? 'partials/en/' : 'partials/';
  document.documentElement.lang = EN ? 'en' : 'es';

  var SHARED = ['navbar', 'footer', 'tooltip', 'modal', 'privacy-modal'];

  var SCRIPTS = [
    'js/ready.js',
    'js/nav.js',
    'js/reveal.js',
    'js/strategy-rail.js',
    'js/hero.js',
    'js/steps-sequence.js',
    'js/products-data.js',
    'js/modal.js',
    'js/tooltip.js',
    'js/frentes.js',
    'js/pasarela.js',
    'js/novedades.js',
    'js/contacto.js',
    'js/navidad.js',
    'js/fiestas-patrias.js',
    'js/boot.js'
  ];

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('No se pudo cargar ' + src)); };
      document.body.appendChild(s);
    });
  }

  // Los marcadores de página sobran en desarrollo: los retira el router.
  function dropPagePlaceholders() {
    document.querySelectorAll('[data-include^="partials/page-"]').forEach(function (el) {
      el.remove();
    });
  }

  function injectShared() {
    return Promise.all(SHARED.map(function (name) {
      var el = document.querySelector('[data-include="partials/' + name + '.html"]');
      if (!el) return Promise.resolve();
      return fetch(DIR + name + '.html', { cache: 'no-cache' })
        .then(function (res) {
          if (!res.ok) throw new Error('No se pudo cargar ' + DIR + name + '.html (' + res.status + ')');
          return res.text();
        })
        .then(function (html) { el.outerHTML = html; });
    }));
  }

  dropPagePlaceholders();

  injectShared()
    .then(function () {
      return SCRIPTS.reduce(function (chain, src) {
        return chain.then(function () { return loadScript(src); });
      }, Promise.resolve());
    })
    .catch(function (err) { console.error('[includes]', err); });
})();
