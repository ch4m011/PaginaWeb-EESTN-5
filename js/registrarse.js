// js/registrarse.js
// Registro manual + Google. No usa alert(): los errores aparecen dentro del formulario.
(function () {
  'use strict';

  function showRegisterMessage(text, type = 'error') {
    const el = document.getElementById('registroMessage');
    if (!el) return;
    el.textContent = text || 'Ocurrió un error.';
    el.className = 'mensaje ' + (type === 'ok' ? 'ok' : 'error');
    el.style.display = 'block';
  }

  function clearRegisterMessage() {
    const el = document.getElementById('registroMessage');
    if (!el) return;
    el.textContent = '';
    el.style.display = 'none';
    el.className = 'mensaje';
  }

  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('formRegistro');
    if (!form) return;

    form.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', clearRegisterMessage);
    });

    // Ojitos de contraseña.
    form.querySelectorAll('.toggle-password').forEach(button => {
      button.addEventListener('click', function () {
        const input = button.closest('.password-wrapper')?.querySelector('input');
        if (!input) return;
        const isPwd = input.type === 'password';
        input.type = isPwd ? 'text' : 'password';
        const open = button.querySelector('.eye-open');
        const closed = button.querySelector('.eye-closed');
        if (open) open.style.opacity = isPwd ? '0' : '1';
        if (closed) closed.style.opacity = isPwd ? '1' : '0';
      });
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      clearRegisterMessage();

      const nombre = document.getElementById('nombre')?.value.trim() || '';
      const correo = document.getElementById('correo')?.value.trim() || '';
      const password = document.getElementById('password')?.value || '';
      const confirmar = document.getElementById('confirmar')?.value || '';
      const celular = document.getElementById('celular')?.value.trim() || '';

      if (!nombre) return showRegisterMessage('Ingresá tu nombre completo.');
      if (!correo) return showRegisterMessage('Ingresá tu correo electrónico.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return showRegisterMessage('El correo electrónico no tiene un formato válido.');
      if (password.length < 6) return showRegisterMessage('La contraseña debe tener al menos 6 caracteres.');
      if (password !== confirmar) return showRegisterMessage('Las contraseñas no coinciden.');

      const btn = form.querySelector('.btn-registrar');
      if (btn) { btn.disabled = true; btn.textContent = 'Creando cuenta...'; }

      try {
        const response = await fetch('../php/registrar_usuario.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ nombre, correo, password, celular })
        });

        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error('Respuesta no JSON:', text);
          showRegisterMessage('El servidor devolvió una respuesta inválida. Revisá la conexión con la base de datos.');
          return;
        }

        if (!response.ok || !data.success) {
          showRegisterMessage(data.message || data.error || 'No se pudo crear la cuenta.');
          return;
        }

        if (data.user) localStorage.setItem('usuarioSesion', JSON.stringify(data.user));
        showRegisterMessage(data.message || 'Cuenta creada correctamente.', 'ok');

        // La sesión ya quedó creada en PHP; volvemos al inicio.
        setTimeout(() => { window.location.href = '../html/index.html'; }, 650);

      } catch (error) {
        console.error('Error en el registro:', error);
        showRegisterMessage('No se pudo conectar con el servidor. Verificá que Apache y MySQL estén iniciados.');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Registrarte'; }
      }
    });
  });

  // Google Sign-In en la pantalla de registro.
  window.handleGoogleSignIn = async function (response) {
    try {
      if (!response?.credential) throw new Error('Google no devolvió las credenciales.');

      const payload = typeof jwt_decode === 'function' ? jwt_decode(response.credential) : null;
      if (payload) {
        const nombre = document.getElementById('nombre');
        const correo = document.getElementById('correo');
        if (nombre) { nombre.value = payload.name || ''; nombre.readOnly = true; }
        if (correo) { correo.value = payload.email || ''; correo.readOnly = true; }
      }

      const result = await fetch('../php/registro_google.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ credential: response.credential })
      });

      const text = await result.text();
      let data;
      try { data = JSON.parse(text); }
      catch { showRegisterMessage('El servidor devolvió una respuesta inválida al procesar Google.'); return; }

      if (!result.ok || !data.success) {
        showRegisterMessage(data.message || data.error || 'No se pudo completar el registro con Google.');
        return;
      }

      if (data.user) localStorage.setItem('usuarioSesion', JSON.stringify(data.user));
      showRegisterMessage(data.message || 'Cuenta de Google vinculada correctamente.', 'ok');
      setTimeout(() => { window.location.href = '../html/index.html'; }, 650);

    } catch (error) {
      console.error('Google registro:', error);
      showRegisterMessage(error.message || 'No se pudo procesar el registro con Google.');
    }
  };
})();
