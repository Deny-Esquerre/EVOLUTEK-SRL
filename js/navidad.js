// ===== TEMPORADA NAVIDEÑA =====
// Edición de temporada:
//   - Guirnalda de focos de vidrio colgando bajo la barra de navegación:
//     cable en catenaria con doble hilo, focos tipo C9 con casquillo, reflejo
//     y halo; se encienden en cascada y luego un secuenciador recorre
//     programas navideños (onda, persecución, color a color, alternado,
//     "Jingle Bells", centelleo y respiración). Cada foco se mece levemente.
//   - Nieve con profundidad de campo SOLO en la cabecera de cada página
//     (entre el video y el texto), nunca sobre el contenido.
//
// Se enciende sola cada año entre el 1 de diciembre y el 6 de enero (Reyes)
// y desaparece sola después: no hace falta tocar el código para retirarla.
// Para verla fuera de temporada, o forzar que no salga:  ?navidad=1 / ?navidad=0
//
// Con "reducir movimiento" activado en el sistema no cae nieve y las luces
// quedan encendidas, quietas.
(function () {
  function enTemporada(hoy) {
    var mes = hoy.getMonth();
    var dia = hoy.getDate();
    return mes === 11 || (mes === 0 && dia <= 6);
  }

  function forzado() {
    var m = /[?&]navidad=([01])/.exec(location.search);
    return m ? m[1] === '1' : null;
  }

  var activo = forzado();
  if (activo === null) activo = enTemporada(new Date());
  if (!activo) return;

  var reducido = !!(window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var nieveOn = !reducido;

  // ---------- nieve con profundidad de campo ----------
  // Tres planos: lejos (pequeño, nítido, lento), medio y cerca (grande,
  // desenfocado, tenue, más rápido). Los copos se pre-dibujan como sprites
  // con degradado radial, así cada cuadro solo hace drawImage.
  var PLANOS = [
    { n: 0.50, r: [1.0, 2.0], v: [10, 18], alfa: [0.5, 0.85], blur: 0 },
    { n: 0.35, r: [2.1, 3.4], v: [20, 32], alfa: [0.65, 0.95], blur: 0.35 },
    { n: 0.15, r: [5, 9],     v: [36, 52], alfa: [0.16, 0.32], blur: 1 }
  ];

  function azar(a) { return a[0] + Math.random() * (a[1] - a[0]); }

  var sprites = {};
  function sprite(blur) {
    if (sprites[blur]) return sprites[blur];
    var t = 64, c = document.createElement('canvas');
    c.width = c.height = t;
    var g = c.getContext('2d');
    var grad = g.createRadialGradient(t / 2, t / 2, 0, t / 2, t / 2, t / 2);
    // Cuanto más desenfocado, más amplio y suave el borde (bokeh).
    var nucleo = 0.45 - blur * 0.35;
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(nucleo, 'rgba(236,240,255,0.9)');
    grad.addColorStop(1, 'rgba(220,226,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, t, t);
    sprites[blur] = c;
    return c;
  }

  function Nieve(cabecera) {
    this.cab = cabecera;
    this.lienzo = document.createElement('canvas');
    this.lienzo.className = 'navidad-nieve';
    this.lienzo.setAttribute('aria-hidden', 'true');
    // Justo después de la capa de contraste: queda sobre el video y bajo el texto.
    var capa = cabecera.querySelector('.hero-grid, .page-hero__overlay, .hero-overlay');
    if (capa) capa.insertAdjacentElement('afterend', this.lienzo);
    else cabecera.insertBefore(this.lienzo, cabecera.firstChild);
    this.ctx = this.lienzo.getContext('2d');
    this.copos = [];
    this.raf = 0;
    this.ultimo = 0;
    this.visible = true;
    this.viento = 0;
    this.t = 0;
    this.cuadro = this.cuadro.bind(this);
    this.medir();

    var self = this;
    if ('ResizeObserver' in window) {
      this.ro = new ResizeObserver(function () { self.medir(); });
      this.ro.observe(cabecera);
    }
    if ('IntersectionObserver' in window) {
      // Fuera de pantalla no se anima: la cabecera solo se ve al principio.
      this.io = new IntersectionObserver(function (e) {
        self.visible = e[0].isIntersecting;
        self.sincronizar();
      });
      this.io.observe(cabecera);
    }
  }

  Nieve.prototype.medir = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.ancho = this.cab.clientWidth;
    this.alto = this.cab.clientHeight;
    this.lienzo.width = Math.round(this.ancho * dpr);
    this.lienzo.height = Math.round(this.alto * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var total = Math.round(Math.min(220, Math.max(70, this.ancho / 6.5)));
    this.copos = [];
    for (var p = 0; p < PLANOS.length; p++) {
      var cant = Math.round(total * PLANOS[p].n);
      for (var i = 0; i < cant; i++) this.copos.push(this.nuevo(PLANOS[p], true));
    }
    if (!this.raf) this.pintar(0);
  };

  Nieve.prototype.nuevo = function (plano, cualquierAltura) {
    var r = azar(plano.r);
    return {
      plano: plano,
      img: sprite(plano.blur),
      r: r,
      x: Math.random() * this.ancho,
      y: cualquierAltura ? Math.random() * this.alto : -r * 2 - Math.random() * 30,
      vy: azar(plano.v),
      alfa: azar(plano.alfa),
      fase: Math.random() * Math.PI * 2,
      amp: 6 + Math.random() * 14,
      frec: 0.25 + Math.random() * 0.5
    };
  };

  Nieve.prototype.pintar = function (dt) {
    var ctx = this.ctx;
    this.t += dt;
    // Ráfagas de viento lentas y suaves, compartidas por todos los copos.
    this.viento = Math.sin(this.t * 0.13) * 10 + Math.sin(this.t * 0.37) * 4;
    ctx.clearRect(0, 0, this.ancho, this.alto);
    for (var i = 0; i < this.copos.length; i++) {
      var c = this.copos[i];
      var prof = c.plano.blur + 0.5;
      c.y += c.vy * dt;
      c.x += this.viento * prof * dt;
      c.fase += c.frec * dt;
      if (c.y - c.r * 2 > this.alto) { this.copos[i] = this.nuevo(c.plano, false); continue; }
      if (c.x < -20) c.x += this.ancho + 40;
      else if (c.x > this.ancho + 20) c.x -= this.ancho + 40;
      var d = c.r * 2;
      ctx.globalAlpha = c.alfa;
      ctx.drawImage(c.img, c.x + Math.sin(c.fase) * c.amp - c.r, c.y - c.r, d, d);
    }
    ctx.globalAlpha = 1;
  };

  Nieve.prototype.cuadro = function (t) {
    var dt = this.ultimo ? Math.min((t - this.ultimo) / 1000, 0.05) : 0.016;
    this.ultimo = t;
    this.pintar(dt);
    this.raf = requestAnimationFrame(this.cuadro);
  };

  Nieve.prototype.sincronizar = function () {
    var debe = nieveOn && this.visible && !document.hidden;
    this.lienzo.classList.toggle('is-off', !nieveOn);
    if (debe && !this.raf) {
      this.ultimo = 0;
      this.raf = requestAnimationFrame(this.cuadro);
    } else if (!debe && this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  };

  Nieve.prototype.destruir = function () {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (this.ro) this.ro.disconnect();
    if (this.io) this.io.disconnect();
    if (this.lienzo.parentNode) this.lienzo.parentNode.removeChild(this.lienzo);
  };

  // Una instancia por página montada (el router inyecta y retira páginas).
  var activas = [];

  function sincronizarTodas() {
    activas.forEach(function (a) { a.nieve.sincronizar(); });
  }

  onPageInit(function (root) {
    var cab = root.querySelector('.hero, .page-hero');
    if (!cab || cab.querySelector('.navidad-nieve')) return;
    var nieve = new Nieve(cab);
    nieve.sincronizar();
    activas.push({ root: root, nieve: nieve });
  });

  onPageDestroy(function (root) {
    activas = activas.filter(function (a) {
      if (a.root !== root) return true;
      a.nieve.destruir();
      return false;
    });
  });

  document.addEventListener('visibilitychange', sincronizarTodas);

  // ---------- guirnalda de luces ----------
  // Tonos joya: [reflejo, vidrio, sombra]. El zafiro es el azul de la marca.
  var COLORES = [
    ['#FFB3BE', '#E0314B', '#7E0E24'],
    ['#FFEBB8', '#F2B33D', '#94590A'],
    ['#A6F5D2', '#19A974', '#0A5238'],
    ['#C9CBFF', '#5A5FE0', '#1F2170'],
    ['#FFFFFF', '#FFE2A6', '#B08C4E']
  ];

  function defsLuces() {
    var h = '<linearGradient id="nvd-casquillo" x1="0" x2="1">' +
      '<stop offset="0" stop-color="#3B3D63"/><stop offset=".45" stop-color="#C9CCDA"/>' +
      '<stop offset=".6" stop-color="#8E91A8"/><stop offset="1" stop-color="#2E3052"/></linearGradient>';
    COLORES.forEach(function (c, k) {
      h += '<radialGradient id="nvd-vidrio-' + k + '" cx=".38" cy=".38" r=".75">' +
        '<stop offset="0" stop-color="' + c[0] + '"/><stop offset=".45" stop-color="' + c[1] + '"/>' +
        '<stop offset="1" stop-color="' + c[2] + '"/></radialGradient>' +
        '<radialGradient id="nvd-halo-' + k + '">' +
        '<stop offset="0" stop-color="' + c[1] + '" stop-opacity=".8"/>' +
        '<stop offset=".4" stop-color="' + c[1] + '" stop-opacity=".3"/>' +
        '<stop offset="1" stop-color="' + c[1] + '" stop-opacity="0"/></radialGradient>';
    });
    return '<defs>' + h + '</defs>';
  }

  // Un foco, con el casquillo en el origen y el vidrio colgando hacia abajo.
  var VIDRIO = 'M-3.3 5.2C-4.9 8.6-4.8 13 0 18.6 4.8 13 4.9 8.6 3.3 5.2Z';

  function foco(k, i, x, y, ang, dur, desfase, escala) {
    return '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ') scale(' + escala + ')">' +
      '<g class="navidad-foco" style="--i:' + i + ';--vaiven:' + dur.toFixed(2) + 's;--vaiven-d:' + desfase.toFixed(2) + 's">' +
        '<circle class="navidad-foco__halo" cx="0" cy="12" r="17" fill="url(#nvd-halo-' + k + ')"/>' +
        '<path d="' + VIDRIO + '" fill="' + COLORES[k][2] + '"/>' +
        '<path class="navidad-foco__luz" d="' + VIDRIO + '" fill="url(#nvd-vidrio-' + k + ')"/>' +
        '<ellipse cx="-1.5" cy="9.6" rx=".9" ry="2.6" fill="#fff" opacity=".7" transform="rotate(14 -1.5 9.6)"/>' +
        '<rect x="-2.6" y="-.4" width="5.2" height="6" rx="1" fill="url(#nvd-casquillo)"/>' +
        '<path d="M-2.6 1.6h5.2M-2.6 3.4h5.2" stroke="#1E2046" stroke-width=".45" opacity=".55"/>' +
      '</g></g>';
  }

  function dibujarLuces(cont, ancho) {
    var movil = ancho < 640;
    var tramos = Math.max(4, Math.round(ancho / (movil ? 80 : 112)));
    var paso = ancho / tramos;
    var caida = movil ? 9 : 12;
    var escala = movil ? 1.05 : 1.25;
    var y0 = 1.5;
    var cy = y0 + caida * 2;
    var alto = Math.ceil(cy + 30 * escala);
    var cable = '', ganchos = '', focos = '', i = 0;

    for (var t = 0; t < tramos; t++) {
      var x0 = t * paso, x2 = x0 + paso, cx = x0 + paso / 2;
      cable += 'M' + x0.toFixed(1) + ' ' + y0 + 'Q' + cx.toFixed(1) + ' ' + cy + ' ' + x2.toFixed(1) + ' ' + y0;
      ganchos += '<circle cx="' + x0.toFixed(1) + '" cy="' + y0 + '" r="1.7"/>';
      for (var j = 0; j < 3; j++) {
        // Punto y pendiente sobre la curva cuadrática del tramo.
        var u = 0.24 + j * 0.26;
        var a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u;
        var px = a * x0 + b * cx + c * x2;
        var py = a * y0 + b * cy + c * y0;
        var dx = 2 * (1 - u) * (cx - x0) + 2 * u * (x2 - cx);
        var dy = 2 * (1 - u) * (cy - y0) + 2 * u * (y0 - cy);
        // El foco sigue a medias la pendiente del cable, con un leve giro propio.
        var ang = Math.atan2(dy, dx) * 90 / Math.PI + (i % 2 ? 6 : -6);
        focos += foco(i % COLORES.length, i, px, py, ang, 3.2 + Math.random() * 2.2, -Math.random() * 5, escala);
        i++;
      }
    }

    cont.innerHTML =
      '<svg width="' + ancho + '" height="' + alto + '" viewBox="0 0 ' + ancho + ' ' + alto + '" aria-hidden="true" focusable="false">' +
        defsLuces() +
        '<path d="' + cable + '" fill="none" stroke="#2E3060" stroke-width="1.6" stroke-linecap="round"/>' +
        '<path d="' + cable + '" fill="none" stroke="#9C9FC4" stroke-opacity=".75" stroke-width=".8" stroke-dasharray="2.4 2.2" transform="translate(0 .6)"/>' +
        '<g fill="#2E3060" stroke="#9C9FC4" stroke-opacity=".6" stroke-width=".6">' + ganchos + '</g>' +
        focos +
      '</svg>';
  }

  // ---------- secuencias de la guirnalda ----------
  // Como el controlador de una serie de luces: varios programas que se turnan
  // en bucle. Cada programa da, en cada paso, un nivel de 0 a 1 por foco; el
  // CSS convierte ese nivel en brillo del vidrio y tamaño del halo, con una
  // transición propia de cada programa (seca para los destellos, suave para
  // las ondas). n = cantidad de focos, c = color del foco (0..4).
  var BAJO = 0.12;

  // "Jingle Bells" en corcheas: Jin-gle bells / jin-gle bells /
  // jin-gle all the way, y un silencio antes de repetir.
  var JINGLE = [2, 2, 4, 2, 2, 4, 2, 2, 3, 1, 8, 4];
  var JINGLE_NOTAS = (function () {
    var marcas = {}, pos = 0;
    JINGLE.forEach(function (d, j) {
      // La última entrada es el silencio: no enciende nada.
      if (j < JINGLE.length - 1) marcas[pos] = { nota: j, dur: d };
      pos += d;
    });
    return { marcas: marcas, total: pos };
  })();

  var PROGRAMAS = [
    { // Onda: una ola de luz recorre la tira.
      nombre: 'onda', paso: 90, dur: 8000, trans: 0.18,
      nivel: function (k, i) {
        return 0.12 + 0.88 * Math.pow(0.5 + 0.5 * Math.sin(i * 0.42 - k * 0.32), 2);
      }
    },
    { // Persecución clásica de teatro: uno de cada tres, avanzando.
      nombre: 'persecucion', paso: 150, dur: 7000, trans: 0.1,
      nivel: function (k, i) { return ((i - k) % 3 + 3) % 3 === 0 ? 1 : BAJO; }
    },
    { // Color a color: se van sumando los cinco tonos y luego se apagan.
      nombre: 'colores', paso: 420, dur: 8400, trans: 0.25,
      nivel: function (k, i, n, c) {
        var m = k % 7;
        if (m === 5) return 1;
        if (m === 6) return BAJO;
        return c <= m ? 1 : BAJO;
      }
    },
    { // Alternado: pares e impares se turnan al compás.
      nombre: 'alternado', paso: 480, dur: 6700, trans: 0.16,
      nivel: function (k, i) { return (i + k) % 2 ? 1 : BAJO; }
    },
    { // Jingle Bells: cada nota es un golpe de luz; las notas largas se
      // sostienen. Las notas se reparten entre las dos mitades de la tira
      // y la frase final enciende todo.
      nombre: 'jingle', paso: 150, dur: 150 * JINGLE_NOTAS.total * 2, trans: 0.08,
      estado: function () { return { nota: null, desde: 0 }; },
      nivel: function (k, i, n, c, e, primero) {
        var pos = k % JINGLE_NOTAS.total;
        if (primero) {
          var m = JINGLE_NOTAS.marcas[pos];
          if (m) { e.nota = m; e.desde = pos; }
          else if (e.nota && pos >= e.desde + e.nota.dur) e.nota = null;
        }
        if (!e.nota) return BAJO;
        var golpe = pos === e.desde;
        var largo = e.nota.dur >= 4;
        var j = e.nota.nota;
        // "all the way": toda la tira.
        var todos = j >= 8;
        var mio = todos || (j % 2 === 0 ? i % 2 === 0 : i % 2 === 1);
        if (!mio) return BAJO;
        return golpe || largo ? 1 : 0.45;
      }
    },
    { // Centelleo: chispas al azar que se apagan despacio.
      nombre: 'centelleo', paso: 110, dur: 7500, trans: 0.12,
      estado: function () { return { v: [] }; },
      nivel: function (k, i, n, c, e) {
        var v = e.v[i] === undefined ? 0.6 : e.v[i];
        v = Math.random() < 0.07 ? 1 : Math.max(0.22, v * 0.84);
        e.v[i] = v;
        return v;
      }
    },
    { // Respiración: toda la tira sube y baja a la vez, como un latido lento.
      nombre: 'respiracion', paso: 80, dur: 6400, trans: 0.12,
      nivel: function (k) { return 0.14 + 0.86 * (0.5 + 0.5 * Math.cos(k * 0.16)); }
    }
  ];

  function Secuenciador(cont) {
    this.cont = cont;
    this.focos = [];
    this.niveles = [];
    this.prog = 0;
    this.k = 0;
    this.inicio = 0;
    this.timer = 0;
    this.estado = null;
    this.tick = this.tick.bind(this);
  }

  Secuenciador.prototype.recoger = function () {
    this.focos = Array.prototype.slice.call(this.cont.querySelectorAll('.navidad-foco'));
    this.niveles = [];
  };

  Secuenciador.prototype.empezarPrograma = function (idx) {
    var p = PROGRAMAS[idx];
    this.prog = idx;
    this.k = 0;
    this.inicio = Date.now();
    this.estado = p.estado ? p.estado() : {};
    this.cont.style.setProperty('--trans', p.trans + 's');
    this.cont.setAttribute('data-programa', p.nombre);
  };

  Secuenciador.prototype.tick = function () {
    var p = PROGRAMAS[this.prog];
    if (Date.now() - this.inicio >= p.dur) {
      this.empezarPrograma((this.prog + 1) % PROGRAMAS.length);
      p = PROGRAMAS[this.prog];
    }
    var n = this.focos.length;
    for (var i = 0; i < n; i++) {
      var v = p.nivel(this.k, i, n, i % COLORES.length, this.estado, i === 0);
      v = Math.round(v * 100) / 100;
      // Solo se toca el DOM cuando el nivel cambia.
      if (this.niveles[i] !== v) {
        this.niveles[i] = v;
        this.focos[i].style.setProperty('--nivel', v);
      }
    }
    this.k++;
    this.timer = setTimeout(this.tick, p.paso);
  };

  Secuenciador.prototype.iniciar = function () {
    if (this.timer) return;
    // Al volver a la pestaña, el programa en curso retoma su tiempo completo.
    if (!this.inicio) this.empezarPrograma(0);
    else this.inicio = Date.now();
    this.tick();
  };

  Secuenciador.prototype.detener = function () {
    clearTimeout(this.timer);
    this.timer = 0;
  };

  function montarLuces() {
    var nav = document.getElementById('navbar');
    if (!nav || nav.querySelector('.navidad-luces')) return;
    var cont = document.createElement('div');
    cont.className = 'navidad-luces';
    cont.setAttribute('aria-hidden', 'true');
    nav.appendChild(cont);

    var sec = new Secuenciador(cont);
    var enSecuencia = false;

    var ultimoAncho = 0;
    function ajustar() {
      var ancho = nav.clientWidth;
      if (!ancho || ancho === ultimoAncho) return;
      ultimoAncho = ancho;
      dibujarLuces(cont, ancho);
      sec.recoger();
    }
    ajustar();

    // Primero el encendido en cascada; cuando el último foco ya prendió,
    // toma el control el secuenciador. Con movimiento reducido las luces
    // se quedan encendidas, fijas.
    requestAnimationFrame(function () { cont.classList.add('is-on'); });
    if (!reducido) {
      setTimeout(function () {
        cont.classList.add('en-secuencia');
        enSecuencia = true;
        if (!document.hidden) sec.iniciar();
      }, sec.focos.length * 28 + 1100);

      // Pestaña oculta: el controlador descansa.
      document.addEventListener('visibilitychange', function () {
        if (!enSecuencia) return;
        if (document.hidden) sec.detener(); else sec.iniciar();
      });
    }

    var espera;
    window.addEventListener('resize', function () {
      clearTimeout(espera);
      espera = setTimeout(ajustar, 150);
    });
  }

  // ---------- logo con gorro navideño ----------
  // Sustituye al logo de la barra solo en temporada. Si la imagen no carga,
  // vuelve el logo de siempre.
  var LOGO_NAVIDAD = 'EVOLUTEK/png/evolutek-logo-navidad.webp';

  function ponerLogoNavidad() {
    var logo = document.querySelector('.navbar-logo');
    if (!logo || logo.classList.contains('navbar-logo--navidad')) return;
    var original = logo.getAttribute('src');
    logo.addEventListener('error', function volver() {
      logo.removeEventListener('error', volver);
      logo.classList.remove('navbar-logo--navidad');
      logo.setAttribute('src', original);
    });
    logo.classList.add('navbar-logo--navidad');
    logo.setAttribute('src', LOGO_NAVIDAD);
  }

  // Cuanto antes, para que el logo normal apenas se alcance a ver.
  ponerLogoNavidad();

  onReady(function () {
    document.documentElement.classList.add('navidad');
    ponerLogoNavidad();
    montarLuces();
  });
})();
