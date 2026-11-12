// ===== HERO: rotador de frases y carrusel de vídeos =====
// Los intervalos se guardan por página y se limpian al salir de ella, para que
// una página retirada del DOM no siga disparando temporizadores.
(function () {
  const timers = new WeakMap();

  function remember(root, id) {
    const list = timers.get(root) || [];
    list.push(id);
    timers.set(root, list);
  }

  function initHeroPhrases(root) {
    const phrases = root.querySelectorAll('.hero-phrase');
    if (phrases.length < 2) return;

    let current = 0;
    remember(root, setInterval(function () {
      phrases[current].classList.remove('is-active');
      current = (current + 1) % phrases.length;
      phrases[current].classList.add('is-active');
    }, 4200));
  }

  // Los videos no se piden hasta que la página terminó de cargar: mientras
  // tanto se ve su poster, que es lo que mide Google como elemento principal.
  // Con ahorro de datos activado se quedan en el poster.
  function afterLoad(root, fn) {
    const c = navigator.connection;
    if (c && c.saveData) return;
    const start = function () { remember(root, setTimeout(fn, 800)); };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
  }

  function playVideo(v) {
    if (!v.getAttribute('src') && v.dataset.src) v.setAttribute('src', v.dataset.src);
    const p = v.play();
    if (p && p.catch) p.catch(function () {});
  }

  // Video de cabecera de las páginas internas (uno solo, en bucle).
  function initPageHeroVideos(root) {
    const vids = root.querySelectorAll('.page-hero__video[data-src]');
    if (vids.length) afterLoad(root, function () { vids.forEach(playVideo); });
  }

  function initHeroVideos(root) {
    const vids = Array.prototype.slice.call(root.querySelectorAll('.hero-video'));
    if (vids.length < 2) return;
    afterLoad(root, function () { startCarousel(root, vids); });
  }

  function startCarousel(root, vids) {
    let current = 0;
    function activate(idx) {
      vids.forEach(function (v, j) { v.classList.toggle('active', j === idx); });
      playVideo(vids[idx]);
    }

    activate(0);
    remember(root, setInterval(function () {
      current = (current + 1) % vids.length;
      activate(current);
    }, 7000));
  }

  // Velocidad de reproducción por video: data-velocidad="0.5" lo pasa a la
  // mitad. El navegador la reinicia al cargar el archivo, así que se vuelve
  // a aplicar en loadedmetadata.
  function initVideoSpeed(root) {
    root.querySelectorAll('video[data-velocidad]').forEach(function (v) {
      const rate = parseFloat(v.dataset.velocidad) || 1;
      const apply = function () { v.playbackRate = rate; };
      apply();
      v.addEventListener('loadedmetadata', apply);
      v.addEventListener('play', apply);
    });
  }

  function initHero(root) {
    initHeroPhrases(root);
    initHeroVideos(root);
    initPageHeroVideos(root);
    initVideoSpeed(root);
  }

  function destroyHero(root) {
    (timers.get(root) || []).forEach(clearInterval);
    timers.delete(root);
  }

  onPageInit(initHero);
  onPageDestroy(destroyHero);
})();
