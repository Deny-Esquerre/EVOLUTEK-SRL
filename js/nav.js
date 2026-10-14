// ===== RUTAS (id de página -> URL) =====
// Cada entrada se corresponde con una carpeta real generada por build.js, de
// modo que la URL funciona igual con o sin JavaScript.
const PAGE_ROUTES = {
  inicio: '/',
  nosotros: '/nosotros',
  productos: '/proyectos',
  canary: '/proyectos/canary',
  highbyte: '/proyectos/highbyte',
  kepware: '/proyectos/kepware',
  ignition: '/proyectos/ignition',
  n3uron: '/proyectos/n3uron',
  tatsoft: '/proyectos/tatsoft',
  flow: '/proyectos/flow',
  servicios: '/servicios',
  clientes: '/clientes',
  contacto: '/contacto'
};

const PAGE_TITLES = {
  inicio: 'EVOLUTEK — Tecnología e Industria 4.0',
  nosotros: 'Nosotros — EVOLUTEK',
  productos: 'Productos — EVOLUTEK',
  canary: 'Canary Labs — Historización de datos | EVOLUTEK',
  highbyte: 'HighByte Intelligence Hub — DataOps Industrial | EVOLUTEK',
  kepware: 'Kepware — Conectividad Industrial | EVOLUTEK',
  ignition: 'Ignition — SCADA, HMI y MES | EVOLUTEK',
  n3uron: 'N3uron — Edge & MQTT | EVOLUTEK',
  tatsoft: 'Tatsoft (FactoryStudio) — SCADA, HMI y OEE | EVOLUTEK',
  flow: 'Flow Software — Integración de datos | EVOLUTEK',
  servicios: 'Servicios — EVOLUTEK',
  clientes: 'Clientes — EVOLUTEK',
  contacto: 'Contacto — EVOLUTEK'
};

// ruta -> id de página
const ROUTES = {};
Object.keys(PAGE_ROUTES).forEach(function (id) { ROUTES[PAGE_ROUTES[id]] = id; });
ROUTES['/inicio'] = 'inicio';
ROUTES['/index.html'] = 'inicio';

function normalizePath(p) {
  p = (p || '/').replace(/index\.html$/i, '');
  if (p.length > 1) p = p.replace(/\/+$/, '');
  return p || '/';
}

function pageFromPath(p) {
  return ROUTES[normalizePath(p)] || 'inicio';
}

function pageRoot() {
  return document.getElementById('pageRoot') || document.body;
}

// ===== CARGA DE PÁGINAS BAJO DEMANDA =====
// Cada ruta entrega únicamente su propia página. Al navegar sin recargar hay
// que traer el HTML de la ruta destino y extraer su <div class="page">.
const pageCache = {};

function fetchPage(pageId) {
  if (pageCache[pageId]) return pageCache[pageId];

  // En desarrollo (js/includes.js) las páginas son parciales sueltos; en
  // producción cada ruta es un HTML completo que contiene solo su página.
  const dev = window.EVOLUTEK_DEV === true;
  const url = dev ? 'partials/page-' + pageId + '.html' : PAGE_ROUTES[pageId];
  if (!url) return Promise.reject(new Error('Ruta desconocida: ' + pageId));

  pageCache[pageId] = fetch(url, { credentials: 'same-origin' })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status + ' en ' + url);
      return res.text();
    })
    .then(function (html) {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const page = doc.getElementById('page-' + pageId);
      if (!page) throw new Error('La respuesta de ' + url + ' no contiene #page-' + pageId);
      return page;
    })
    .catch(function (err) {
      delete pageCache[pageId]; // permite reintentar en la siguiente navegación
      throw err;
    });

  return pageCache[pageId];
}

// ===== INTERCAMBIO DE PÁGINA =====
function activatePage(target, doScroll) {
  const root = pageRoot();

  // Retira las demás páginas y libera sus timers/observers.
  root.querySelectorAll('.page').forEach(function (p) {
    if (p === target) return;
    destroyPage(p);
    p.remove();
  });

  const firstPaint = target.classList.contains('visible');
  target.classList.add('active');

  if (!firstPaint) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { target.classList.add('visible'); });
    });
  }

  // Reanuda los vídeos de la página mostrada (autoplay silenciado).
  target.querySelectorAll('video').forEach(function (v) {
    const p = v.play();
    if (p && p.catch) p.catch(function () {});
  });

  if (doScroll) window.scrollTo({ top: 0, behavior: 'smooth' });

  initPage(target);

  setTimeout(function () {
    updateScrollProgress();
    if (window.updateStepsSequence) window.updateStepsSequence();
  }, 350);
}

function markActiveLinks(pageId) {
  document.querySelectorAll('.nav-links a[data-page]').forEach(function (a) {
    const on = a.dataset.page === pageId;
    a.classList.toggle('active', on);
    if (on) { a.setAttribute('aria-current', 'page'); }
    else { a.removeAttribute('aria-current'); }
  });
}

// Muestra una página. Devuelve una promesa que falla si no se pudo traer.
function showPage(pageId, doScroll) {
  markActiveLinks(pageId);
  if (PAGE_TITLES[pageId]) document.title = PAGE_TITLES[pageId];

  const existing = document.getElementById('page-' + pageId);
  if (existing) {
    activatePage(existing, doScroll);
    return Promise.resolve();
  }

  document.body.classList.add('is-loading-page');
  return fetchPage(pageId)
    .then(function (page) {
      const copy = document.importNode(page, true);
      copy.classList.remove('active', 'visible');
      pageRoot().appendChild(copy);
      activatePage(copy, doScroll);
    })
    .finally(function () {
      document.body.classList.remove('is-loading-page');
    });
}

function closeMobileMenu() {
  const links = document.getElementById('navLinks');
  const burger = document.getElementById('hamburger');
  const overlay = document.getElementById('navOverlay');
  if (links) links.classList.remove('open');
  if (burger) { burger.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
  if (overlay) { overlay.classList.remove('open'); overlay.hidden = true; }
  document.querySelectorAll('.dropdown.open').forEach(function (d) { d.classList.remove('open'); });
}

// Navegación por id de página. Si la carga falla, deja que el navegador haga
// una visita normal a la URL en vez de dejar al usuario en una página muerta.
function navigateTo(pageId) {
  closeMobileMenu();

  const path = PAGE_ROUTES[pageId];
  if (path && normalizePath(location.pathname) !== normalizePath(path)) {
    history.pushState({ page: pageId }, '', path);
  }

  showPage(pageId, true).catch(function (err) {
    console.error('[nav]', err);
    if (path) location.assign(path);
  });
}

// ===== INTERCEPCIÓN DE ENLACES =====
// Los enlaces son <a href> reales: rastreables, navegables con teclado y
// abribles en pestaña nueva. Solo interceptamos el clic simple para evitar la
// recarga completa.
function isPlainClick(e) {
  return !e.defaultPrevented && e.button === 0 &&
    !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

document.addEventListener('click', function (e) {
  const a = e.target.closest ? e.target.closest('a') : null;
  if (!a) return;

  // Enlaces de marcador de posición: no deben mover la URL.
  if (a.getAttribute('href') === '#') { e.preventDefault(); return; }

  const pageId = a.dataset.page;
  if (!pageId || !PAGE_ROUTES[pageId]) return;
  if (!isPlainClick(e)) return;
  if (a.target && a.target !== '' && a.target !== '_self') return;
  if (a.hasAttribute('download')) return;

  // En móvil, el enlace padre del desplegable abre el submenú en vez de navegar.
  const parent = a.parentElement;
  if (parent && parent.classList.contains('dropdown') && window.innerWidth <= 900) {
    e.preventDefault();
    parent.classList.toggle('open');
    return;
  }

  e.preventDefault();
  navigateTo(pageId);
});

window.addEventListener('popstate', function () {
  const pageId = pageFromPath(location.pathname);
  showPage(pageId, true).catch(function () { location.reload(); });
});

// ===== MENÚ MÓVIL =====
function toggleMobile() {
  const links = document.getElementById('navLinks');
  const burger = document.getElementById('hamburger');
  const overlay = document.getElementById('navOverlay');
  if (!links || !burger) return;

  const open = !links.classList.contains('open');
  links.classList.toggle('open', open);
  burger.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (overlay) { overlay.classList.toggle('open', open); overlay.hidden = !open; }
}

// ===== NAVBAR SCROLL =====
function updateScrollProgress() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  navbar.classList.toggle('scrolled', window.scrollY > 20);

  const doc = document.documentElement;
  const max = doc.scrollHeight - doc.clientHeight;
  const progress = max > 0 ? (window.scrollY / max) * 100 : 0;

  const bar = document.getElementById('navbarProgress');
  if (bar) bar.style.width = progress + '%';
}

window.addEventListener('scroll', updateScrollProgress, { passive: true });
window.addEventListener('resize', updateScrollProgress);

// ===== ARRANQUE =====
// Lo dispara js/boot.js, que se carga el último: así todos los módulos ya han
// registrado sus onPageInit cuando se inicializa la primera página.
function startRouter() {
  const burger = document.getElementById('hamburger');
  const overlay = document.getElementById('navOverlay');
  if (burger) burger.addEventListener('click', toggleMobile);
  if (overlay) overlay.addEventListener('click', toggleMobile);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMobileMenu();
  });

  // La página de la ruta ya viene en el HTML; solo hay que inicializarla.
  let pageId = pageFromPath(location.pathname);
  const current = document.getElementById('page-' + pageId) ||
    pageRoot().querySelector('.page');

  // En una ruta desconocida pageFromPath devuelve 'inicio', pero el HTML que
  // ha servido el hosting es el de la página de error: manda la que está.
  if (current && current.id) pageId = current.id.replace(/^page-/, '');
  markActiveLinks(pageId);
  if (current) {
    activatePage(current, false);
  } else {
    showPage(pageId, false).catch(function (err) { console.error('[nav]', err); });
  }

  updateScrollProgress();
}
