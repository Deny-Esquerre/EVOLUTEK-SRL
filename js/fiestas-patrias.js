// ===== FIESTAS PATRIAS =====
// Edición de temporada para julio:
//   - Banderas del Perú colgando bajo la barra de navegación, de un cordel en
//     catenaria; se despliegan en cascada al cargar y ondean como con viento.
//   - Confeti rojo y blanco y fuegos artificiales SOLO en la cabecera de cada
//     página (entre el video y el texto), nunca sobre el contenido.
//   - Una escarapela prendida en el logo.
//
// Se enciende sola cada año del 1 al 31 de julio y desaparece sola después.
// Para verla fuera de temporada, o forzar que no salga:  ?patrias=1 / ?patrias=0
//
// Con "reducir movimiento" activado en el sistema no hay confeti ni fuegos y
// las banderas quedan quietas.
(function () {
  function enTemporada(hoy) {
    return hoy.getMonth() === 6;
  }

  function forzado() {
    var m = /[?&]patrias=([01])/.exec(location.search);
    return m ? m[1] === '1' : null;
  }

  var activo = forzado();
  if (activo === null) activo = enTemporada(new Date());
  if (!activo) return;

  var reducido = !!(window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // Rojo de la bandera del Perú y sus sombras.
  var ROJO = '#D91023';
  var ROJO_OSCURO = '#9E0B19';
  var BLANCO = '#FFFFFF';
  var ORO = '#F3C969';

  function azar(a, b) { return a + Math.random() * (b - a); }

  // ---------- escarapela ----------
  // Roseta plisada roja, blanca y roja con dos cintas rojiblancas.
  function svgEscarapela() {
    function cinta(ang) {
      return '<g transform="translate(20 21) rotate(' + ang + ')">' +
        '<polygon points="-4,0 -1.33,0 -1.33,21.33 -4,24" fill="' + ROJO + '"/>' +
        '<polygon points="-1.33,0 1.33,0 1.33,21.33 0,20 -1.33,21.33" fill="' + BLANCO + '"/>' +
        '<polygon points="1.33,0 4,0 4,24 1.33,21.33" fill="' + ROJO + '"/>' +
        '<polygon points="-4,0 4,0 4,24 0,20 -4,24" fill="none" stroke="#000" stroke-opacity=".18" stroke-width=".5"/>' +
      '</g>';
    }
    // Borde ondulado de la roseta y pliegues radiales.
    var borde = [], pliegues = '';
    for (var k = 0; k < 40; k++) {
      var a = k * Math.PI / 20, r = k % 2 ? 15.2 : 16.4;
      borde.push((20 + Math.cos(a) * r).toFixed(2) + ',' + (19 + Math.sin(a) * r).toFixed(2));
    }
    for (var p = 0; p < 24; p++) {
      var b = p * Math.PI / 12;
      pliegues += '<path d="M' + (20 + Math.cos(b) * 6).toFixed(2) + ' ' + (19 + Math.sin(b) * 6).toFixed(2) +
        'L' + (20 + Math.cos(b) * 15.6).toFixed(2) + ' ' + (19 + Math.sin(b) * 15.6).toFixed(2) + '"/>';
    }
    return '<svg viewBox="0 0 40 48" aria-hidden="true" focusable="false">' +
      '<defs><radialGradient id="fp-centro" cx=".38" cy=".35" r=".7">' +
        '<stop offset="0" stop-color="#FF5A6B"/><stop offset=".6" stop-color="' + ROJO + '"/>' +
        '<stop offset="1" stop-color="' + ROJO_OSCURO + '"/></radialGradient></defs>' +
      cinta(20) + cinta(-20) +
      '<polygon points="' + borde.join(' ') + '" fill="' + ROJO + '" stroke="' + ROJO_OSCURO + '" stroke-width=".5"/>' +
      '<circle cx="20" cy="19" r="11" fill="' + BLANCO + '" stroke="#E5E5EA" stroke-width=".5"/>' +
      '<g stroke="#000" stroke-opacity=".12" stroke-width=".55">' + pliegues + '</g>' +
      '<circle cx="20" cy="19" r="6" fill="url(#fp-centro)"/>' +
      '<ellipse cx="18" cy="16.8" rx="2" ry="1.2" fill="#fff" opacity=".45"/>' +
    '</svg>';
  }

  function ponerEscarapela() {
    var marca = document.querySelector('.navbar-brand');
    if (!marca || marca.querySelector('.fp-escarapela')) return;
    var e = document.createElement('span');
    e.className = 'fp-escarapela';
    e.setAttribute('aria-hidden', 'true');
    e.innerHTML = svgEscarapela();
    marca.appendChild(e);
  }

  // ---------- banderas del Perú ----------
  // Bandera nacional (sin escudo), proporción 3:2, colgada del cordel por su
  // borde superior. Dos cortes de tela con la onda del borde inferior
  // invertida, alternados, para que la tira no se vea repetida.
  var TELA = [
    'M-10.5 0H10.5V14C7 15.6 3.6 12.6 0 14S-7 15.6-10.5 14Z',
    'M-10.5 0H10.5V14C7 12.4 3.6 15.4 0 14S-7 12.4-10.5 14Z'
  ];

  function bandera(i, x, y, ang, escala) {
    var k = i % 2;
    return '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ') scale(' + escala + ')">' +
      '<g class="fp-banderola" style="--i:' + i + '"><g class="fp-tela">' +
        '<g clip-path="url(#fp-corte-' + k + ')">' +
          '<rect x="-10.5" y="0" width="7.05" height="16" fill="' + ROJO + '"/>' +
          '<rect x="-3.5" y="0" width="7" height="16" fill="' + BLANCO + '"/>' +
          '<rect x="3.45" y="0" width="7.05" height="16" fill="' + ROJO + '"/>' +
          // Pliegues: bandas de luz y sombra a lo ancho de la tela.
          '<rect x="-10.5" y="0" width="21" height="16" fill="url(#fp-pliegues-' + k + ')"/>' +
          // Dobladillo donde la tela abraza el cordel.
          '<rect x="-10.5" y="0" width="21" height="1.5" fill="#000" opacity=".16"/>' +
        '</g>' +
        '<path d="' + TELA[k] + '" fill="none" stroke="#000" stroke-opacity=".22" stroke-width=".45" stroke-linejoin="round"/>' +
      '</g></g></g>';
  }

  function dibujarBanderas(cont, ancho) {
    var movil = ancho < 640;
    var tramos = Math.max(3, Math.round(ancho / (movil ? 110 : 150)));
    var paso = ancho / tramos;
    var caida = movil ? 9 : 12;
    var escala = movil ? 0.95 : 1.15;
    var porTramo = movil ? 4 : 5;
    var y0 = 1.5, cy = y0 + caida * 2;
    var alto = Math.ceil(cy + 18 * escala);
    var cordel = '', nudos = '', piezas = '', i = 0;

    for (var t = 0; t < tramos; t++) {
      var x0 = t * paso, x2 = x0 + paso, cx = x0 + paso / 2;
      cordel += 'M' + x0.toFixed(1) + ' ' + y0 + 'Q' + cx.toFixed(1) + ' ' + cy + ' ' + x2.toFixed(1) + ' ' + y0;
      nudos += '<circle cx="' + x0.toFixed(1) + '" cy="' + y0 + '" r="1.8"/>';
      for (var j = 0; j < porTramo; j++) {
        var u = (j + 0.5) / porTramo;
        var a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u;
        var px = a * x0 + b * cx + c * x2;
        var py = a * y0 + b * cy + c * y0;
        var dx = 2 * (1 - u) * (cx - x0) + 2 * u * (x2 - cx);
        var dy = 2 * (1 - u) * (cy - y0) + 2 * u * (y0 - cy);
        // La bandera sigue la pendiente del cordel: va cosida a él.
        piezas += bandera(i, px, py, Math.atan2(dy, dx) * 180 / Math.PI, escala);
        i++;
      }
    }

    cont.innerHTML =
      '<svg width="' + ancho + '" height="' + alto + '" viewBox="0 0 ' + ancho + ' ' + alto + '" aria-hidden="true" focusable="false">' +
        '<defs>' +
          // Los recortes van en coordenadas locales de cada bandera, así que
          // un mismo clipPath sirve para todas.
          '<clipPath id="fp-corte-0"><path d="' + TELA[0] + '"/></clipPath>' +
          '<clipPath id="fp-corte-1"><path d="' + TELA[1] + '"/></clipPath>' +
          // Las crestas de luz coinciden con la onda de cada corte.
          '<linearGradient id="fp-pliegues-0" x1="0" y1="0" x2="1" y2="0">' +
            '<stop offset="0" stop-color="#000" stop-opacity=".1"/>' +
            '<stop offset=".25" stop-color="#fff" stop-opacity=".2"/>' +
            '<stop offset=".5" stop-color="#000" stop-opacity=".14"/>' +
            '<stop offset=".75" stop-color="#fff" stop-opacity=".18"/>' +
            '<stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>' +
          '<linearGradient id="fp-pliegues-1" x1="0" y1="0" x2="1" y2="0">' +
            '<stop offset="0" stop-color="#fff" stop-opacity=".16"/>' +
            '<stop offset=".25" stop-color="#000" stop-opacity=".13"/>' +
            '<stop offset=".5" stop-color="#fff" stop-opacity=".2"/>' +
            '<stop offset=".75" stop-color="#000" stop-opacity=".12"/>' +
            '<stop offset="1" stop-color="#fff" stop-opacity=".1"/></linearGradient>' +
        '</defs>' +
        '<path d="' + cordel + '" fill="none" stroke="#3A2A2E" stroke-width="1.3" stroke-linecap="round"/>' +
        '<path d="' + cordel + '" fill="none" stroke="#B9A9A0" stroke-opacity=".7" stroke-width=".6" stroke-dasharray="2 2" transform="translate(0 .5)"/>' +
        '<g fill="#3A2A2E">' + nudos + '</g>' +
        piezas +
      '</svg>';
  }

  function montarBanderas() {
    var nav = document.getElementById('navbar');
    if (!nav || nav.querySelector('.fp-banderolas')) return;
    var cont = document.createElement('div');
    cont.className = 'fp-banderolas';
    cont.setAttribute('aria-hidden', 'true');
    nav.appendChild(cont);

    var ultimoAncho = 0;
    function ajustar() {
      var ancho = nav.clientWidth;
      if (!ancho || ancho === ultimoAncho) return;
      ultimoAncho = ancho;
      dibujarBanderas(cont, ancho);
    }
    ajustar();
    requestAnimationFrame(function () { cont.classList.add('is-on'); });

    var espera;
    window.addEventListener('resize', function () {
      clearTimeout(espera);
      espera = setTimeout(ajustar, 150);
    });
  }

  // ---------- confeti y fuegos artificiales en la cabecera ----------
  var COLORES_CONFETI = [ROJO, ROJO, BLANCO, BLANCO, '#FF4D5E', ORO];
  var COLORES_FUEGO = [ROJO, '#FF4D5E', BLANCO, ORO];

  function Festejo(cabecera) {
    this.cab = cabecera;
    this.lienzo = document.createElement('canvas');
    this.lienzo.className = 'fp-festejo';
    this.lienzo.setAttribute('aria-hidden', 'true');
    // Justo después de la capa de contraste: sobre el video y bajo el texto.
    var capa = cabecera.querySelector('.hero-grid, .page-hero__overlay, .hero-overlay');
    if (capa) capa.insertAdjacentElement('afterend', this.lienzo);
    else cabecera.insertBefore(this.lienzo, cabecera.firstChild);
    this.ctx = this.lienzo.getContext('2d');
    this.confeti = [];
    this.cohetes = [];
    this.chispas = [];
    this.proximoCohete = 1.2;
    this.raf = 0;
    this.ultimo = 0;
    this.visible = true;
    this.cuadro = this.cuadro.bind(this);
    this.medir();

    var self = this;
    if ('ResizeObserver' in window) {
      this.ro = new ResizeObserver(function () { self.medir(); });
      this.ro.observe(cabecera);
    }
    if ('IntersectionObserver' in window) {
      this.io = new IntersectionObserver(function (e) {
        self.visible = e[0].isIntersecting;
        self.sincronizar();
      });
      this.io.observe(cabecera);
    }
  }

  Festejo.prototype.medir = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.ancho = this.cab.clientWidth;
    this.alto = this.cab.clientHeight;
    this.lienzo.width = Math.round(this.ancho * dpr);
    this.lienzo.height = Math.round(this.alto * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var total = Math.round(Math.min(110, Math.max(34, this.ancho / 13)));
    this.confeti = [];
    for (var i = 0; i < total; i++) this.confeti.push(this.papel(true));
  };

  Festejo.prototype.papel = function (cualquierAltura) {
    return {
      x: Math.random() * this.ancho,
      y: cualquierAltura ? Math.random() * this.alto : -12 - Math.random() * 40,
      w: azar(4, 7),
      h: azar(8, 13),
      vy: azar(38, 80),
      vx: azar(-12, 12),
      giro: Math.random() * Math.PI * 2,
      vgiro: azar(-2.4, 2.4),
      volteo: Math.random() * Math.PI * 2,
      vvolteo: azar(3, 7),
      fase: Math.random() * Math.PI * 2,
      color: COLORES_CONFETI[(Math.random() * COLORES_CONFETI.length) | 0],
      alfa: azar(0.55, 0.95)
    };
  };

  // Los cohetes salen del borde inferior, en la mitad derecha en escritorio
  // (a la izquierda está el texto de la cabecera) y en todo el ancho en móvil.
  Festejo.prototype.lanzar = function () {
    var desde = this.ancho > 760 ? 0.48 : 0.1;
    var x = this.ancho * azar(desde, 0.92);
    this.cohetes.push({
      x: x, y: this.alto + 6,
      vx: azar(-18, 18),
      vy: -azar(this.alto * 0.95, this.alto * 1.25),
      destino: this.alto * azar(0.14, 0.42),
      color: COLORES_FUEGO[(Math.random() * COLORES_FUEGO.length) | 0]
    });
  };

  Festejo.prototype.estallar = function (c) {
    var n = 46 + ((Math.random() * 22) | 0);
    var vel = azar(90, 150);
    // Cada fuego mezcla su color con destellos blancos.
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2 + azar(-0.06, 0.06);
      var v = vel * azar(0.55, 1);
      this.chispas.push({
        x: c.x, y: c.y, px: c.x, py: c.y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        vida: 0, max: azar(1.1, 1.7),
        color: Math.random() < 0.22 ? BLANCO : c.color
      });
    }
  };

  Festejo.prototype.pintar = function (dt) {
    var ctx = this.ctx, i;
    ctx.clearRect(0, 0, this.ancho, this.alto);

    // Fuegos: estela y chispas con mezcla aditiva para que brillen.
    this.proximoCohete -= dt;
    if (this.proximoCohete <= 0) {
      this.lanzar();
      if (Math.random() < 0.35) this.lanzar();
      this.proximoCohete = azar(2.2, 4.2);
    }
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (i = this.cohetes.length - 1; i >= 0; i--) {
      var r = this.cohetes[i];
      var px = r.x, py = r.y;
      r.vy += 120 * dt;
      r.x += r.vx * dt;
      r.y += r.vy * dt;
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = ORO;
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(px, py + 10); ctx.lineTo(r.x, r.y); ctx.stroke();
      if (r.y <= r.destino || r.vy >= -30) {
        this.estallar(r);
        this.cohetes.splice(i, 1);
      }
    }
    for (i = this.chispas.length - 1; i >= 0; i--) {
      var s = this.chispas[i];
      s.vida += dt;
      if (s.vida >= s.max) { this.chispas.splice(i, 1); continue; }
      s.px = s.x; s.py = s.y;
      s.vx *= 1 - 1.6 * dt;
      s.vy = s.vy * (1 - 1.6 * dt) + 70 * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      var resto = 1 - s.vida / s.max;
      // Parpadeo al final de la vida, como las chispas que se apagan.
      var titileo = resto < 0.35 ? (Math.random() < 0.5 ? 0.3 : 1) : 1;
      ctx.globalAlpha = resto * titileo;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(s.px, s.py); ctx.lineTo(s.x, s.y); ctx.stroke();
    }

    // Confeti: papelitos que giran y se voltean (el volteo los achata).
    ctx.globalCompositeOperation = 'source-over';
    for (i = 0; i < this.confeti.length; i++) {
      var p = this.confeti[i];
      p.y += p.vy * dt;
      p.fase += dt * 1.4;
      p.x += (p.vx + Math.sin(p.fase) * 18) * dt;
      p.giro += p.vgiro * dt;
      p.volteo += p.vvolteo * dt;
      if (p.y - p.h > this.alto) { this.confeti[i] = this.papel(false); continue; }
      if (p.x < -20) p.x += this.ancho + 40;
      else if (p.x > this.ancho + 20) p.x -= this.ancho + 40;
      var achatado = Math.cos(p.volteo);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.giro);
      ctx.scale(1, Math.abs(achatado) < 0.08 ? 0.08 : achatado);
      ctx.globalAlpha = p.alfa * (0.7 + 0.3 * Math.abs(achatado));
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  };

  Festejo.prototype.cuadro = function (t) {
    var dt = this.ultimo ? Math.min((t - this.ultimo) / 1000, 0.05) : 0.016;
    this.ultimo = t;
    this.pintar(dt);
    this.raf = requestAnimationFrame(this.cuadro);
  };

  Festejo.prototype.sincronizar = function () {
    var debe = !reducido && this.visible && !document.hidden;
    if (debe && !this.raf) {
      this.ultimo = 0;
      this.raf = requestAnimationFrame(this.cuadro);
    } else if (!debe && this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  };

  Festejo.prototype.destruir = function () {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (this.ro) this.ro.disconnect();
    if (this.io) this.io.disconnect();
    if (this.lienzo.parentNode) this.lienzo.parentNode.removeChild(this.lienzo);
  };

  // Una instancia por página montada (el router inyecta y retira páginas).
  var activas = [];

  if (!reducido) {
    onPageInit(function (root) {
      var cab = root.querySelector('.hero, .page-hero');
      if (!cab || cab.querySelector('.fp-festejo')) return;
      var f = new Festejo(cab);
      f.sincronizar();
      activas.push({ root: root, festejo: f });
    });

    onPageDestroy(function (root) {
      activas = activas.filter(function (a) {
        if (a.root !== root) return true;
        a.festejo.destruir();
        return false;
      });
    });

    document.addEventListener('visibilitychange', function () {
      activas.forEach(function (a) { a.festejo.sincronizar(); });
    });
  }

  onReady(function () {
    document.documentElement.classList.add('fiestas-patrias');
    ponerEscarapela();
    montarBanderas();
  });
})();
