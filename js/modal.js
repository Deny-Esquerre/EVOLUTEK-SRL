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

const PRIVACY_KEY = 'evolutek-privacy-consent';

function hideConsentBar() {
  const bar = document.getElementById('consentBar');
  if (bar) bar.classList.remove('show');
}

function acceptPrivacy() {
  try { localStorage.setItem(PRIVACY_KEY, 'accepted'); } catch (e) {}
  hideConsentBar();
}

function denyPrivacy() {
  try { localStorage.setItem(PRIVACY_KEY, 'denied'); } catch (e) {}
  hideConsentBar();
}

// Muestra la barra de consentimiento al entrar, si aún no se ha decidido.
onReady(function () {
  let decided = null;
  try { decided = localStorage.getItem(PRIVACY_KEY); } catch (e) {}
  const bar = document.getElementById('consentBar');
  if (bar && !decided) bar.classList.add('show');
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
