// js/recuperar_contrasena.js
// Usado por html/olvide_contrasena.html y html/restablecer_contrasena.html
'use strict';

(function () {
  const $ = (id) => document.getElementById(id);

  function msg(text, type) {
    const el = $('recMessage');
    if (!el) return;
    el.textContent = text;
    el.className = 'mensaje ' + (type === 'ok' ? 'ok' : 'error');
    el.style.display = 'block';
  }

  function validarPassword(p) {
    if (p.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    if (!/[a-z]/.test(p)) return 'La contraseña debe contener al menos una letra minúscula.';
    if (!/[A-Z]/.test(p)) return 'La contraseña debe contener al menos una letra mayúscula.';
    if (!/[0-9]/.test(p)) return 'La contraseña debe contener al menos un número.';
    if (!/[^a-zA-Z0-9]/.test(p)) return 'La contraseña debe contener al menos un carácter especial.';
    return '';
  }

  async function post(url, data) {
    const resp = await fetch(url, { method: 'POST', body: new URLSearchParams(data), cache: 'no-store' });
    const text = await resp.text();
    try { return JSON.parse(text); }
    catch { console.error(text); return { success: false, message: 'Respuesta inválida del servidor.' }; }
  }

  // Ojito para mostrar/ocultar contraseña (mismo ícono que el login)
  function activarOjitos() {
    document.querySelectorAll('.toggle-password').forEach((btn) => {
      const input = btn.closest('.password-wrapper')?.querySelector('input');
      const abierto = btn.querySelector('.eye-open');
      const cerrado = btn.querySelector('.eye-closed');
      if (!input) return;
      if (abierto) abierto.style.display = 'block';
      if (cerrado) cerrado.style.display = 'none';
      btn.addEventListener('click', () => {
        const oculta = input.type === 'password';
        input.type = oculta ? 'text' : 'password';
        if (abierto) abierto.style.display = oculta ? 'none' : 'block';
        if (cerrado) cerrado.style.display = oculta ? 'block' : 'none';
        btn.setAttribute('aria-label', oculta ? 'Ocultar contraseña' : 'Mostrar contraseña');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    activarOjitos();
    // ---- Paso 1: pedir el link ----
    const formPedir = $('pedirForm');
    if (formPedir) {
      formPedir.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = formPedir.querySelector('button[type=submit]');
        btn.disabled = true;
        const r = await post('../php/recuperar/solicitar_recuperacion.php', { email: $('email').value.trim() });
        msg(r.message, r.success ? 'ok' : 'error');
        btn.disabled = false;
      });
    }

    // ---- Paso 2: nueva contraseña ----
    const formNueva = $('nuevaForm');
    if (formNueva) {
      const token = new URLSearchParams(location.search).get('token') || '';
      try {
        const chk = await fetch('../php/recuperar/restablecer_contrasena.php?token=' + encodeURIComponent(token));
        const d = await chk.json();
        if (!d.success) { formNueva.style.display = 'none'; msg(d.message, 'error'); return; }
      } catch { /* si falla la comprobación, se valida igual al enviar */ }

      formNueva.addEventListener('submit', async (e) => {
        e.preventDefault();
        const p1 = $('password').value, p2 = $('password2').value;
        const errPass = validarPassword(p1);
        if (errPass) return msg(errPass, 'error');
        if (p1 !== p2) return msg('Las contraseñas no coinciden.', 'error');
        const btn = formNueva.querySelector('button[type=submit]');
        btn.disabled = true;
        const r = await post('../php/recuperar/restablecer_contrasena.php', { token, password: p1 });
        msg(r.message, r.success ? 'ok' : 'error');
        if (r.success) setTimeout(() => { location.href = 'login.html'; }, 1800);
        else btn.disabled = false;
      });
    }
  });
})();
