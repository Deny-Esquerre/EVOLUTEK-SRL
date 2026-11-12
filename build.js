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
  'servicios.css', 'fiscalizacion.css', 'ia.css', 'transformacion.css', 'novedades.css', 'contacto.css', 'brochure.css', 'nosotros.css',
  'product.css', 'product-edge.css', 'product-scada.css', 'product-dataops.css',
  'product-stair.css', 'product-ketsol.css',
  'cta.css', 'error.css', 'footer.css', 'animations.css', 'navidad.css', 'fiestas-patrias.css', 'responsive.css'
];

// ready.js primero (define onReady y el ciclo de vida de página) y boot.js el
// último (arranca el router cuando todos los módulos ya se han registrado).
// includes.js NO va al bundle de producción.
const JS_ORDER = [
  'ready.js', 'nav.js', 'reveal.js', 'strategy-rail.js', 'hero.js',
  'steps-sequence.js', 'products-data.js', 'modal.js', 'tooltip.js', 'frentes.js', 'pasarela.js', 'novedades.js', 'contacto.js', 'navidad.js', 'fiestas-patrias.js', 'boot.js'
];

// Dominio público. canonical, Open Graph y sitemap.xml necesitan URLs
// absolutas; si el sitio pasa a servirse con www, se cambia solo aquí.
const SITE_URL = 'https://evolutek.pe';
// Código de la etiqueta HTML de Google Search Console.
const GOOGLE_VERIFICATION = 'FBTC5JrkG-g0myvDrDMQs4LpP3re6fYyiWJgM7uANVU';
// Imagen que se ve al compartir un enlace en WhatsApp, LinkedIn, etc.
const OG_IMAGE = 'EVOLUTEK/png/evolutek-logo-color-fondo-4096.png';

// Presentes en todas las rutas. Las páginas (partials/page-*.html) NO van en el
// shell: cada ruta recibe únicamente la suya.
const SHARED_PARTIALS = ['navbar', 'footer', 'tooltip', 'modal', 'privacy-modal'];

// Rutas estáticas: cada una genera <dir>/index.html con su <title> y meta
// description. La URL se resuelve en runtime (js/nav.js) contra <base href="/">.
const ROUTES = [
  {
    dir: '', page: 'inicio',
    title: 'EVOLUTEK — Automatización industrial e Industria 4.0 en Perú',
    description: 'Evolutek impulsa la transformación digital de la industria en Perú: automatización, IIoT, SCADA, historización de datos e IA para modernizar tu planta.'
  },
  {
    // Duplicado de "/": apunta su canonical a la portada y no entra al sitemap.
    dir: 'inicio', page: 'inicio', canonical: '',
    title: 'EVOLUTEK — Automatización industrial e Industria 4.0 en Perú',
    description: 'Evolutek impulsa la transformación digital de la industria en Perú: automatización, IIoT, SCADA, historización de datos e IA para modernizar tu planta.'
  },
  {
    dir: 'nosotros', page: 'nosotros',
    title: 'Nosotros — Integradores de Industria 4.0 en Perú | EVOLUTEK',
    description: 'Conoce a Evolutek: ingeniería y tecnología para la Industria 4.0. Experiencia integrando automatización, IoT y analítica para modernizar la industria.'
  },
  {
    dir: 'proyectos', page: 'productos',
    title: 'Productos — Software industrial SCADA e IIoT | EVOLUTEK',
    description: 'Software industrial que integramos: Canary Labs, Kepware, Ignition, N3uron, Tatsoft, Flow Software y Ketsol para conectar, historizar y analizar tus datos.'
  },
  {
    dir: 'proyectos/canary', page: 'canary',
    title: 'Canary Labs — Historización de datos | EVOLUTEK',
    description: 'Canary Labs: plataforma de historización y análisis de datos de proceso. Almacena y visualiza años de información operativa a alta velocidad.'
  },
  {
    dir: 'proyectos/kepware', page: 'kepware',
    title: 'Kepware — Conectividad Industrial | EVOLUTEK',
    description: 'Kepware: servidor de comunicaciones industriales con OPC UA/DA, Modbus y más de 150 protocolos para conectar PLCs y dispositivos con tus sistemas SCADA.'
  },
  {
    dir: 'proyectos/ignition', page: 'ignition',
    title: 'Ignition — SCADA, HMI y MES | EVOLUTEK',
    description: 'Ignition: plataforma SCADA, HMI y MES sin costo por tags. Supervisión, control y visualización en tiempo real desde cualquier navegador o móvil.'
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
    description: 'Flow Software: integración y movimiento de datos industriales. Conecta sistemas, bases de datos y plataformas en tiempo real y convierte datos en KPIs.'
  },
  {
    dir: 'proyectos/ketsol', page: 'ketsol',
    title: 'Ketsol KMS — Plataforma de manufactura | EVOLUTEK',
    description: 'Ketsol KMS: conecta PLCs, DCS y SCADA con más de 50 protocolos, historiza los datos y los convierte en dashboards, reportes, alertas e IA para la planta.'
  },
  {
    dir: 'servicios', page: 'servicios', crumb: 'Servicios',
    title: 'Servicios de automatización e Industria 4.0 | EVOLUTEK',
    description: 'Servicios de Evolutek: consultoría, integración de sistemas, automatización, IIoT, fiscalización de hidrocarburos y soluciones con IA para la industria.'
  },
  {
    dir: 'servicios/fiscalizacion-hidrocarburos', page: 'fiscalizacion',
    title: 'Fiscalización de Hidrocarburos — Servicios | EVOLUTEK',
    description: 'Fiscalización de hidrocarburos: diseño y mantenimiento preventivo y correctivo de puntos de medición de gas y Unidades LACT, bajo estándares AGA y API.'
  },
  {
    dir: 'servicios/soluciones-ia', page: 'ia',
    title: 'Soluciones Personalizadas con IA — Servicios | EVOLUTEK',
    description: 'IA a medida para la industria: detección de anomalías, predicción de fallas y recomendaciones en lenguaje natural con Claude, Gemini y modelos locales.'
  },
  {
    dir: 'servicios/transformacion-digital', page: 'transformacion',
    title: 'Transformación Digital — Servicios | EVOLUTEK',
    description: 'Transformación digital industrial con Evolutek: de los sistemas existentes a la analítica avanzada e IA, con N3uron, Ignition, Canary, Kepware y Flow Software.'
  },
  {
    dir: 'novedades', page: 'novedades',
    title: 'Novedades — Proyectos y eventos de Industria 4.0 | EVOLUTEK',
    description: 'Novedades de Evolutek: proyectos, eventos y anuncios sobre automatización industrial, IIoT e Industria 4.0 en Perú y la región, publicados en LinkedIn.'
  },
  {
    dir: 'contacto', page: 'contacto',
    title: 'Contacto — Cotiza tu proyecto de Industria 4.0 | EVOLUTEK',
    description: 'Contáctanos y hablemos de tu proyecto de transformación digital industrial: automatización, IIoT, SCADA, analítica avanzada e inteligencia artificial.'
  }
];

// Versión en inglés: mismas páginas (partials/en/), bajo /en. Los títulos
// deben coincidir con PAGE_TITLES_EN de js/nav.js.
const ROUTES_EN = [
  {
    dir: 'en', page: 'inicio',
    title: 'EVOLUTEK — Industrial Automation & Industry 4.0 in Peru',
    description: 'Evolutek drives the digital transformation of industry in Peru and Latin America: automation, IIoT, SCADA, data historians and AI to modernize your plant.'
  },
  {
    dir: 'en/about', page: 'nosotros',
    title: 'About Us — Industry 4.0 System Integrators in Peru | EVOLUTEK',
    description: 'Meet Evolutek: engineering and technology for Industry 4.0, with hands-on experience integrating automation, IIoT and analytics to modernize industry.'
  },
  {
    dir: 'en/products', page: 'productos',
    title: 'Products — Industrial SCADA & IIoT Software | EVOLUTEK',
    description: 'Industrial software we integrate: Canary Labs, Kepware, Ignition, N3uron, Tatsoft, Flow Software and Ketsol to connect, historize and analyze your data.'
  },
  {
    dir: 'en/products/canary', page: 'canary',
    title: 'Canary Labs — Data Historian | EVOLUTEK',
    description: 'Canary Labs: a data historian and analytics platform for process data. Store and visualize years of operational data at high speed.'
  },
  {
    dir: 'en/products/kepware', page: 'kepware',
    title: 'Kepware — Industrial Connectivity | EVOLUTEK',
    description: 'Kepware: an industrial communications server with OPC UA/DA, Modbus and 150+ protocols to connect PLCs and devices to your SCADA systems.'
  },
  {
    dir: 'en/products/ignition', page: 'ignition',
    title: 'Ignition — SCADA, HMI & MES | EVOLUTEK',
    description: 'Ignition: a SCADA, HMI and MES platform with no per-tag licensing. Real-time monitoring, control and visualization from any browser or mobile device.'
  },
  {
    dir: 'en/products/n3uron', page: 'n3uron',
    title: 'N3uron — Edge & MQTT | EVOLUTEK',
    description: 'N3uron: an edge and IIoT platform with native MQTT, OPC UA and REST support to collect field data and send it securely to the cloud.'
  },
  {
    dir: 'en/products/tatsoft', page: 'tatsoft',
    title: 'Tatsoft (FactoryStudio) — SCADA, HMI & OEE | EVOLUTEK',
    description: 'Tatsoft (FactoryStudio): a SCADA/HMI platform with OEE and production management modules to monitor performance in real time.'
  },
  {
    dir: 'en/products/flow', page: 'flow',
    title: 'Flow Software — Data Integration | EVOLUTEK',
    description: 'Flow Software: industrial data integration. Connect systems, databases and platforms in real time and turn data into KPIs.'
  },
  {
    dir: 'en/products/ketsol', page: 'ketsol',
    title: 'Ketsol KMS — Manufacturing Platform | EVOLUTEK',
    description: 'Ketsol KMS: connect PLCs, DCS and SCADA through 50+ protocols, historize the data and turn it into dashboards, reports, alerts and AI for the plant.'
  },
  {
    dir: 'en/services', page: 'servicios', crumb: 'Services',
    title: 'Industrial Automation & Industry 4.0 Services | EVOLUTEK',
    description: 'Evolutek services: consulting, systems integration, automation, IIoT, hydrocarbon fiscal metering and AI solutions for industry.'
  },
  {
    dir: 'en/services/hydrocarbon-fiscal-metering', page: 'fiscalizacion',
    title: 'Hydrocarbon Fiscal Metering — Services | EVOLUTEK',
    description: 'Hydrocarbon fiscal metering: design plus preventive and corrective maintenance of gas metering points and LACT units, to AGA and API standards.'
  },
  {
    dir: 'en/services/ai-solutions', page: 'ia',
    title: 'Custom AI Solutions — Services | EVOLUTEK',
    description: 'Custom AI for industry: anomaly detection, failure prediction and natural-language recommendations with Claude, Gemini and local models.'
  },
  {
    dir: 'en/services/digital-transformation', page: 'transformacion',
    title: 'Digital Transformation — Services | EVOLUTEK',
    description: 'Industrial digital transformation with Evolutek: from your existing systems to advanced analytics and AI, with N3uron, Ignition, Canary, Kepware and Flow Software.'
  },
  {
    dir: 'en/news', page: 'novedades',
    title: 'News — Industry 4.0 Projects & Events | EVOLUTEK',
    description: 'Evolutek news: projects, events and announcements on industrial automation, IIoT and Industry 4.0 in Peru and the region, published on LinkedIn.'
  },
  {
    dir: 'en/contact', page: 'contacto',
    title: 'Contact — Get a Quote for Your Industry 4.0 Project | EVOLUTEK',
    description: 'Contact us to discuss your industrial digital transformation project: automation, IIoT, SCADA, advanced analytics and artificial intelligence.'
  }
].map(r => Object.assign({ lang: 'en' }, r));

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

// Carpeta de parciales de cada idioma: el inglés vive en partials/en/ con los
// mismos nombres de archivo.
const partialsDir = lang => (lang === 'en' ? 'partials/en/' : 'partials/');

// Un shell por idioma: el mismo index.html con el menú, el pie y los modales
// de ese idioma, y su lang en <html>.
function buildShell(lang) {
  let shell = read(repo('index.html'));
  if (lang === 'en') {
    if (!/<html lang="es">/.test(shell)) throw new Error('No se encontró <html lang="es"> en index.html.');
    shell = shell.replace('<html lang="es">', '<html lang="en">');
  }

  // parciales compartidos -> contenido
  for (const name of SHARED_PARTIALS) {
    const marker = new RegExp('[ \t]*<div data-include="partials/' + name + '\.html"></div>');
    if (!marker.test(shell)) throw new Error('No se encontró el placeholder: ' + name);
    shell = shell.replace(marker, read(repo(partialsDir(lang) + name + '.html')).replace(/\s+$/, ''));
  }

  // El año del aviso de copyright lo pone la compilación, no la mano: así deja de
  // quedarse atrasado en cuanto cambia el año. El valor que hay en el parcial es
  // el que se ve en desarrollo, donde no pasa por aquí.
  const HUECO_ANIO = /(<span data-year>)\d{4}(<\/span>)/;
  if (!HUECO_ANIO.test(shell)) throw new Error(`No se encontró el hueco del año (<span data-year>) en el pie (${lang}).`);
  shell = shell.replace(HUECO_ANIO, (m, a, b) => a + new Date().getFullYear() + b);

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
  return shell;
}

const SHELLS = { es: buildShell('es'), en: buildShell('en') };

// Lee la página de una ruta y la marca como visible, de modo que la ruta se
// renderice correctamente aunque el JavaScript no llegue a ejecutarse.
function readPage(name, lang) {
  const src = read(repo(partialsDir(lang) + `page-${name}.html`)).replace(/\s+$/, '');
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
const escHtml = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// "" -> https://evolutek.pe/ ; "servicios/soluciones-ia" -> .../servicios/soluciones-ia
const urlOf = dir => SITE_URL + '/' + dir;

// Datos de la empresa para Google (se incrustan solo en la portada de cada idioma).
const orgJsonLd = lang => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'EVOLUTEK',
  url: urlOf(lang === 'en' ? 'en' : ''),
  logo: urlOf(OG_IMAGE),
  email: 'Administracion@evolutek.pe',
  description: (lang === 'en' ? ROUTES_EN : ROUTES)[0].description,
  areaServed: lang === 'en' ? ['PE', 'BO', 'BR', 'Latin America'] : 'PE',
  sameAs: ['https://www.linkedin.com/company/evolutek-srl/']
});

// Rutas indexables (sin duplicados con canonical propio), por idioma.
const indexables = lang => (lang === 'en' ? ROUTES_EN : ROUTES).filter(r => r.canonical === undefined);

// La misma página en los dos idiomas, para los <link rel="alternate" hreflang>.
// x-default (visitantes de otros idiomas) apunta a la versión en español.
function alternates(route) {
  const es = indexables('es').find(r => r.page === route.page);
  const en = indexables('en').find(r => r.page === route.page);
  if (!es || !en) return [];
  return [
    `<link rel="alternate" hreflang="es" href="${urlOf(es.dir)}">`,
    `<link rel="alternate" hreflang="en" href="${urlOf(en.dir)}">`,
    `<link rel="alternate" hreflang="x-default" href="${urlOf(es.dir)}">`
  ];
}

// Etiquetas SEO de una ruta. Sin "dir" (la página 404) solo se pide no indexar.
function seoHead(route) {
  const t = [`<meta name="google-site-verification" content="${GOOGLE_VERIFICATION}">`];
  if (route.dir === undefined) {
    t.push('<meta name="robots" content="noindex, follow">');
    return t;
  }
  const en = route.lang === 'en';
  const url = urlOf(route.canonical !== undefined ? route.canonical : route.dir);
  t.push(
    `<link rel="canonical" href="${url}">`,
    ...alternates(route),
    '<meta name="robots" content="index, follow, max-image-preview:large">',
    '<meta property="og:type" content="website">',
    `<meta property="og:locale" content="${en ? 'en_US' : 'es_PE'}">`,
    `<meta property="og:locale:alternate" content="${en ? 'es_PE' : 'en_US'}">`,
    '<meta property="og:site_name" content="EVOLUTEK">',
    `<meta property="og:title" content="${escHtml(route.title)}">`,
    `<meta property="og:description" content="${escHtml(route.description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${urlOf(OG_IMAGE)}">`,
    '<meta name="twitter:card" content="summary_large_image">'
  );
  if (route.dir === '' || route.dir === 'en') {
    t.push('<script type="application/ld+json">' + JSON.stringify(orgJsonLd(route.lang)) + '</script>');
  } else if (route.canonical === undefined) {
    t.push('<script type="application/ld+json">' + JSON.stringify(breadcrumbs(route)) + '</script>');
  }
  return t;
}

// Nombre corto de una ruta para las migas: "crumb" si lo tiene, o lo que va
// antes de " — " o " | " en el título.
const shortName = (dir, lang) => {
  const r = (lang === 'en' ? ROUTES_EN : ROUTES).find(x => x.dir === dir);
  return r.crumb || r.title.split(/ — | \| /)[0];
};

// Inicio > Servicios > Soluciones con IA (o Home > Services > Custom AI
// Solutions), en el formato que Google entiende.
function breadcrumbs(route) {
  const en = route.lang === 'en';
  const raiz = en ? 'en' : '';
  const parts = (en ? route.dir.replace(/^en\/?/, '') : route.dir).split('/');
  const items = [{ name: en ? 'Home' : 'Inicio', dir: raiz }];
  for (let i = 1; i <= parts.length; i++) {
    const dir = (en ? 'en/' : '') + parts.slice(0, i).join('/');
    items.push({ name: shortName(dir, route.lang), dir });
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem', position: i + 1, name: it.name, item: urlOf(it.dir)
    }))
  };
}

// El poster del video de cabecera es lo más grande que se pinta al entrar
// (el "LCP" de PageSpeed). Se pide con prioridad alta desde el <head> para no
// esperar a que el navegador lo descubra al leer el <body>.
function lcpPreload(pageHtml) {
  const m = /<video[^>]*\sposter="([^"]+)"/.exec(pageHtml);
  return m ? [`<link rel="preload" as="image" href="${m[1]}" fetchpriority="high">`] : [];
}

// El selector de idioma del menú apunta ya en el HTML a esta misma página en
// el otro idioma (js/nav.js lo mantiene al navegar), así funciona sin JS.
function langSwitchHref(route) {
  if (route.dir === undefined) return null;
  const otro = indexables(route.lang === 'en' ? 'es' : 'en').find(r => r.page === route.page);
  return otro ? '/' + otro.dir : null;
}

function routeHtml(route, pageHtml) {
  const head = lcpPreload(pageHtml).concat(seoHead(route));
  const destino = langSwitchHref(route);
  return SHELLS[route.lang || 'es']
    .replace(/href="[^"]*"( class="lang-switch")/, function (m, resto) { return destino ? 'href="' + destino + '"' + resto : m; })
    .replace(PAGE_SLOT, function () { return pageHtml; })
    .replace(/<title>[\s\S]*?<\/title>/, function () { return '<title>' + escHtml(route.title) + '</title>'; })
    .replace(/(<meta name="description" content=")[^"]*(")/, function (m, a, b) { return a + escHtml(route.description) + b; })
    .replace('</head>', function () { return '  ' + head.join('\n  ') + '\n</head>'; });
}

// Las páginas se leen una sola vez aunque varias rutas apunten a la misma
// (p. ej. "/" e "/inicio"). La clave lleva el idioma: "es:canary", "en:canary".
const PAGE_CACHE_ALL = {};
const pageOf = (name, lang = 'es') => {
  const k = lang + ':' + name;
  return PAGE_CACHE_ALL[k] || (PAGE_CACHE_ALL[k] = readPage(name, lang));
};

const pages = [];
for (const route of ROUTES.concat(ROUTES_EN)) {
  const file = route.dir ? dest(route.dir + '/index.html') : dest('index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, routeHtml(route, pageOf(route.page, route.lang)), 'utf8');
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

// sitemap.xml: una entrada por ruta, salvo los duplicados con canonical propio.
const today = new Date().toISOString().slice(0, 10);
// Incluye las dos versiones; cada página declara su par con hreflang.
// La prioridad sale de la profundidad dentro de cada idioma: "en/services"
// pesa como "servicios".
const sitemapUrls = indexables('es').concat(indexables('en')).map(r => {
  const d = r.lang === 'en' ? r.dir.replace(/^en\/?/, '') : r.dir;
  return '  <url>\n' +
    `    <loc>${urlOf(r.dir)}</loc>\n` +
    `    <lastmod>${today}</lastmod>\n` +
    `    <priority>${d === '' ? '1.0' : d.includes('/') ? '0.7' : '0.8'}</priority>\n` +
    '  </url>';
});
fs.writeFileSync(dest('sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  sitemapUrls.join('\n') + '\n</urlset>\n', 'utf8');

fs.writeFileSync(dest('robots.txt'),
  'User-agent: *\nAllow: /\n\nSitemap: ' + SITE_URL + '/sitemap.xml\n', 'utf8');

// .htaccess para cPanel (Apache). Las rutas son carpetas con index.html, pero
// el sitio enlaza sin barra final (/nosotros); se sirven así directamente, sin
// la redirección a /nosotros/ que Apache haría por defecto, de modo que la URL
// que ve Google es la misma del canonical y del sitemap.
fs.writeFileSync(dest('.htaccess'), [
  'ErrorDocument 404 /404.html',
  'DirectoryIndex index.html',
  '',
  '<IfModule mod_rewrite.c>',
  '  DirectorySlash Off',
  '  RewriteEngine On',
  '',
  '  # Forzar HTTPS. Activar (quitar los #) cuando el certificado SSL ya funcione.',
  '  # RewriteCond %{HTTPS} off',
  '  # RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]',
  '',
  '  # /nosotros/ -> /nosotros',
  '  RewriteCond %{REQUEST_FILENAME} -d',
  '  RewriteRule ^(.+)/$ /$1 [L,R=301]',
  '',
  '  # /nosotros -> sirve nosotros/index.html',
  '  RewriteCond %{REQUEST_FILENAME} -d',
  '  RewriteCond %{REQUEST_FILENAME}/index.html -f',
  '  RewriteRule ^(.+)$ /$1/index.html [L]',
  '</IfModule>',
  ''
].join('\n'), 'utf8');

/* ---------- 5. copiar assets referenciados ---------- */

const refs = new Set();
const addRefs = (text, re) => { let m; while ((m = re.exec(text))) refs.add(m[1]); };
const reAttr = /(?:src|href|poster|data-src)="([^"]+)"/g;
const reUrl = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;

// Se recorren los shells (español e inglés) MÁS todas las páginas: ninguna ruta las contiene a todas,
// pero el router puede pedir cualquiera de ellas en caliente.
addRefs(SHELLS.es, reAttr);
addRefs(SHELLS.en, reAttr);
for (const name of Object.keys(PAGE_CACHE_ALL)) addRefs(PAGE_CACHE_ALL[name], reAttr);
let u; while ((u = reUrl.exec(cssRaw))) refs.add(u[2]);
// Rutas de imagen escritas como texto en el JS (p. ej. el logo de temporada
// que pone js/navidad.js): no aparecen en ningún HTML ni CSS.
addRefs(jsRaw, /['"]((?:EVOLUTEK|img|logos)\/[^'"\s]+\.(?:png|webp|jpe?g|svg|gif|avif))['"]/g);

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
