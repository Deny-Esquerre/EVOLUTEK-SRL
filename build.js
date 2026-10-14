#!/usr/bin/env node
/*
 * build.js — ensambla el sitio de producción en dist/.
 *
 *   - Monta un shell con los parciales compartidos (navbar, footer, modales).
 *   - Genera un HTML por ruta que contiene SOLO la página de esa ruta, ya
 *     marcada como .active.visible para que se vea sin depender del JS.
 *   - Concatena y minifica css/*.css  -> dist/css/styles.min.css
 *   - Concatena y minifica js/*.js    -> dist/js/app.min.js
 *   - Copia a dist/ SOLO los assets locales referenciados (logos, svg, img, ...).
 *
 * Sin dependencias. Uso:  node build.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');

const CSS_ORDER = [
  'base.css', 'navbar.css', 'hero.css', 'page-hero.css', 'sections.css',
  'estrategia.css', 'about.css', 'partners.css', 'logos.css', 'modal.css',
  'servicios.css', 'gallery.css',
  'product.css', 'product-edge.css', 'product-scada.css', 'product-dataops.css',
  'product-snake.css', 'product-stair.css',
  'cta.css', 'error.css', 'footer.css', 'animations.css', 'responsive.css'
];

// ready.js primero (define onReady y el ciclo de vida de página) y boot.js el
// último (arranca el router cuando todos los módulos ya se han registrado).
// includes.js NO va al bundle de producción.
const JS_ORDER = [
  'ready.js', 'nav.js', 'reveal.js', 'strategy-rail.js', 'hero.js',
  'steps-sequence.js', 'products-data.js', 'modal.js', 'tooltip.js', 'gallery.js', 'boot.js'
];

// Presentes en todas las rutas. Las páginas (partials/page-*.html) NO van en el
// shell: cada ruta recibe únicamente la suya.
const SHARED_PARTIALS = ['navbar', 'footer', 'tooltip', 'modal', 'privacy-modal'];

// Rutas estáticas: cada una genera <dir>/index.html con su <title> y meta
// description. La URL se resuelve en runtime (js/nav.js) contra <base href="/">.
const ROUTES = [
  {
    dir: '', page: 'inicio',
    title: 'EVOLUTEK — Tecnología e Industria 4.0',
    description: 'Evolutek impulsa la transformación digital industrial: Industria 4.0, automatización, IoT y analítica avanzada. Integramos tecnología y tradición para modernizar la industria.'
  },
  {
    dir: 'inicio', page: 'inicio',
    title: 'EVOLUTEK — Tecnología e Industria 4.0',
    description: 'Evolutek impulsa la transformación digital industrial: Industria 4.0, automatización, IoT y analítica avanzada. Integramos tecnología y tradición para modernizar la industria.'
  },
  {
    dir: 'nosotros', page: 'nosotros',
    title: 'Nosotros — EVOLUTEK',
    description: 'Conoce a Evolutek: ingeniería y tecnología para la Industria 4.0. Experiencia integrando automatización, IoT y analítica para modernizar la industria.'
  },
  {
    dir: 'proyectos', page: 'productos',
    title: 'Productos — EVOLUTEK',
    description: 'Portafolio de productos Evolutek: Canary Labs, HighByte, Kepware, Ignition, N3uron, Tatsoft y Flow Software para la Industria 4.0.'
  },
  {
    dir: 'proyectos/canary', page: 'canary',
    title: 'Canary Labs — Historización de datos | EVOLUTEK',
    description: 'Canary Labs: plataforma de historización y análisis de datos de proceso. Almacena y visualiza años de información operativa a alta velocidad.'
  },
  {
    dir: 'proyectos/highbyte', page: 'highbyte',
    title: 'HighByte Intelligence Hub — DataOps Industrial | EVOLUTEK',
    description: 'HighByte Intelligence Hub: orquestación de datos industriales para modelar, contextualizar y entregar datos de planta listos para analítica (UNS).'
  },
  {
    dir: 'proyectos/kepware', page: 'kepware',
    title: 'Kepware — Conectividad Industrial | EVOLUTEK',
    description: 'Kepware: servidor de comunicaciones industriales con OPC UA/DA, Modbus y más de 150 protocolos para conectar PLCs y dispositivos.'
  },
  {
    dir: 'proyectos/ignition', page: 'ignition',
    title: 'Ignition — SCADA, HMI y MES | EVOLUTEK',
    description: 'Ignition: plataforma SCADA, HMI y MES sin costo por tags. Supervisión, control y visualización en tiempo real desde el navegador.'
  },
  {
    dir: 'proyectos/n3uron', page: 'n3uron',
    title: 'N3uron — Edge & MQTT | EVOLUTEK',
    description: 'N3uron: plataforma Edge e IIoT con soporte nativo de MQTT, OPC UA y REST para recolectar y enviar datos de campo a la nube de forma segura.'
  },
  {
    dir: 'proyectos/tatsoft', page: 'tatsoft',
    title: 'Tatsoft (FactoryStudio) — SCADA, HMI y OEE | EVOLUTEK',
    description: 'Tatsoft (FactoryStudio): entorno SCADA/HMI con módulos de eficiencia (OEE) y gestión de producción para monitorear el rendimiento en tiempo real.'
  },
  {
    dir: 'proyectos/flow', page: 'flow',
    title: 'Flow Software — Integración de datos | EVOLUTEK',
    description: 'Flow Software: integración y movimiento de datos industriales. Conecta sistemas, bases de datos y plataformas en tiempo real.'
  },
  {
    dir: 'servicios', page: 'servicios',
    title: 'Servicios — EVOLUTEK',
    description: 'Servicios de Evolutek: consultoría, integración de sistemas, automatización, IoT y analítica avanzada para la Industria 4.0.'
  },
  {
    dir: 'clientes', page: 'clientes',
    title: 'Clientes — EVOLUTEK',
    description: 'Clientes de Evolutek: empresas industriales que confían en nosotros para su transformación digital e Industria 4.0.'
  },
  {
    dir: 'contacto', page: 'contacto',
    title: 'Contacto — EVOLUTEK',
    description: 'Contáctanos: hablemos de tu proyecto de transformación digital industrial, automatización, IoT y analítica avanzada.'
  }
];

const read = p => fs.readFileSync(p, 'utf8');
const repo = p => path.join(ROOT, p);
const dest = p => path.join(DIST, p);
const kb = n => (n / 1024).toFixed(1) + ' KB';

/* ---------- minificadores (sin dependencias) ---------- */

function stripCssComments(src) {
  let out = '', i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '*') {
      const e = src.indexOf('*/', i + 2);
      i = e < 0 ? n : e + 2;
      continue;
    }
    if (c === '"' || c === "'") {
      const q = c;
      out += c; i++;
      while (i < n) {
        const ch = src[i];
        out += ch; i++;
        if (ch === '\\') { if (i < n) { out += src[i]; i++; } continue; }
        if (ch === q) break;
      }
      continue;
    }
    out += c; i++;
  }
  return out;
}

// Colapsa espacios y quita los sobrantes alrededor de { } ; , (respeta strings).
function minifyCss(src) {
  src = stripCssComments(src);
  let out = '', i = 0, space = false;
  const n = src.length;
  const isWs = ch => ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r' || ch === '\f';
  const noBeforeSet = new Set(['{', '}', ',', ';', ')', ']']);
  const noAfterSet = new Set(['{', '}', ',', ';', '(', '[']);
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; space = true; continue; }
    if (c === '"' || c === "'") {
      if (space && out && !noBeforeSet.has(c)) out += ' ';
      space = false;
      const q = c; out += c; i++;
      while (i < n) {
        const ch = src[i]; out += ch; i++;
        if (ch === '\\') { if (i < n) { out += src[i]; i++; } continue; }
        if (ch === q) break;
      }
      continue;
    }
    if (isWs(c)) { space = true; i++; continue; }
    if (space) {
      const prev = out[out.length - 1];
      if (out && !noBeforeSet.has(c) && !noAfterSet.has(prev)) out += ' ';
      space = false;
    }
    out += c; i++;
  }
  out = out.replace(/;}/g, '}').trim();
  return out;
}

// Conservador y seguro para ASI: quita comentarios de línea completa y líneas
// vacías; no toca strings, regex ni el resto.
function minifyJs(src) {
  return src
    .replace(/^[ \t]*\/\/.*$/gm, '')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{2,}/g, '\n')
    .replace(/^\s*\n/gm, '')
    .trim();
}

/* ---------- 1. ensamblar el shell ---------- */

const PAGE_SLOT = '@@PAGE@@';

let shell = read(repo('index.html'));

// parciales compartidos -> contenido
for (const name of SHARED_PARTIALS) {
  const marker = new RegExp('[ \t]*<div data-include="partials/' + name + '\.html"></div>');
  if (!marker.test(shell)) throw new Error('No se encontró el placeholder: ' + name);
  shell = shell.replace(marker, read(repo(`partials/${name}.html`)).replace(/\s+$/, ''));
}

// Los marcadores de página se colapsan en un único hueco que se rellena por ruta.
let slotDone = false;
shell = shell.replace(/[ \t]*<div data-include="partials\/page-[a-z0-9-]+\.html"><\/div>\r?\n?/g, () => {
  if (slotDone) return '';
  slotDone = true;
  return '    ' + PAGE_SLOT + '\n';
});
if (!slotDone) throw new Error('No se encontró ningún placeholder de página.');

// 23 <link> css -> 1
shell = shell.replace(/(\s*<link rel="stylesheet" href="css\/[^"]+">)+/, '\n  <link rel="stylesheet" href="css/styles.min.css">');
// includes.js -> bundle
shell = shell.replace('<script src="js/includes.js"></script>', '<script src="js/app.min.js"></script>');

if (shell.includes('data-include')) throw new Error('Quedaron placeholders sin resolver.');

// Lee la página de una ruta y la marca como visible, de modo que la ruta se
// renderice correctamente aunque el JavaScript no llegue a ejecutarse.
function readPage(name) {
  const src = read(repo(`partials/page-${name}.html`)).replace(/\s+$/, '');
  // Conserva las clases propias de la página (p. ej. product--scada) y solo
  // añade active/visible, para que la ruta se vea sin depender del JS.
  const out = src.replace(/<div class="page([^"]*)"(\s+id="page-[a-z0-9]+")/, function (m, extra, id) {
    const resto = extra.replace(/(?:active|visible)/g, '').replace(/\s+/g, ' ').trim();
    return '<div class="page' + (resto ? ' ' + resto : '') + ' active visible"' + id;
  });
  if (out === src) throw new Error('No se pudo marcar como activa la página: ' + name);
  return out;
}

/* ---------- 2. bundle CSS ---------- */

const cssRaw = CSS_ORDER.map(f => read(repo('css/' + f))).join('\n');
const cssMin = '/* EVOLUTEK — bundle generado por build.js */\n' + minifyCss(cssRaw);

/* ---------- 3. bundle JS ---------- */

const jsRaw = JS_ORDER.map(f => read(repo('js/' + f))).join('\n\n');
const jsMin = '/* EVOLUTEK — bundle generado por build.js */\n' + minifyJs(jsRaw) + '\n';

/* ---------- 4. escribir dist ---------- */

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(dest('css'), { recursive: true });
fs.mkdirSync(dest('js'), { recursive: true });
fs.writeFileSync(dest('css/styles.min.css'), cssMin, 'utf8');
fs.writeFileSync(dest('js/app.min.js'), jsMin, 'utf8');

// Páginas de ruta: una carpeta con index.html por cada entrada de ROUTES, con
// el shell compartido + SOLO la página de esa ruta.
function routeHtml(route, pageHtml) {
  return shell
    .replace(PAGE_SLOT, function () { return pageHtml; })
    .replace(/<title>[\s\S]*?<\/title>/, function () { return '<title>' + route.title + '</title>'; })
    .replace(/(<meta name="description" content=")[^"]*(")/, function (m, a, b) { return a + route.description + b; });
}

// Las páginas se leen una sola vez aunque varias rutas apunten a la misma
// (p. ej. "/" e "/inicio").
const PAGE_CACHE_ALL = {};
const pageOf = name => (PAGE_CACHE_ALL[name] || (PAGE_CACHE_ALL[name] = readPage(name)));

const pages = [];
for (const route of ROUTES) {
  const file = route.dir ? dest(route.dir + '/index.html') : dest('index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, routeHtml(route, pageOf(route.page)), 'utf8');
  pages.push(route.dir ? route.dir + '/index.html' : 'index.html');
}

// Pagina de error: un unico archivo en la raiz de dist/. No es una ruta (no
// lleva carpeta, no esta en el menu y el router no la conoce): es lo que sirve
// el hosting cuando la URL pedida no existe, de modo que el visitante ve una
// pagina del sitio y no la pantalla cruda del servidor. Se escribe aqui, antes
// del rastreo de assets, para que los suyos tambien se copien.
const NOT_FOUND = {
  title: 'Página no encontrada — EVOLUTEK',
  description: 'La página que buscas no existe o ha cambiado de dirección.'
};
fs.writeFileSync(dest('404.html'), routeHtml(NOT_FOUND, pageOf('404')), 'utf8');

/* ---------- 5. copiar assets referenciados ---------- */

const refs = new Set();
const addRefs = (text, re) => { let m; while ((m = re.exec(text))) refs.add(m[1]); };
const reAttr = /(?:src|href|poster|data-src)="([^"]+)"/g;
const reUrl = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;

// Se recorre el shell MÁS todas las páginas: ninguna ruta las contiene a todas,
// pero el router puede pedir cualquiera de ellas en caliente.
addRefs(shell, reAttr);
for (const name of Object.keys(PAGE_CACHE_ALL)) addRefs(PAGE_CACHE_ALL[name], reAttr);
let u; while ((u = reUrl.exec(cssRaw))) refs.add(u[2]);

const isExternal = r => /^(https?:)?\/\//i.test(r) || /^(data:|#|mailto:|tel:|javascript:)/i.test(r);
const copied = [];
for (let r of refs) {
  if (isExternal(r)) continue;
  r = r.split('#')[0].split('?')[0];
  if (!r || r.startsWith('/')) continue;
  if (r === 'css/styles.min.css' || r === 'js/app.min.js') continue;
  const from = path.join(ROOT, r.split('/').join(path.sep));
  if (!fs.existsSync(from) || !fs.statSync(from).isFile()) continue;
  const to = dest(r.split('/').join(path.sep));
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  copied.push(r);
}

/* ---------- reporte ---------- */

const sizeOf = p => fs.statSync(p).size;
console.log('Build OK -> dist/');
console.log(`  index.html          ${kb(sizeOf(dest('index.html')))}`);
console.log(`  rutas generadas:    ${pages.length}`);
for (const p of pages) console.log('    - /' + p.replace(/\/index\.html$/, '').replace(/^index\.html$/, ''));
console.log(`  css/styles.min.css  ${kb(sizeOf(dest('css/styles.min.css')))}  (${kb(cssRaw.length)} -> ${kb(cssMin.length)})`);
console.log(`  js/app.min.js       ${kb(sizeOf(dest('js/app.min.js')))}  (${kb(jsRaw.length)} -> ${kb(jsMin.length)})`);
console.log(`  404.html            ${kb(sizeOf(dest('404.html')))}  (fuera de las rutas)`);
console.log(`  assets copiados:    ${copied.length}`);
for (const c of copied.sort()) console.log('    - ' + c);
