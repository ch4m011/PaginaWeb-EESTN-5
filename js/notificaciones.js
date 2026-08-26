/* ==============================================
   Archivo agregado por SL
   ============================================== */

/* ==============================================
   SISTEMA DE NOTIFICACIONES EEST5
   Reemplaza a alert()/confirm() nativos del navegador.

   Uso:
     mostrarNotificacion('Perfil actualizado', 'success');
     mostrarNotificacion('Ocurrió un error', 'error');

     const ok = await mostrarConfirmacion('¿Eliminar este elemento?');
     if (!ok) return;
   ============================================== */

(function () {
  function getContenedor() {
    let contenedor = document.getElementById('notificaciones-container');
    if (!contenedor) {
      contenedor = document.createElement('div');
      contenedor.id = 'notificaciones-container';
      document.body.appendChild(contenedor);
    }
    return contenedor;
  }

  // tipo: 'success' | 'error' | 'info' | 'warning'
  function mostrarNotificacion(mensaje, tipo) {
    tipo = tipo || 'info';
    const contenedor = getContenedor();

    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;
    notificacion.innerHTML = `
      <div class="notificacion-titulo">🔔 EEST5</div>
      <div class="notificacion-mensaje"></div>
    `;
    notificacion.querySelector('.notificacion-mensaje').textContent = mensaje;
    contenedor.appendChild(notificacion);

    setTimeout(() => {
      notificacion.classList.add('fadeout');
      setTimeout(() => notificacion.remove(), 300);
    }, 3500);
  }

  // Devuelve una Promise<boolean> — reemplazo de confirm()
  function mostrarConfirmacion(mensaje, opciones) {
    opciones = opciones || {};
    const textoAceptar = opciones.textoAceptar || 'Aceptar';
    const textoCancelar = opciones.textoCancelar || 'Cancelar';

    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.id = 'eest5-confirm-overlay';
      overlay.innerHTML = `
        <div class="eest5-confirm-box">
          <div class="eest5-confirm-header">🔔 EEST5</div>
          <div class="eest5-confirm-body"></div>
          <div class="eest5-confirm-footer">
            <button type="button" class="eest5-confirm-btn cancelar">${textoCancelar}</button>
            <button type="button" class="eest5-confirm-btn aceptar">${textoAceptar}</button>
          </div>
        </div>
      `;
      overlay.querySelector('.eest5-confirm-body').textContent = mensaje;
      document.body.appendChild(overlay);

      function cerrar(resultado) {
        overlay.remove();
        resolve(resultado);
      }

      overlay.querySelector('.aceptar').addEventListener('click', () => cerrar(true));
      overlay.querySelector('.cancelar').addEventListener('click', () => cerrar(false));
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) cerrar(false);
      });
      document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') {
          document.removeEventListener('keydown', escHandler);
          cerrar(false);
        }
      });
    });
  }

  window.mostrarNotificacion = mostrarNotificacion;
  window.mostrarConfirmacion = mostrarConfirmacion;
})();
