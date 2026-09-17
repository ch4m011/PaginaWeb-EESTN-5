document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const resultEl = document.getElementById('contactResult');
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submitBtn) submitBtn.disabled = true;
    if (resultEl) {
      resultEl.textContent = 'Enviando mensaje...';
      resultEl.style.color = '#555';
    }

    const formData = new FormData(form);

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
        headers: { 'Accept': 'application/json' }
      });

      const text = await res.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch (err) {
        // respuesta no JSON; lo tratamos como texto
      }

      if (!data) {
        const msg = text.trim() || (res.ok ? 'Enviado correctamente' : 'Error del servidor');
        if (resultEl) {
          resultEl.textContent = msg;
          resultEl.style.color = res.ok ? 'green' : 'red';
        }
        if (res.ok) form.reset();
      } else {
        // Mostrar mensaje especial si no está autenticado
        if (data.message && (data.message.includes('No autenticado') || data.message.includes('Conexión DB no inicializada'))) {
          resultEl.textContent = 'Inicie sesión para enviar mensajes.';
          resultEl.style.color = 'red';
        } else {
          resultEl.textContent = data.message || (data.status === 'ok' ? 'Enviado correctamente' : 'Ocurrió un error');
          // Si el backend guardó el mensaje pero el correo no salió (mail_enviado === false),
          // avisamos en rojo aunque el status general sea 'ok', para no dar una falsa sensación de éxito.
          const correoFallo = (data.mail_enviado === false);
          resultEl.style.color = correoFallo ? 'red' : ((data.status === 'ok' || data.status === 'success') ? 'green' : 'red');
          if (correoFallo) console.warn('El correo no se envió:', data.mail_error);
        }
        if (data.status === 'ok' || data.status === 'success') form.reset();
      }
    } catch (err) {
      console.error('Error enviando mensaje:', err);
      if (resultEl) {
        resultEl.textContent = 'Error de red o servidor.';
        resultEl.style.color = 'red';
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
});


