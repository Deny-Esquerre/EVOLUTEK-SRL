function openProductModal(key) {
  const data = PRODUCTS[key];
  if (!data) return;

  document.getElementById('pmLogo').src = data.logo;
  document.getElementById('pmLogo').alt = data.name;
  document.getElementById('pmCat').textContent = data.cat;
  document.getElementById('pmName').textContent = data.name;
  document.getElementById('pmDesc').textContent = data.desc;

  const modal = document.getElementById('productModal');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeProductModal() {
  const modal = document.getElementById('productModal');
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

function openPrivacyModal() {
  const modal = document.getElementById('privacyModal');
  if (!modal) return;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closePrivacyModal() {
  const modal = document.getElementById('privacyModal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

// La decisión no se guarda a propósito: el aviso tiene que salir en cada
// visita y en cada recarga. Antes se recordaba en localStorage y, una vez
// aceptado, no volvía a aparecer nunca en ese navegador.
//
// Aceptar o denegar lo retira mientras dure la visita, de modo que navegar
// entre páginas no lo saca otra vez: el router cambia de página sin recargar
// y este script no se vuelve a ejecutar.
let privacyDecision = null;

function hideConsentBar() {
  const bar = document.getElementById('consentBar');
  if (bar) bar.classList.remove('show');
}

function acceptPrivacy() {
  privacyDecision = 'accepted';
  hideConsentBar();
}

function denyPrivacy() {
  privacyDecision = 'denied';
  hideConsentBar();
}

// Al entrar sale siempre.
onReady(function () {
  const bar = document.getElementById('consentBar');
  if (bar) bar.classList.add('show');
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeProductModal(); closePrivacyModal(); }
});

// Los logos de producto abren su ficha. Delegado en document para que funcione
// también con las páginas que el router inyecta después.
document.addEventListener('click', (e) => {
  const item = e.target.closest ? e.target.closest('[data-product]') : null;
  if (item) openProductModal(item.dataset.product);
});
