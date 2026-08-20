
// panel_escritor.js (limpio)
// Implementa un único flujo para crear/editar noticias y subir imágenes.

(function () {
  'use strict';

  // Estado simple
  let currentUserId = 0;
  let sessionCorreo = null;

  // Helper para escapar texto seguro en templates
  function escapeHtml(s) {
    if (s === undefined || s === null) return '';
    return String(s).replace(/[&<>"]+/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  }

  // Obtener usuario de sesión (server-side) — no confiar en localStorage
  async function fetchSessionUser() {
    try {
      const res = await fetch('../php/check_session.php', { cache: 'no-store', credentials: 'same-origin' });
      if (!res.ok) return { user_id: 0, correo: null };
      const json = await res.json();
      return { user_id: parseInt(json.user_id || 0, 10) || 0, correo: json.correo || json.user_email || null };
    } catch (e) {
      console.warn('No fue posible obtener sesión:', e);
    }
    return { user_id: 0, correo: null };
  }

  // Cargar lista de noticias (usado por panel)
  async function cargarNoticiasPanel() {
    const list = document.getElementById('listaNoticias');
    if (!list) return;
    list.innerHTML = 'Cargando...';
    try {
      // Obtener noticias SOLO del usuario logueado (por id) o por correo (fallback)
      console.log('📋 [cargarNoticiasPanel] Starting. currentUserId=', currentUserId, 'sessionCorreo=', sessionCorreo);
      let noticias = [];
      if (currentUserId && currentUserId > 0) {
        console.log('📋 [cargarNoticiasPanel] Fetching by autor_id=', currentUserId);
        const res = await fetch(`../php/api_noticias.php?action=obtener_por_autor&autor_id=${currentUserId}`, { cache: 'no-store', credentials: 'same-origin' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        noticias = await res.json();
        console.log('📋 [cargarNoticiasPanel] Got', noticias.length, 'noticias by autor_id');
      } else if (sessionCorreo) {
        console.log('📋 [cargarNoticiasPanel] Fetching all noticias + filtering by correo=', sessionCorreo);
        const res = await fetch(`../php/api_noticias.php?action=obtener&limite=1000`, { cache: 'no-store', credentials: 'same-origin' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const all = await res.json();
        noticias = Array.isArray(all) ? all.filter(n => (n.autor_email || '').toLowerCase() === sessionCorreo.toLowerCase()) : [];
        console.log('📋 [cargarNoticiasPanel] Got', noticias.length, 'noticias by correo filter from', all.length, 'total');
      } else {
        console.log('❌ [cargarNoticiasPanel] No currentUserId and no sessionCorreo. Showing empty.');
        noticias = [];
      }
      if (!Array.isArray(noticias) || noticias.length === 0) {
        list.innerHTML = '<p>No has publicado noticias aún.</p>';
        return;
      }
      // Helper: quitar imágenes embebidas y obtener texto limpio para resumen
      function stripImagesFromHtml(html) {
        if (!html) return '';
        try {
          // Remover regex patterns primero
          let cleaned = html
            .replace(/<img[^>]*>/gi, '')
            .replace(/<div[^>]*style="[^"]*text-align[^"]*"[^>]*>.*?<\/div>/gi, '')
            .replace(/data:[^\"'\s>]+/gi, '');
          
          // Extraer texto
          const doc = new DOMParser().parseFromString(cleaned, 'text/html');
          const text = (doc.body.textContent || doc.body.innerText || '')
            .trim()
            .replace(/\s+/g, ' ')
            .substring(0, 150);
          
          return text || '';
        } catch (e) {
          return html
            .replace(/<img[^>]*>/gi, '')
            .replace(/<div[^>]*style="[^"]*text-align[^"]*"[^>]*>.*?<\/div>/gi, '')
            .replace(/data:[^\"'\s>]+/gi, '')
            .replace(/<[^>]+>/g, '')
            .trim()
            .replace(/\s+/g, ' ')
            .substring(0, 150);
        }
      }

      function textFromHtml(html, maxLength = 150) {
        if (!html) return '';
        try {
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const txt = doc.body.textContent || doc.body.innerText || '';
          return txt.trim().substring(0, maxLength);
        } catch (e) {
          // fallback: strip tags
          return html.replace(/<[^>]+>/g, '').trim().substring(0, maxLength);
        }
      }

      list.innerHTML = noticias.map(n => {
        // Nombre y foto del autor (usar utilidades del navbar si existen)
        let autorNombre = 'Anónimo';
        let autorFoto = (typeof getBasePath === 'function' ? normalizarRuta(getBasePath() + 'img_logo/logo-tecnica.png') : '../img_logo/logo-tecnica.png');
        if (typeof obtenerAutorNombre === 'function' && typeof obtenerAutorFoto === 'function') {
          try {
            autorNombre = obtenerAutorNombre(n);
            autorFoto = obtenerAutorFoto(n);
          } catch (e) {
            console.warn('Error usando utilidades del navbar en panel_escritor:', e);
            autorNombre = n.autor_nombre || (n.nombre ? `${n.nombre}${n.apellido ? ' ' + n.apellido : ''}` : 'Anónimo');
            if (n.imagen_perfil) {
              try {
                if (typeof getBasePath === 'function' && typeof normalizarRuta === 'function') {
                  autorFoto = normalizarRuta(getBasePath() + n.imagen_perfil);
                } else {
                  autorFoto = `../img/perfiles/${n.imagen_perfil}`;
                }
              } catch (e2) {
                autorFoto = `../img/perfiles/${n.imagen_perfil}`;
              }
            }
          }
        } else {
          autorNombre = n.autor_nombre || (n.nombre ? `${n.nombre}${n.apellido ? ' ' + n.apellido : ''}` : 'Anónimo');
          if (n.imagen_perfil) {
            try {
              if (typeof getBasePath === 'function' && typeof normalizarRuta === 'function') {
                autorFoto = normalizarRuta(getBasePath() + n.imagen_perfil);
              } else {
                autorFoto = `../img/perfiles/${n.imagen_perfil}`;
              }
            } catch (e) {
              autorFoto = `../img/perfiles/${n.imagen_perfil}`;
            }
          }
        }
        // Normalizar ruta de la imagen si existe (soporta rutas absolutas, relativas y php/uploads)
        const fallbackAvatar = (typeof getBasePath === 'function' ? normalizarRuta(getBasePath() + 'img_logo/logo-tecnica.png') : '../img_logo/logo-tecnica.png');
        const fallbackNoImage = (typeof getBasePath === 'function' ? normalizarRuta(getBasePath() + 'img/sin_imagen.png') : '../img/sin_imagen.png');
        let imgSrc;
        try {
          if (n.imagen && String(n.imagen).trim() !== '') {
            if (typeof normalizarRuta === 'function' && typeof getBasePath === 'function') {
              imgSrc = n.imagen.startsWith('/') ? normalizarRuta(n.imagen) : normalizarRuta(getBasePath() + n.imagen);
            } else {
              imgSrc = n.imagen.startsWith('/') ? n.imagen : `../${n.imagen}`;
            }
            imgSrc += (imgSrc.includes('?') ? '&' : '?') + 'v=' + Date.now();
          } else {
            imgSrc = fallbackNoImage;
          }
        } catch (e) {
          console.warn('[panel_escritor] Error al resolver imagen:', e);
          imgSrc = fallbackNoImage;
        }
        // Nuevo diseño: mostrar imagen grande y el contenido completo (sin quitar imágenes embebidas)
        return `
        <div class="noticia-item noticia-full" style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; background: #fdfdfd;">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            <img src="${escapeHtml(autorFoto)}" alt="${escapeHtml(autorNombre)}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
            <span style="font-weight: bold; font-size: 14px;">${escapeHtml(autorNombre)}</span>
          </div>
          <h4>${escapeHtml(n.titulo)}</h4>
          <div class="noticia-imagen" style="margin:10px 0;">
            <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(n.titulo)}" style="width:100%; max-height:360px; object-fit:cover; border-radius:6px; display:block;" onerror="this.onerror=null;this.src='${escapeHtml(fallbackNoImage)}';">
          </div>
          <div class="noticia-contenido" style="color:#222;line-height:1.6;">
            ${stripImagesFromHtml(n.contenido || '')}
          </div>
          <small>📅 ${new Date(n.fecha_creacion).toLocaleDateString()}</small>
          <div class="noticia-actions" style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
            <button class="btn-view" onclick="verNoticia(${n.id})" type="button">👁️ Ver</button>
            <button class="btn-edit" onclick="editarNoticia(${n.id})" type="button">✏️ Editar</button>
            <button class="btn-delete" onclick="eliminarNoticia(${n.id})" type="button">🗑️ Eliminar</button>
          </div>
        </div>
      `}).join('');
    } catch (err) {
      console.error('Error cargarNoticiasPanel:', err);
      list.innerHTML = '<p class="error">Error al cargar noticias</p>';
    }
  }

  // Eliminar noticia (soft)
  async function eliminarNoticia(id) {
    if (!confirm('¿Seguro?')) return;
    try {
      const res = await fetch('../php/api_noticias.php?action=eliminar', {
          method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id })
        });
        let j;
        try {
          const text = await res.text();
          j = text ? JSON.parse(text) : {};
        } catch (e) {
          console.error('Respuesta no-JSON de eliminarNoticia:', await res.text());
          throw new Error('Respuesta inválida del servidor');
        }
      if (j.success) {
        alert('✅ Eliminada');
        cargarNoticiasPanel();
      } else throw new Error(j.error || 'Error');
    } catch (e) { console.error('eliminarNoticia:', e); alert('Error al eliminar'); }
  }

  // Cargar noticia para editar y rellenar el formulario
  async function editarNoticia(id) {
    try {
        const res = await fetch('../php/noticias.php', { credentials: 'same-origin' });
        const noticias = await res.json();
      const noticia = noticias.find(n => n.id == id);
      if (!noticia) { alert('Noticia no encontrada'); return; }
      const form = document.getElementById('formNoticia');
      if (!form) return;
      form.dataset.idEditar = noticia.id;
      form.dataset.imagenAnterior = noticia.imagen || '';
      form.querySelector('#tituloNoticia').value = noticia.titulo || '';
      document.getElementById('editor').innerHTML = noticia.contenido || '';
      const vista = document.getElementById('previewImagen');
      if (vista && noticia.imagen) { vista.src = noticia.imagen.startsWith('/') ? noticia.imagen : `../${noticia.imagen}`; vista.style.display = 'block'; }
      // Preseleccionar tipo de noticia en el formulario (si existe)
      try {
        if (noticia.tipo) {
          const radio = document.querySelector(`input[name="tipoNoticia"][value="${noticia.tipo}"]`);
          if (radio) radio.checked = true;
        }
      } catch (e) { /* ignore */ }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) { console.error('editarNoticia:', e); alert('Error al cargar noticia'); }
  }

  // Subir imagen y devolver la URL del servidor
  async function subirImagen(file) {
    const fd = new FormData();
    fd.append('imagen', file);
    const res = await fetch('../php/api_upload_imagen.php', { method: 'POST', body: fd, credentials: 'same-origin' });
    // manejar caso donde el servidor devuelva HTML (error)
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('Respuesta no-JSON de api_upload_imagen.php:', text);
      return { success: false, error: 'Respuesta inválida del servidor' };
    }
  }

  // Inicializar form y handlers únicos
  document.addEventListener('DOMContentLoaded', async () => {
    const session = await fetchSessionUser();
    console.log('🔍 [panel_escritor] Session fetch result:', session);
    currentUserId = session.user_id || parseInt(localStorage.getItem('user_id') || 0, 10) || 0;
    sessionCorreo = session.correo || null;
    console.log('🔍 [panel_escritor] After parse: currentUserId=', currentUserId, 'sessionCorreo=', sessionCorreo);

    // Cargar eventos del calendario filtrados por el autor actual (igual que hacemos con noticias)
    try {
      if (window.cargarEventos && (currentUserId && currentUserId > 0 || sessionCorreo)) {
        window.cargarEventos(true);
      }
    } catch (e) {
      console.warn('Error al cargar eventos filtrados por autor:', e);
    }

    const form = document.getElementById('formNoticia');
    const inputImagen = document.getElementById('imagenNoticia');
    const preview = document.getElementById('previewImagen');
    const editor = document.getElementById('editor');

    // Preview imagen
    if (inputImagen && preview) {
      inputImagen.addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        if (f) {
          const r = new FileReader();
          r.onload = ev => { preview.src = ev.target.result; preview.style.display = 'block'; };
          r.readAsDataURL(f);
        } else { preview.src = ''; preview.style.display = 'none'; }
      });
    }

    // Función para inicializar toolbar (se llama aquí y después del clon)
    function initToolbar() {
      // Botones con data-cmd (negrita, cursiva, subrayado, justificación)
      document.querySelectorAll('.editor-toolbar button[data-cmd]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const cmd = btn.dataset.cmd;

          // Detectar si la selección actual incluye o apunta a una imagen
          let img = null;
          try {
            const sel = window.getSelection();
            if (sel && sel.rangeCount) {
              const range = sel.getRangeAt(0);
              let node = range.startContainer;
              if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
              if (node && node.tagName === 'IMG') {
                img = node;
              } else {
                const common = range.commonAncestorContainer;
                let el = (common.nodeType === 1) ? common : common.parentElement;
                if (el) {
                  if (el.tagName === 'IMG') img = el;
                  else img = el.querySelector && el.querySelector('img');
                }
              }
            }
          } catch (err) {
            console.warn('Error detectando selección:', err);
          }

          // Si no se detectó imagen por selección, usar último click conocido (compatibilidad)
          if (!img && window.__lastEditorImage) {
            img = window.__lastEditorImage;
          }

          // Si hay una imagen y el comando es de alineación, manejarla explícitamente
          if (img && (cmd === 'justifyleft' || cmd === 'justifycenter' || cmd === 'justifyright')) {
            if (cmd === 'justifyleft') {
              img.classList.remove('float-right');
              img.classList.add('float-left');
              img.style.float = 'left';
              img.style.display = '';
              img.style.margin = '0.5rem 1rem 0.5rem 0';
            } else if (cmd === 'justifyright') {
              img.classList.remove('float-left');
              img.classList.add('float-right');
              img.style.float = 'right';
              img.style.display = '';
              img.style.margin = '0.5rem 0 0.5rem 1rem';
            } else if (cmd === 'justifycenter') {
              img.classList.remove('float-left', 'float-right');
              img.style.float = 'none';
              img.style.display = 'block';
              img.style.margin = '1rem auto';
            }
            editor && editor.focus();
            return;
          }

          // Fallback: aplicar execCommand como antes
          document.execCommand(cmd, false, null);
          editor && editor.focus();
        });
      });

      // Selector de tamaño de fuente (si hay imagen seleccionada, ajusta su ancho)
      const fontSizeSelect = document.getElementById('fontSizeSelect');
      if (fontSizeSelect) {
        fontSizeSelect.addEventListener('change', () => {
          const val = fontSizeSelect.value;
          if (!val) return;

          // mapping de valores de fontSize a porcentaje de ancho de imagen
          const sizeMap = { '1': '25%', '3': '50%', '5': '75%', '7': '100%' };

          // detectar imagen seleccionada preferente
          let img = window.__lastEditorImage || null;
          try {
            const sel = window.getSelection();
            if ((!img || img === null) && sel && sel.rangeCount) {
              const range = sel.getRangeAt(0);
              let node = range.startContainer;
              if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
              if (node && node.tagName === 'IMG') img = node;
              else {
                const common = range.commonAncestorContainer;
                let el = (common.nodeType === 1) ? common : common.parentElement;
                if (el) img = el.querySelector && el.querySelector('img');
              }
            }
          } catch (e) { /* ignore */ }

          if (img && sizeMap[val]) {
            img.style.width = sizeMap[val];
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            // asegurar que se centre si corresponde
            if (sizeMap[val] === '100%') {
              img.style.display = 'block';
              img.style.margin = '1rem auto';
            }
            fontSizeSelect.value = '';
            editor && editor.focus();
            return;
          }

          // Si no hay imagen seleccionada, fallback al fontSize para texto
          document.execCommand('fontSize', false, val);
          editor && editor.focus();
          fontSizeSelect.value = ''; // Reset select
        });
      }

      // Botón insertar enlace
      const insertLinkBtn = document.getElementById('insertLinkBtn');
      if (insertLinkBtn) {
        insertLinkBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const url = prompt('Ingresa la URL del enlace:', 'https://');
          if (url) {
            document.execCommand('createLink', false, url);
            editor && editor.focus();
          }
        });
      }

      // Botón insertar imagen
      const insertImageBtn = document.getElementById('insertImageBtn');
      const insertImageFile = document.getElementById('insertImageFile');
      if (insertImageBtn && insertImageFile) {
        insertImageBtn.addEventListener('click', (e) => {
          e.preventDefault();
          insertImageFile.click();
        });
        insertImageFile.addEventListener('change', (e) => {
          const file = e.target.files && e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              document.execCommand('insertImage', false, ev.target.result);
              editor && editor.focus();
            };
            reader.readAsDataURL(file);
          }
          insertImageFile.value = ''; // Reset
        });
      }
      // Atajo: Ctrl/Cmd+K para insertar enlace cuando el editor tenga foco
      const ed = document.getElementById('editor');
      if (ed) {
        ed.addEventListener('keydown', (e) => {
          const key = e.key || e.keyCode;
          if ((e.ctrlKey || e.metaKey) && (key === 'k' || key === 'K')) {
            e.preventDefault();
            const url = prompt('Ingresa la URL del enlace:', 'https://');
            if (url) {
              document.execCommand('createLink', false, url);
              ed.focus();
            }
          }
        });
      }
    }

    // Inicializar toolbar al cargar
    initToolbar();

    // Submit único
    if (form) {
      // Remove any previously attached handlers by cloning node (defensive)
      const clean = form.cloneNode(true);
      form.parentNode.replaceChild(clean, form);
      // Reinicializar toolbar después del clon
      initToolbar();
      clean.addEventListener('submit', async (ev) => {
        ev.preventDefault();
        try {
          // ⚠️ IMPORTANTE: Obtener referencias DESPUÉS del clone
          const editorLive = document.getElementById('editor');
          const inputImagenLive = document.getElementById('imagenNoticia');
          const titulo = (document.getElementById('tituloNoticia')?.value || '').trim();
          const contenidoHTML = (editorLive?.innerHTML || '');
          const contenidoText = (editorLive && typeof editorLive.textContent === 'string') ? editorLive.textContent.trim() : '';
          const resumen = (document.getElementById('resumenNoticia')?.value || '').trim();

          // Logs diagnósticos para entender por qué contenido puede venir vacío
          console.log('DEBUG editor element:', editorLive);
          console.log('DEBUG editor.innerHTML length:', contenidoHTML.length);
          console.log('DEBUG editor.textContent length:', contenidoText.length);
          console.log('DEBUG inputImagenLive:', inputImagenLive);
          console.log('DEBUG inputImagenLive.files length:', inputImagenLive?.files?.length || 0);

          if (!titulo) throw new Error('El título es obligatorio');
          // Considerar contenido válido si textContent tiene caracteres visibles
          if (!contenidoText || contenidoText.length === 0) throw new Error('El contenido es obligatorio');

          let imagenUrl = clean.dataset.imagenAnterior || null;

          // Si seleccionó archivo, subirlo
          if (inputImagenLive && inputImagenLive.files && inputImagenLive.files.length > 0) {
            console.log('📤 Subiendo imagen:', inputImagenLive.files[0].name);
            const r = await subirImagen(inputImagenLive.files[0]);
            console.log('📥 Respuesta subida:', r);
            if (!r || !r.success) throw new Error(r?.error || 'Error subiendo imagen');
            imagenUrl = r.imagen;
            console.log('✅ URL imagen guardada:', imagenUrl);
          }

          // Leer tipo de noticia (principal / secundaria) desde el formulario
          let tipoSeleccion = 'secundaria';
          try {
            const tipoInput = document.querySelector('input[name="tipoNoticia"]:checked');
            if (tipoInput && tipoInput.value) tipoSeleccion = tipoInput.value;
          } catch (e) { /* fallback */ }

          const payload = {
            titulo: titulo,
            contenido: contenidoHTML,
            resumen: resumen || contenidoHTML.substring(0,150),
            imagen: imagenUrl || null,
            tipo: tipoSeleccion,
            destacado: 0,
            prioridad: 0,
            autor_id: currentUserId || parseInt(localStorage.getItem('user_id')||0,10) || 0
          };

          console.log('📝 ENVIANDO:', payload);

          const endpoint = clean.dataset.idEditar ? '../php/api_noticias.php?action=actualizar' : '../php/api_noticias.php?action=crear';
          if (clean.dataset.idEditar) payload.id = clean.dataset.idEditar;

          const res = await fetch(endpoint, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          // Leer como texto y parsear JSON con manejo de errores (evita Unexpected token '<')
          const text = await res.text();
          let j;
          try {
            j = text ? JSON.parse(text) : {};
          } catch (e) {
            console.error('Respuesta no-JSON de api_noticias (crear/actualizar):', text);
            throw new Error('Respuesta inválida del servidor: inspecciona los logs en el servidor');
          }
          console.log('📥 RESPUESTA:', j);

          if (res.ok && (j.success || j.id)) {
            alert('✅ Noticia publicada correctamente');
            clean.reset(); if (preview) { preview.src=''; preview.style.display='none'; }
            if (editor) editor.innerHTML = '';
            delete clean.dataset.idEditar; delete clean.dataset.imagenAnterior;
            cargarNoticiasPanel();
          } else {
            throw new Error(j.error || 'Error al guardar noticia');
          }

        } catch (err) {
          console.error('Error al enviar noticia:', err);
          alert('❌ ' + err.message);
        }
      });
    }

    // Exponer funciones necesarias al scope global (HTML usa estas)
    window.editarNoticia = editarNoticia;
    window.eliminarNoticia = eliminarNoticia;
    window.cargarNoticiasPanel = cargarNoticiasPanel;
    window.verNoticia = (id) => { window.location.href = `ver_noticia.html?id=${id}`; };

    // Cargar inicialmente
    cargarNoticiasPanel();
  });

})();
