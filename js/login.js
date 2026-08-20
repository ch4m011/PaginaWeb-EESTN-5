// js/login.js
// Versión corregida: usa solo la API PHP (iniciar_sesion.php), sin usuarios.json.
// Funcionalidades:
// - Validaciones de formulario
// - Fetch a iniciar_sesion.php (POST FormData)
// - Manejo de respuesta JSON { success: bool, message: string, user?: {...}, redirect?: url }
// - Google Sign-In handler (parseJwt + uso de iniciar_sesion si querés adaptar)
// - Toggle ver/ocultar contraseña
// - Mensajes en #loginMessage

(function () {
  'use strict';

  // ----------------------
  // Helpers
  // ----------------------
  function qs(id) {
    return document.getElementById(id);
  }

  function showMessage(text, type = 'error') {
    // type: 'error'|'ok'|'info'
    const el = qs('loginMessage') || qs('mensaje') || null;
    if (!el) {
      // fallback
      console[type === 'ok' ? 'log' : 'error']('[login] ' + text);
      return;
    }
    el.textContent = text;
    el.className = 'mensaje ' + (type === 'ok' ? 'ok' : 'error');
    el.style.display = 'block';
  }

  function clearMessage() {
    const el = qs('loginMessage') || qs('mensaje') || null;
    if (!el) return;
    el.textContent = '';
    el.style.display = 'none';
    el.className = 'mensaje';
  }

  function parseJwt(token) {
    try {
      let base64Url = token.split('.')[1];
      if (!base64Url) return null;
      let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      let jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('parseJwt error', e);
      return null;
    }
  }

  // ----------------------
  // Main init on DOM ready
  // ----------------------
  document.addEventListener('DOMContentLoaded', function () {
    // Form and elements (match login.html)
    const form = qs('loginForm') || document.querySelector('form');
    const usernameInput = qs('username');
    const passwordInput = qs('password');
    const msgEl = qs('loginMessage') || qs('mensaje');

    if (!form) {
      console.error('login.js: formulario no encontrado. Asegurate que exista <form id="loginForm">');
      if (msgEl) msgEl.textContent = 'Error: formulario no encontrado';
      return;
    }

    // limpiar mensaje previo al tipeo
    Array.from(form.querySelectorAll('input')).forEach(i => {
      i.addEventListener('input', function () {
        if (msgEl) msgEl.style.display = 'none';
      });
    });

    // Toggle ver/ocultar contraseña (si existe el elemento toggle)
    const togglePassword = qs('togglePassword');
    if (togglePassword && passwordInput) {
      togglePassword.addEventListener('click', function () {
        const isPwd = passwordInput.getAttribute('type') === 'password';
        passwordInput.setAttribute('type', isPwd ? 'text' : 'password');

        // si tenés iconos .eye-open / .eye-closed dentro de togglePassword, los manejamos
        const eyeOpen = togglePassword.querySelector('.eye-open');
        const eyeClosed = togglePassword.querySelector('.eye-closed');
        if (eyeOpen && eyeClosed) {
          eyeOpen.style.opacity = isPwd ? '0' : '1';
          eyeClosed.style.opacity = isPwd ? '1' : '0';
        }
      });
    }

    // Submit handler: manda username + password a iniciar_sesion.php
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      clearMessage();

      const username = (usernameInput && usernameInput.value || '').trim();
      const password = (passwordInput && passwordInput.value) || '';

      if (!username) {
        if (usernameInput) {
          usernameInput.focus();
        }
        showMessage('Por favor ingresa usuario o correo.', 'error');
        return;
      }
      if (!password) {
        if (passwordInput) passwordInput.focus();
        showMessage('Por favor ingresa la contraseña.', 'error');
        return;
      }

      // Construir FormData exactamente como espera tu PHP
      const fd = new FormData();
      fd.append('username', username);
      fd.append('password', password);

      // URL absoluta basada en how your project is hosted (confirmed)
      // Ajustá solo si la ruta cambia en tu entorno de despliegue
      const loginUrl = `${location.origin}/web-escolar/php/loginphp/iniciar_sesion.php`;

      try {
        // Opciones: same-origin para cookies/sesiones
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
          // Si el servidor devolvió HTML o mensaje, lo mostramos en consola para debug
          console.error('Respuesta inválida desde servidor:', text);
          showMessage('Respuesta inválida del servidor. Revisa consola.', 'error');
          return;
        }

        // data esperado: { success: true/false, message: "...", user?: {...}, redirect?: "...." }
        if (data && data.success) {
          showMessage(data.message || 'Inicio de sesión correcto', 'ok');

          // Si el servidor nos devuelve info del usuario, guardarla localmente (sin contraseña)
          if (data.user && typeof data.user === 'object') {
            try {
              const safeUser = {
                id: data.user.id,
                nombre: data.user.nombre || data.user.name || null,
                correo: data.user.correo || data.user.email || null,
                rol: data.user.rol || null
              };
              localStorage.setItem('usuarioSesion', JSON.stringify(safeUser));
            } catch (e) {
              console.warn('No se pudo guardar usuario en localStorage', e);
            }
          }

          // redirigir si el servidor manda una ruta, si no, al index
          const redirectTo = data.redirect || '/index.html';
          setTimeout(function () {
            window.location.href = redirectTo;
          }, 500);
        } else {
          // muestra el mensaje de error del servidor o genérico
          showMessage((data && data.message) ? data.message : 'Usuario o contraseña incorrectos', 'error');
        }
      } catch (fetchErr) {
        console.error('Error fetch login:', fetchErr);
        showMessage('Error de conexión con el servidor. Intenta nuevamente.', 'error');
      }
    });
  });

  // ----------------------
  // Google Sign-In handler
  // ----------------------
  // Esta función la configura el script de Google: data-callback="handleCredentialResponse"
  // parseJwt() arriba puede decodificar el token y extraer email.
  window.handleCredentialResponse = async function (response) {
    // Si querés, podés enviar el token al servidor para verificar y/o crear cuenta.
    // Aquí hacemos: parse token -> obtener email -> enviar a iniciar_sesion.php o a endpoint específico.
    const parsed = parseJwt(response.credential);
    if (!parsed || !parsed.email) {
      showMessage('Error verificando cuenta de Google', 'error');
      return;
    }
    const correo = parsed.email;

    // Preparamos FormData; en tu servidor podrías recibir un campo 'google_email' para verificar
    const fd = new FormData();
    fd.append('username', correo);
    fd.append('google_token', response.credential); // opcional, el servidor puede validar

    const loginUrl = `${location.origin}/web-escolar/php/loginphp/iniciar_sesion.php`;

    try {
      const resp = await fetch(loginUrl, {
        method: 'POST',
        body: fd,
        credentials: 'same-origin',
        cache: 'no-store'
      });
      const text = await resp.text();
      let data;
      try { data = JSON.parse(text); } catch (e) { data = null; }

      if (data && data.success) {
        showMessage(data.message || 'Inicio de sesión con Google correcto', 'ok');
        if (data.user) {
          try {
            const safeUser = {
              id: data.user.id,
              nombre: data.user.nombre || null,
              correo: data.user.correo || null,
              rol: data.user.rol || null
            };
            localStorage.setItem('usuarioSesion', JSON.stringify(safeUser));
          } catch (e) { /* ignore */ }
        }
        setTimeout(() => {
          window.location.href = data.redirect || '/index.html';
        }, 500);
      } else {
        showMessage((data && data.message) ? data.message : 'No existe una cuenta vinculada a este Google', 'error');
      }
    } catch (err) {
      console.error('Error Google login fetch:', err);
      showMessage('Error al verificar la cuenta de Google.', 'error');
    }
  };

  async function handleGoogleSignIn(response) {
    try {
        const result = await fetch('php/loginphp/google_login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                credential: response.credential
            })
        });

        const data = await result.json();
        
        if (data.success) {
            // Guardar en localStorage para "recordar" al usuario
            localStorage.setItem('userEmail', data.correo);
            localStorage.setItem('authType', 'google');
            window.location.href = 'index.html';
        } else {
            mostrarError(data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarError('Error al procesar el inicio de sesión con Google');
    }
}

// Función para verificar si hay una sesión guardada
function checkSavedSession() {
    const savedEmail = localStorage.getItem('userEmail');
    const authType = localStorage.getItem('authType');

    if (savedEmail && authType) {
        // Intentar inicio de sesión automático según el tipo
        if (authType === 'google') {
            // Trigger Google Sign-In
            google.accounts.id.prompt();
        }
    }
}
})();
