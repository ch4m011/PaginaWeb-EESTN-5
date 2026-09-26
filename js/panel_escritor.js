
// Implementa un único flujo para crear/editar noticias y subir imágenes.

// Estado simple
let currentUserId = 0;
let sessionCorreo = null;

// Helper para escapar texto seguro en templates
function escapeHtml(s) {
  if (s === undefined || s === null) return '';
  return String(s).replace(/[&<>"]+/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}

// Obtener usuario de sesión (server-side) — no confiar en localStorage
async function fetchSessionUser() {
  try {
    const res = await fetch('../php/check_session.php', { cache: 'no-store', credentials: 'same-origin' });
    if (!res.ok) return { id: 0, email: null };
    const json = await res.json();
    return { id: parseInt(json.id || 0, 10) || 0, email: json.email || null };
  } catch (e) {
    console.warn('No fue posible obtener sesión:', e);
  }
  return { id: 0, email: null };
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
    } else {
      console.log('❌ [cargarNoticiasPanel] No currentUserId. Showing empty.');
      noticias = [];
    }
    if (!Array.isArray(noticias) || noticias.length === 0) {
      list.innerHTML = '<p>No has publicado noticias aún.</p>';
      return;
    }

    list.innerHTML = (await Promise.all(noticias.map(async n => {
      // Nombre y foto del autor (usar utilidades del navbar si existen)
      let autorNombre = 'Anónimo';

      try {
        const resp = await fetch('../php/get_user.php', { credentials: 'same-origin' });
        const data = await resp.json();

        if (!data || !data.ok) {
          mostrarMensaje('No estás autenticado. Redirigiendo al login...', 'error');
          setTimeout(() => { window.location.href = '../html/login.html'; }, 1500);
          return false;
        }

        noticia_usuario = {
          id: data.id,
          nombre: data.nombre,
          email: data.email,
          rol: data.rol || 'usuario',
          foto: '../php/perfil/obtener_imagen.php?id=' + data.id
        };

        const fallbackAvatar = '../img/logo-tecnica.png';
        const noticiaImg = '../php/imagen_noticia.php?id=' + n.id;
        // Nuevo diseño: mostrar imagen grande y el contenido completo (sin quitar imágenes embebidas)
        return `
          <div class="noticia-item noticia-full" style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; background: #fdfdfd;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
              <img src="${noticia_usuario.foto}" onerror="this.src='${fallbackAvatar}';"style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
              <span style="font-weight: bold; font-size: 14px;">${escapeHtml(autorNombre)}</span>
            </div>
            <h4>${escapeHtml(n.titulo)}</h4>
            <div class="noticia-imagen" style="margin:10px 0;">
              <img src="${noticiaImg}" alt="${escapeHtml(n.titulo)}" style="width:100%; max-height:360px; object-fit:cover; border-radius:6px; display:block;" onerror="this.onerror=null;this.src='${fallbackAvatar}';">
            </div>
            <div class="noticia-contenido" style="color:#222;line-height:1.6;">
              ${n.contenido || ''}
            </div>
            <small>📅 ${new Date(n.fecha_creacion).toLocaleDateString()}</small>
            <div class="noticia-actions" style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end;">
              <button class="btn-view" onclick="verNoticia(${n.id})" type="button">👁️ Ver</button>
              <button class="btn-edit" onclick="editarNoticia(${n.id})" type="button">✏️ Editar</button>
              <button class="btn-delete" onclick="eliminarNoticia(${n.id})" type="button">🗑️ Eliminar</button>
            </div>
          </div>
        `
      } catch (err) {
        console.error('[perfil] Error cargando usuario:', err);
        mostrarMensaje('Error al cargar los datos del usuario.', 'error');
        setTimeout(() => { window.location.href = '../html/login.html'; }, 1500);
      };
    })));
  } catch (err) {
    console.error('Error cargarNoticiasPanel:', err);
    list.innerHTML = '<p class="error">Error al cargar noticias</p>';
  }
}

// Eliminar noticia (soft)
async function eliminarNoticia(id) {
  const ok = await eestConfirm('Esta acción archivará la noticia. ¿Querés continuar?', { titulo: 'Eliminar noticia', textoConfirmar: 'Eliminar' });
  if (!ok) return;
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

// Inicializar form y handlers únicos
document.addEventListener('DOMContentLoaded', async () => {
  const session = await fetchSessionUser();
  console.log('🔍 [panel_escritor] Session fetch result:', session);
  currentUserId = session.id || parseInt(localStorage.getItem('id') || 0, 10) || 0;
  sessionCorreo = session.email || null;
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

        let imagenBlob = null;
        let imagenMime = null;

        if (inputImagen?.files?.length) {
          const archivo = inputImagen.files[0];

          imagenMime = archivo.type;

          imagenBlob = await new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
              // Sacamos "data:image/jpeg;base64,"
              const base64 = reader.result.split(',')[1];
              resolve(base64);
            };

            reader.onerror = reject;
            reader.readAsDataURL(archivo);
          });
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
          resumen: resumen || contenidoHTML.substring(0, 150),

          imagen_blob: imagenBlob,
          imagen_mime: imagenMime,

          tipo: tipoSeleccion,
          destacado: 0,
          prioridad: 0,
          autor_id: currentUserId || parseInt(localStorage.getItem('usider_id') || 0, 10) || 0
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
          clean.reset(); if (preview) { preview.src = ''; preview.style.display = 'none'; }
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