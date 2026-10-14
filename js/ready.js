// Ejecuta fn cuando el DOM está listo; si ya lo está (scripts cargados tras la
// inyección de parciales), la ejecuta de inmediato.
function onReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

// ===== CICLO DE VIDA DE UNA PÁGINA =====
// Cada ruta sirve solo su propia página; el router (js/nav.js) trae las demás
// bajo demanda. Los módulos se enganchan aquí en vez de inicializarse una sola
// vez sobre todo el documento, de modo que una página inyectada arranque con
// sus animaciones y una página retirada libere sus timers y observers.
var PAGE_INIT = [];
var PAGE_DESTROY = [];

function onPageInit(fn) { PAGE_INIT.push(fn); }
function onPageDestroy(fn) { PAGE_DESTROY.push(fn); }

function initPage(root) {
  if (!root) return;
  PAGE_INIT.forEach(function (fn) {
    try { fn(root); } catch (e) { console.error('[initPage]', e); }
  });
}

function destroyPage(root) {
  if (!root) return;
  PAGE_DESTROY.forEach(function (fn) {
    try { fn(root); } catch (e) { console.error('[destroyPage]', e); }
  });
}
