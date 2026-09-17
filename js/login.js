// js/login.js
// Inicio de sesión manual + mensajes dentro de la página.
(function () {
  'use strict';

  function qs(id) { return document.getElementById(id); }

  function showMessage(text, type = 'error') {
    const el = qs('loginMessage') || qs('mensaje');
    if (!el) return;
    el.textContent = text || 'Ocurrió un error.';
    el.className = 'mensaje ' + (type === 'ok' ? 'ok' : 'error');
    el.style.display = 'block';
  }

  function clearMessage() {
    const el = qs('loginMessage') || qs('mensaje');
    if (!el) return;
    el.textContent = '';
    el.style.display = 'none';
    el.className = 'mensaje';
  }

  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('parseJwt:', e);
      return null;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    const form = qs('loginForm');
    const usernameInput = qs('username');
    const passwordInput = qs('password');
    const msgEl = qs('loginMessage') || qs('mensaje');

    if (!form) return;

    form.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', clearMessage);
    });

    const togglePassword = qs('togglePassword');
    if (togglePassword && passwordInput) {
      togglePassword.addEventListener('click', function () {
        const isPwd = passwordInput.type === 'password';
        passwordInput.type = isPwd ? 'text' : 'password';
        const eyeOpen = togglePassword.querySelector('.eye-open');
        const eyeClosed = togglePassword.querySelector('.eye-closed');
        if (eyeOpen) eyeOpen.style.opacity = isPwd ? '0' : '1';
        if (eyeClosed) eyeClosed.style.opacity = isPwd ? '1' : '0';
      });
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      clearMessage();

      const username = (usernameInput?.value || '').trim();
      const password = passwordInput?.value || '';

      if (!username) {
        showMessage('Ingresá tu usuario o correo electrónico.');
        usernameInput?.focus();
        return;
      }
      if (!password) {
        showMessage('Ingresá tu contraseña.');
        passwordInput?.focus();
        return;
      }

      const fd = new FormData();
      fd.append('username', username);
      fd.append('password', password);

      // Ruta correcta desde /html/login.html.
      const loginUrl = '../php/loginphp/iniciar_sesion.php';

      try {
        const resp = await fetch(loginUrl, {
          method: 'POST',
          body: fd,
          credentials: 'same-origin',
          cache: 'no-store'
        });

        const text = await resp.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error('Respuesta no JSON:', text);
          showMessage('El servidor devolvió una respuesta inválida. Revisá la conexión con la base de datos.');
          return;
        }

        if (!resp.ok || !data.success) {
          showMessage(data.message || data.error || 'Usuario o contraseña incorrectos.');
          return;
        }

        if (data.user) {
          localStorage.setItem('usuarioSesion', JSON.stringify({
            id: data.user.id,
            nombre: data.user.nombre || null,
            correo: data.user.correo || null,
            rol: data.user.rol || 'usuario'
          }));
        }

        showMessage(data.message || 'Inicio de sesión correcto.', 'ok');
        setTimeout(() => {
          window.location.href = data.redirect || '../html/index.html';
        }, 450);

      } catch (error) {
        console.error('Error de login:', error);
        showMessage('No se pudo conectar con el servidor. Verificá que Apache y MySQL estén iniciados.');
      }
    });
  });

  // Login con Google. El servidor es quien valida/crea la sesión.
  window.handleCredentialResponse = async function (response) {
    try {
      const result = await fetch('../php/loginphp/google_login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ credential: response.credential })
      });

      const text = await result.text();
      let data;
      try { data = JSON.parse(text); }
      catch { showMessage('El servidor devolvió una respuesta inválida al iniciar sesión con Google.'); return; }

      if (!result.ok || !data.success) {
        showMessage(data.message || data.error || 'No se pudo iniciar sesión con Google.');
        return;
      }

      if (data.user || data.correo) {
        const user = data.user || data;
        localStorage.setItem('usuarioSesion', JSON.stringify({
          id: user.id || null,
          nombre: user.nombre || 'Usuario',
          correo: user.correo || data.correo || '',
          rol: user.rol || data.rol || 'usuario'
        }));
      }
      window.location.href = '../html/index.html';
    } catch (err) {
      console.error('Google login:', err);
      showMessage('No se pudo procesar el inicio de sesión con Google.');
    }
  };
})();
