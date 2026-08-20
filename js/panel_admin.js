// ===============================
// panel_admin.js - XAMPP con PHP
// Integrado: manejo usuarios + render noticias + filtros + ver y editar noticia
// ===============================
(function () {
  const $ = s => document.querySelector(s);

  console.log('panel_admin.js cargado');

  // ===============================
  // Cargar usuarios desde PHP (usuarios.php)
  // ===============================
  async function fetchUsuarios() {
  console.log('fetchUsuarios: llamando a obtener_usuarios.php');
  const resp = await fetch('../php/admin/obtener_usuarios.php', { credentials: 'same-origin' });
  const text = await resp.text();
  console.log('fetchUsuarios: respuesta cruda:', text.slice(0,1000));
  try {
    const data = JSON.parse(text);
    return data;
  } catch (e) {
    console.error('fetchUsuarios: respuesta no es JSON', text);
    throw new Error('Respuesta inválida del servidor al cargar usuarios. Ver consola Network/Response.');
  }
}

  let users = [];
  let noticias = [];

  const tbody = () => $("#usersTable tbody");

  // ===============================
  // Inicialización
  // ===============================
  async function init() {
    bindUI();
    try {
      const dataUsuarios = await fetchUsuarios();
      // La respuesta es {success, usuarios: [...], message} o {error}
      if (dataUsuarios.error) {
        console.error('Error al obtener usuarios:', dataUsuarios.error);
        users = [];
      } else if (dataUsuarios.usuarios && Array.isArray(dataUsuarios.usuarios)) {
        users = dataUsuarios.usuarios;
      } else {
        console.warn('Respuesta inesperada de fetchUsuarios:', dataUsuarios);
        users = [];
      }
    } catch (err) {
      console.error('Exception al obtener usuarios:', err);
      users = [];
    }
    renderAll();
    await fetchNoticias(); // carga noticias al iniciar
  }

  // ===============================
  // Eventos UI
  // ===============================
  function bindUI() {
    $("#search").addEventListener("input", renderAll);
    $("#filterRole").addEventListener("change", renderAll);
    $("#reload").addEventListener("click", async () => {
      document.getElementById('search').value = '';
      document.getElementById('filterRole').value = 'all';
      try {
          const dataUsuarios = await fetchUsuarios();
          if (dataUsuarios.error) {
              console.error('Error al obtener usuarios:', dataUsuarios.error);
              users = [];
          } else if (dataUsuarios.usuarios && Array.isArray(dataUsuarios.usuarios)) {
              users = dataUsuarios.usuarios;
          } else {
              console.warn('Respuesta inesperada de fetchUsuarios:', dataUsuarios);
              users = [];
          }
      } catch (err) {
          console.error('Exception al obtener usuarios:', err);
          users = [];
      }
      renderAll();
    });
  }

  function renderAll() {
    renderCounts();
    renderUsersTable();
  }

  // ===============================
  // Contadores
  // ===============================
  function renderCounts() {
    const filteredUsers = users.filter(u => u.rol !== "admin");
    const tot = filteredUsers.length;
    const escritores = filteredUsers.filter(u => u.rol === "escritor").length;
    const usuarios = filteredUsers.filter(u => u.rol === "usuario" || !u.rol).length;
    $("#counts").innerText = `Total: ${tot} • Usuarios: ${usuarios} • Escritores: ${escritores}`;
  }

  function escapeHtml(s) {
    if (s === undefined || s === null) return "";
    return String(s).replace(/[&<>"']/g, ch => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[ch]);
  }

  // ===============================
  // Render tabla de usuarios
  // ===============================
  function renderUsersTable() {
    const tabla = document.querySelector('#usuarios-tbody');
    if (!tabla) return;

    // Obtener filtros
    const searchValue = (document.getElementById('search')?.value || '').toLowerCase();
    const roleValue = (document.getElementById('filterRole')?.value || 'all');

    // Filtrar usuarios
    let filtered = users;
    if (searchValue) {
        filtered = filtered.filter(u =>
            (u.nombre && u.nombre.toLowerCase().includes(searchValue)) ||
            (u.correo && u.correo.toLowerCase().includes(searchValue))
        );
    }
    if (roleValue !== 'all') {
        filtered = filtered.filter(u => u.rol === roleValue);
    }

    tabla.innerHTML = filtered.map(user => `
      <tr>
        <td>${escapeHtml(user.nombre)}</td>
        <td>${escapeHtml(user.correo)}</td>
        <td class="td-rol">
          <div style="display:flex;align-items:center;gap:8px;">
            <button class="btn-role" data-user-id="${escapeHtml(user.id)}">${escapeHtml((user.rol||'usuario').charAt(0).toUpperCase() + (user.rol||'usuario').slice(1))}</button>
            <span class="inline-msg-placeholder" aria-live="polite"></span>
          </div>
        </td>
        <td>${new Date(user.fecha_registro).toLocaleDateString()}</td>
      </tr>
    `).join('');

    // Después de insertar filas, enlazar handlers a los botones de rol

    // Botones de rol: un único botón por fila que muestra el rol y actúa como toggle
    const roleBtns = document.querySelectorAll('.btn-role');
    roleBtns.forEach(b => {
      b.addEventListener('click', async function () {
        const userId = this.dataset.userId;
        const cell = this.closest('td');
        const user = users.find(u => String(u.id) === String(userId));
        const currentRole = user ? (user.rol || 'usuario') : 'usuario';
        const newRole = currentRole === 'escritor' ? 'usuario' : 'escritor';
        try {
          const resp = await fetch('../php/admin/cambiar_rol.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: userId, rol: newRole })
          });
          let data;
          try { data = await resp.json(); } catch (e) { data = { success: resp.ok, message: await resp.text() }; }
          const placeholder = cell.querySelector('.inline-msg-placeholder');
          if (data && data.success) {
            if (user) user.rol = newRole;
            // actualizar texto del botón
            this.textContent = newRole.charAt(0).toUpperCase() + newRole.slice(1);
            showRowMessage(placeholder, data.message || `Rol cambiado a ${newRole}.`);
            renderCounts();
          } else {
            showRowMessage(placeholder, (data && data.message) || 'Error al actualizar rol', 'error');
          }
        } catch (e) {
          console.error('Error actualizando rol:', e);
          const placeholder = cell.querySelector('.inline-msg-placeholder');
          showRowMessage(placeholder, 'Error de conexión', 'error');
        }
      });
    });
  }

  async function sendPatch(user, patch) {
    try {
      const endpoint = "../date/usuarios.php?id=" + encodeURIComponent(user.id);
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("Error PATCH:", data);
        showMessage("Error al guardar cambios");
        return false;
      }
      return true;
    } catch (e) {
      console.error("Fallo conexión con usuarios.php:", e);
      showMessage("Error de conexión con el servidor");
      return false;
    }
  }

  async function toggleWriterRole(user) {
    try {
      // aceptar que 'user' pueda ser un objeto o un id
      const uid = (typeof user === 'object' && user && user.id) ? user.id : user;
      if (!uid) throw new Error('Usuario inválido');
      // Obtener rol actual desde el select si existe en DOM
      const sel = document.querySelector(`select[data-user-id="${uid}"]`);
      const currentRole = sel ? sel.value : (user.rol || 'usuario');
      const newRole = currentRole === 'escritor' ? 'usuario' : 'escritor';

      const response = await fetch('../php/admin/cambiar_rol.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: uid, rol: newRole })
      });

      const data = await response.json();
      if (data && data.success) {
        mostrarNotificacion(data.message || `Rol actualizado a ${newRole}`, 'success');
        // recargar usuarios
        const fresh = await fetchUsuarios();
        if (Array.isArray(fresh.usuarios)) users = fresh.usuarios;
        renderAll();
      } else {
        mostrarNotificacion((data && data.message) || 'Error al actualizar rol', 'error');
      }
    } catch (error) {
      mostrarNotificacion(error.message || 'Error desconocido', 'error');
      console.error('Error:', error);
    }
}

  async function toggleCalendar(user) {
    const newState = !user.calendar;
    const ok = await sendPatch(user, { calendar: newState });
    if (ok) {
      user.calendar = newState;
      showMessage(`${user.nombre} ${newState ? "tiene acceso" : "ya no tiene acceso"} al calendario`);
      renderAll();
    }
  }

  function showMessage(msg) {
    const counts = $("#counts");
    const el = document.createElement("div");
    el.className = "message";
    el.textContent = msg;
    counts.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  // Mostrar mensaje pequeño inline dentro de la celda (debajo del botón/select)
  function showInlineMessage(targetElementOrCell, msg, type = 'success', duration = 3000) {
    try {
      let cell = null;
      if (!targetElementOrCell) return;
      if (targetElementOrCell instanceof Element) {
        // si pasaron la celda, usarla; si pasaron un botón o select, obtener su td
        cell = targetElementOrCell.tagName.toLowerCase() === 'td' ? targetElementOrCell : targetElementOrCell.closest('td');
      } else {
        cell = document.querySelector(targetElementOrCell);
      }
      if (!cell) return;
      // eliminar mensajes previos
      const prev = cell.querySelector('.inline-msg');
      if (prev) prev.remove();
      const m = document.createElement('div');
      m.className = 'inline-msg ' + (type === 'error' ? 'error' : 'ok');
      m.textContent = msg;
      cell.appendChild(m);
      setTimeout(() => { m.remove(); }, duration);
    } catch (e) {
      console.error('showInlineMessage error', e);
    }
  }

  // Mostrar mensaje al lado derecho del botón en la misma fila
  function showRowMessage(placeholderElement, msg, type = 'ok', duration = 3000) {
    try {
      if (!placeholderElement) return;
      // limpiar previo
      placeholderElement.textContent = '';
      placeholderElement.className = 'inline-msg-placeholder inline-msg ' + (type === 'error' ? 'error' : 'ok');
      placeholderElement.textContent = msg;
      // quitar después de un tiempo
      setTimeout(() => {
        if (placeholderElement) {
          placeholderElement.textContent = '';
          placeholderElement.className = 'inline-msg-placeholder';
        }
      }, duration);
    } catch (e) {
      console.error('showRowMessage error', e);
    }
  }

  // ===============================
  // SECCIÓN DE NOTICIAS (con filtro avanzado)
  // ===============================
  async function fetchNoticias() {
    try {
      const res = await fetch("../php/noticias.php", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo cargar noticias (php)");
      noticias = await res.json();
      renderFiltrosNoticias();
      renderNoticias();
    } catch (e) {
      console.error("Error cargando noticias:", e);
      const cont = $("#newsList");
      if (cont) cont.innerHTML = `<div class="placeholder"><em>⚠️ No se pudieron cargar las noticias.</em></div>`;
    }
  }

  function renderFiltrosNoticias() {
    const container = $("#filtroNoticias");
    if (!container) return;

    const autores = [...new Set(noticias.map(n => n.autor).filter(Boolean))];

    container.innerHTML = `
      <div class="filtros" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:15px;">
        <input type="text" id="filtroTexto" placeholder="Buscar por título o contenido" style="flex:1;min-width:200px;padding:6px 10px;border-radius:6px;border:1px solid #ccc;">
        <select id="filtroAutor" style="padding:6px 10px;border-radius:6px;border:1px solid #ccc;">
          <option value="">Todos los autores</option>
          ${autores.map(a => `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join("")}
        </select>
        <input type="date" id="filtroFecha" style="padding:6px 10px;border-radius:6px;border:1px solid #ccc;">
        <button id="btnLimpiarFiltros" style="padding:6px 10px;border-radius:6px;border:none;background:#ccc;">Limpiar</button>
      </div>
    `;

    $("#filtroTexto").addEventListener("input", renderNoticias);
    $("#filtroAutor").addEventListener("change", renderNoticias);
    $("#filtroFecha").addEventListener("change", renderNoticias);
    $("#btnLimpiarFiltros").addEventListener("click", () => {
      $("#filtroTexto").value = "";
      $("#filtroAutor").value = "";
      $("#filtroFecha").value = "";
      renderNoticias();
    });
  }

  function renderNoticias() {
    const cont = $("#newsList");
    if (!cont) return;

    const texto = ($("#filtroTexto")?.value || "").toLowerCase();
    const autor = $("#filtroAutor")?.value || "";
    const fecha = $("#filtroFecha")?.value || "";

    const filtradas = noticias.filter(n => {
      const titulo = (n.titulo || "").toLowerCase();
      const contenido = (n.contenido || "").toLowerCase();
      const fechaNoticia = (n.fecha || "").split(" ")[0];
      const matchTexto = titulo.includes(texto) || contenido.includes(texto);
      const matchAutor = autor ? n.autor === autor : true;
      const matchFecha = fecha ? fechaNoticia === fecha : true;
      return matchTexto && matchAutor && matchFecha;
    });

    if (filtradas.length === 0) {
      cont.innerHTML = `<div class="placeholder"><em>No hay noticias que coincidan con los filtros.</em></div>`;
      return;
    }

    cont.classList.add("noticias-grid");
    cont.innerHTML = "";

    for (const n of filtradas) {
      const card = document.createElement("article");
      card.className = "noticia-mini";

      // Resolver ruta de imagen: soportar rutas absolutas (/web-escolar/...), rutas relativas (uploads/...) y PHP paths
      let imagenRuta;
      const fallbackImg = (typeof getBasePath === 'function' && typeof normalizarRuta === 'function') ? normalizarRuta(getBasePath() + 'date/img/default.jpg') : '../date/img/default.jpg';
      try {
        if (n.imagen && String(n.imagen).trim() !== '') {
          if (typeof normalizarRuta === 'function' && typeof getBasePath === 'function') {
            if (n.imagen.startsWith('/')) {
              imagenRuta = normalizarRuta(n.imagen);
            } else if (n.imagen.startsWith('php/') || n.imagen.startsWith('uploads/')) {
              imagenRuta = normalizarRuta(getBasePath() + n.imagen);
            } else {
              imagenRuta = normalizarRuta(n.imagen);
            }
          } else {
            imagenRuta = n.imagen.startsWith('/') ? n.imagen : `../${n.imagen}`;
          }
        } else {
          imagenRuta = fallbackImg;
        }
      } catch (e) {
        console.warn('[panel_admin] Error resolviendo imagen de noticia:', e);
        imagenRuta = fallbackImg;
      }
      // Limpiar contenido: quitar <img> embebidas y data:URIs para evitar errores
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
            .substring(0, 120);
          
          return text || '';
        } catch (e) {
          return String(html)
            .replace(/<img[^>]*>/gi, '')
            .replace(/<div[^>]*style="[^"]*text-align[^"]*"[^>]*>.*?<\/div>/gi, '')
            .replace(/data:[^\"'\s>]+/gi, '')
            .replace(/<[^>]+>/g, '')
            .trim()
            .replace(/\s+/g, ' ')
            .substring(0, 120);
        }
      }

      function textFromHtml(html, maxLength = 120) {
        if (!html) return '';
        try {
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const txt = doc.body.textContent || doc.body.innerText || '';
          return txt.trim().substring(0, maxLength) + (txt.length > maxLength ? '...' : '');
        } catch (e) {
          const stripped = String(html).replace(/<[^>]+>/g, '');
          return stripped.trim().substring(0, maxLength) + (stripped.length > maxLength ? '...' : '');
        }
      }

      const safeHtml = stripImagesFromHtml(n.contenido || '');
      const extracto = textFromHtml(safeHtml, 120);

      card.innerHTML = `
        <div style="width:100%;height:180px;overflow:hidden;">
          <img src="${escapeHtml(imagenRuta)}" alt="${escapeHtml(n.titulo)}" style="width:100%;height:100%;object-fit:cover;" onerror="this.onerror=null;this.src='${escapeHtml(fallbackImg)}';">
        </div>
        <div style="padding:12px;display:flex;flex-direction:column;gap:8px;">
          <h3 style="margin:0;color:#0b3b66;">${escapeHtml(n.titulo)}</h3>
          <small style="color:#666;">Por ${escapeHtml(n.autor)} • ${escapeHtml(n.fecha)}</small>
          <p style="margin:0;color:#333;flex-grow:1;">${escapeHtml(extracto)}</p>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px;">
            <button class="btn-view">👁️ Ver</button>
            <button class="btn-edit">✏️ Editar</button>
            <button class="btn-delete">🗑️ Eliminar</button>
          </div>
        </div>
      `;

      card.querySelector(".btn-view").addEventListener("click", () => viewNoticia(n));
      card.querySelector(".btn-edit").addEventListener("click", () => editarNoticiaDesdeAdmin(n.id));
      card.querySelector(".btn-delete").addEventListener("click", () => {
        if (confirm(`¿Eliminar la noticia "${n.titulo}"?`)) eliminarNoticia(n.id);
      });

      cont.appendChild(card);
    }
  }

  // ===============================
  // 🔹 Ver noticia
  // ===============================
  function viewNoticia(noticia) {
    if (!noticia.id) {
      alert("Error: la noticia no tiene un ID válido.");
      return;
    }
    window.location.href = `../pagina/ver_noticia.html?id=${encodeURIComponent(noticia.id)}`;
  }

  // ===============================
  // 🔹 Editar noticia desde el panel ADMIN
  // ===============================
  function editarNoticiaDesdeAdmin(id) {
    if (!id) {
      alert("Error: ID de noticia no válido.");
      return;
    }
    localStorage.setItem("idEditarNoticia", id);
    window.location.href = "../pagina/panel_escritor.html";
  }

  // Función global para cambiar rol
window.cambiarRol = async function(usuarioId, nuevoRolOrElement) {
    try {
        // admitir dos usos: (id, 'escritor') o (id, selectElement)
        let nuevoRol = '';
        if (typeof nuevoRolOrElement === 'string') {
            nuevoRol = nuevoRolOrElement;
        } else if (nuevoRolOrElement && nuevoRolOrElement.value !== undefined) {
            nuevoRol = nuevoRolOrElement.value;
        } else {
            // intentar buscar el select por data-attribute
            const sel = document.querySelector(`select[data-usuario-id="${usuarioId}"]`);
            if (sel) nuevoRol = sel.value;
        }

        if (!usuarioId || !nuevoRol) {
            console.error('Parametros invalidos', usuarioId, nuevoRol);
            alert('Parámetros inválidos para cambiar el rol.');
            return;
        }

        if (!confirm(`¿Confirmar cambio de rol a "${nuevoRol}" para el usuario ${usuarioId}?`)) return;

        // preparar cuerpo x-www-form-urlencoded
        const body = new URLSearchParams();
        body.append('usuario_id', usuarioId);
        body.append('nuevo_rol', nuevoRol);

        console.log('Enviando cambiar_rol:', usuarioId, nuevoRol);

        const resp = await fetch('../php/admin/cambiar_rol.php', {
            method: 'POST',
            credentials: 'same-origin', // enviar cookies de sesión
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            body: body.toString()
        });

        const text = await resp.text();
        // debug: mostrar respuesta cruda si no es JSON
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('Respuesta no JSON de cambiar_rol.php:', text);
            alert('Respuesta inválida del servidor. Revisa la consola (Network / Response).');
            return;
        }

        if (data.success) {
            mostrarNotificacion(data.message || 'Rol actualizado', 'success');
            // recargar usuarios si existe la función
            renderAll();
        } else {
            console.error('Error cambiarRol:', data);
            mostrarNotificacion(data.message || 'Error al actualizar rol', 'error');
        }
    } catch (err) {
        console.error('Error cambiarRol catch:', err);
        mostrarNotificacion('Error al cambiar rol: ' + (err.message || err), 'error');
    }
};

// Funciones auxiliares
function escapeHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function mostrarNotificacion(mensaje, tipo) {
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);
    
    setTimeout(() => {
        notificacion.remove();
    }, 3000);
}

  document.addEventListener("DOMContentLoaded", init);
})();
