// ===== FORMULARIO DE CONTACTO =====
// El sitio es estatico y no tiene donde recibir el formulario: al enviar se
// abre el programa de correo del visitante con la consulta ya escrita, dirigida
// a Administracion@evolutek.pe. Si algun dia se conecta un servicio de
// formularios, el cambio va solo en enviar().
(function () {
  const DESTINO = 'Administracion@evolutek.pe';
  const handlers = new WeakMap();

  function valor(form, nombre) {
    const campo = form.elements[nombre];
    return campo ? campo.value.trim() : '';
  }

  function componerCorreo(form) {
    const nombre = valor(form, 'nombre');
    const empresa = valor(form, 'empresa');
    const asunto = 'Consulta desde la web: ' + empresa;
    const cuerpo = [
      valor(form, 'mensaje'),
      '',
      '--',
      'Nombre: ' + nombre,
      'Empresa: ' + empresa,
      'Correo: ' + valor(form, 'correo'),
      'Teléfono: ' + (valor(form, 'telefono') || '—')
    ].join('\n');
    return 'mailto:' + DESTINO +
      '?subject=' + encodeURIComponent(asunto) +
      '&body=' + encodeURIComponent(cuerpo);
  }

  function initContacto(root) {
    const form = root.querySelector('#contactoForm');
    // El router reinicia la pagina si se vuelve a pulsar la que ya esta
    // abierta: sin esta guarda, cada envio abriria el correo dos veces.
    if (!form || handlers.has(root)) return;
    const tarjeta = form.closest('.contacto-tarjeta');
    const enviado = tarjeta.querySelector('.contacto-enviado');
    const error = form.querySelector('.contacto-form__error');
    const otro = enviado.querySelector('.contacto-enviado__otro');

    function enviar(e) {
      e.preventDefault();
      form.classList.add('is-intentado');
      if (!form.checkValidity()) {
        error.hidden = false;
        const primero = form.querySelector(':invalid');
        if (primero) primero.focus();
        return;
      }
      error.hidden = true;
      window.location.href = componerCorreo(form);
      form.hidden = true;
      enviado.hidden = false;
      enviado.focus();
    }

    function volver() {
      enviado.hidden = true;
      form.hidden = false;
      form.querySelector('input').focus();
    }

    form.addEventListener('submit', enviar);
    otro.addEventListener('click', volver);
    handlers.set(root, function () {
      form.removeEventListener('submit', enviar);
      otro.removeEventListener('click', volver);
    });
  }

  function destroyContacto(root) {
    const quitar = handlers.get(root);
    if (quitar) { quitar(); handlers.delete(root); }
  }

  onPageInit(initContacto);
  onPageDestroy(destroyContacto);
})();
