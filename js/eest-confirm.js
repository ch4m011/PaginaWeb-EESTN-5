/**
 * eest-confirm.js
 * ---------------------------------------------------------------
 * Reemplazo del confirm() nativo del navegador (el que muestra
 * "localhost dice...") por un modal propio, con el mismo estilo
 * visual que el resto del sitio.
 *
 * Uso:
 *   const ok = await eestConfirm('¿Eliminar la noticia "X"?');
 *   if (!ok) return;
 *
 * Con opciones:
 *   const ok = await eestConfirm('¿Eliminar tu cuenta?', {
 *     titulo: 'Esta acción no se puede deshacer',
 *     textoConfirmar: 'Eliminar',
 *     textoCancelar: 'Cancelar',
 *     peligroso: true // botón de confirmar en rojo
 *   });
 * ---------------------------------------------------------------
 */
(function () {
  // Evitar registrar todo dos veces si el script se incluye por error más de una vez
  if (window.eestConfirm) return;

  let overlayEl = null;

  function crearOverlaySiHaceFalta() {
    if (overlayEl) return overlayEl;

    overlayEl = document.createElement('div');
    overlayEl.className = 'eest-confirm-overlay';
    overlayEl.innerHTML = `
      <div class="eest-confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="eestConfirmTitulo" aria-describedby="eestConfirmMensaje">
        <div class="eest-confirm-icon">⚠️</div>
        <h3 class="eest-confirm-titulo" id="eestConfirmTitulo"></h3>
        <p class="eest-confirm-mensaje" id="eestConfirmMensaje"></p>
        <div class="eest-confirm-botones">
          <button type="button" class="eest-confirm-btn eest-confirm-btn--cancelar"></button>
          <button type="button" class="eest-confirm-btn eest-confirm-btn--confirmar"></button>
        </div>
      </div>
    `;
    document.body.appendChild(overlayEl);
    return overlayEl;
  }

  window.eestConfirm = function (mensaje, opciones) {
    opciones = opciones || {};
    const titulo = opciones.titulo || 'Confirmar acción';
    const textoConfirmar = opciones.textoConfirmar || 'Confirmar';
    const textoCancelar = opciones.textoCancelar || 'Cancelar';
    const peligroso = opciones.peligroso !== false; // por defecto, rojo (la mayoría son eliminaciones)

    return new Promise((resolve) => {
      const overlay = crearOverlaySiHaceFalta();
      const modal = overlay.querySelector('.eest-confirm-modal');
      const btnCancelar = overlay.querySelector('.eest-confirm-btn--cancelar');
      const btnConfirmar = overlay.querySelector('.eest-confirm-btn--confirmar');

      overlay.querySelector('#eestConfirmTitulo').textContent = titulo;
      overlay.querySelector('#eestConfirmMensaje').textContent = mensaje || '¿Estás seguro?';
      btnCancelar.textContent = textoCancelar;
      btnConfirmar.textContent = textoConfirmar;
      btnConfirmar.classList.toggle('eest-confirm-btn--peligro', peligroso);

      function cerrar(resultado) {
        overlay.classList.remove('show');
        document.removeEventListener('keydown', onKeyDown);
        // Esperar a que termine la transición antes de sacar el foco del DOM visual
        setTimeout(() => resolve(resultado), 150);
      }

      function onKeyDown(e) {
        if (e.key === 'Escape') cerrar(false);
        if (e.key === 'Enter') cerrar(true);
      }

      btnCancelar.onclick = () => cerrar(false);
      btnConfirmar.onclick = () => cerrar(true);
      overlay.onclick = (e) => {
        if (e.target === overlay) cerrar(false);
      };
      document.addEventListener('keydown', onKeyDown);

      // Mostrar con una transición suave
      overlay.classList.add('show');
      requestAnimationFrame(() => btnConfirmar.focus());
    });
  };
})();
