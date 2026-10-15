// ===== RESUMEN AL PASAR EL MOUSE SOBRE UN LOGO =====
// La clave del producto viene de data-product (antes se leía del atributo
// onclick, que ya no existe).
(function () {
  function tip() { return document.getElementById('logoTip'); }

  function hideLogoTip() {
    const el = tip();
    if (el) el.classList.remove('show');
  }

  function showLogoTip(item, key) {
    const data = PRODUCTS[key];
    const el = tip();
    if (!data || !el) return;

    const icon = document.getElementById('tipIcon');
    if (icon) {
      if (data.icon) { icon.src = data.icon; icon.style.display = 'block'; }
      else { icon.style.display = 'none'; }
    }
    document.getElementById('tipName').textContent = data.name;
    document.getElementById('tipDesc').textContent = data.tip || data.cat;

    const r = item.getBoundingClientRect();
    el.style.left = (r.left + r.width / 2) + 'px';
    el.style.top = r.top + 'px';
    el.classList.add('show');
  }

  function initTooltips(root) {
    root.querySelectorAll('.logo-item[data-product], .ns-cert[data-product]').forEach(function (item) {
      const key = item.dataset.product;
      item.addEventListener('mouseenter', function () { showLogoTip(item, key); });
      item.addEventListener('mouseleave', hideLogoTip);
      item.addEventListener('focus', function () { showLogoTip(item, key); });
      item.addEventListener('blur', hideLogoTip);
      item.addEventListener('click', hideLogoTip);
    });
  }

  window.hideLogoTip = hideLogoTip;

  onPageInit(initTooltips);
  onPageDestroy(hideLogoTip);
  window.addEventListener('scroll', hideLogoTip, { passive: true });
})();
