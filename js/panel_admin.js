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
    currentAdminId = (await fetchSessionUser()).user_id || 0;
    initFormNoticiaAdmin();
    initFormEventoAdmin();
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
    await fetchEventosGlobales(); // carga eventos al iniciar
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
        <td>
          ${user.rol === 'admin' ? '' : `<button class="btn-eliminar-usuario" data-user-id="${escapeHtml(user.id)}" data-user-nombre="${escapeHtml(user.nombre)}">🗑️ Eliminar</button>`}
        </td>
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

    // Botones de eliminar usuario
    const deleteBtns = document.querySelectorAll('.btn-eliminar-usuario');
    deleteBtns.forEach(b => {
      b.addEventListener('click', async function () {
        const userId = this.dataset.userId;
        const userNombre = this.dataset.userNombre;
        if (!(await mostrarConfirmacion(`¿Eliminar al usuario "${userNombre}"? Esta acción no se puede deshacer.`))) return;  // SL
        try {
          const resp = await fetch('../php/admin/eliminar_usuario.php', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: userId })
          });
          const data = await resp.json();
          if (data && data.success) {
            mostrarNotificacion(data.message || 'Usuario eliminado', 'success');
            users = users.filter(u => String(u.id) !== String(userId));
            renderAll();
          } else {
            mostrarNotificacion((data && data.message) || 'Error al eliminar usuario', 'error');
          }
        } catch (e) {
          console.error('Error eliminando usuario:', e);
          mostrarNotificacion('Error de conexión', 'error');
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
      card.querySelector(".btn-delete").addEventListener("click", async () => {  // SL
        if (await mostrarConfirmacion(`¿Eliminar la noticia "${n.titulo}"?`)) eliminarNoticia(n.id);  // SL
      });

      cont.appendChild(card);
    }
  }

  // ===============================
  // 🔹 Ver noticia
  // ===============================
  function viewNoticia(noticia) {
    if (!noticia.id) {
      mostrarNotificacion('Error: la noticia no tiene un ID válido.', 'error');
      return;
    }
    window.location.href = `../pagina/ver_noticia.html?id=${encodeURIComponent(noticia.id)}`;
  }

  // ===============================
  // 🔹 Editar noticia desde el panel ADMIN
  // ===============================
  function editarNoticiaDesdeAdmin(id) {
    if (!id) {
      mostrarNotificacion('Error: ID de noticia no válido.', 'error');
      return;
    }
    localStorage.setItem("idEditarNoticia", id);
    window.location.href = "../pagina/panel_escritor.html";
  }

  // ===============================
  // 🔹 Eliminar noticia (soft) — AGREGADA para resolver "eliminarNoticia is not defined"
  // ===============================
  async function eliminarNoticia(id) {
    try {
      const res = await fetch('../php/api_noticias.php?action=eliminar', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
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
        mostrarNotificacion('Noticia eliminada', 'success');
        fetchNoticias(); // recarga la lista de noticias en el panel admin
      } else {
        throw new Error(j.error || 'Error');
      }
    } catch (e) {
      console.error('eliminarNoticia:', e);
      mostrarNotificacion('Error al eliminar', 'error');
    }
  }

  // ===============================
  // 🔹 AGREGADO: crear noticias y eventos desde el panel admin
  // ===============================

  // Obtener usuario de sesión (para autor_id), igual que hace panel_escritor.js
  async function fetchSessionUser() {
    try {
      const res = await fetch('../php/check_session.php', { cache: 'no-store', credentials: 'same-origin' });
      if (!res.ok) return { user_id: 0 };
      const json = await res.json();
      return { user_id: parseInt(json.user_id || 0, 10) || 0 };
    } catch (e) {
      console.warn('No fue posible obtener sesión:', e);
      return { user_id: 0 };
    }
  }

  let currentAdminId = 0;

  // Subir imagen (mismo endpoint que usa panel_escritor.js)
  async function subirImagenAdmin(file) {
    const fd = new FormData();
    fd.append('imagen', file);
    const res = await fetch('../php/api_upload_imagen.php', { method: 'POST', body: fd, credentials: 'same-origin' });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('Respuesta no-JSON de api_upload_imagen.php:', text);
      return { success: false, error: 'Respuesta inválida del servidor' };
    }
  }

  // ---- Crear noticia desde el admin ----
  function initFormNoticiaAdmin() {
    const form = $("#formNoticiaAdmin");
    if (!form) return;
    const inputImagen = $("#imagenNoticiaAdmin");
    const preview = $("#previewImagenAdmin");

    if (inputImagen && preview) {
      inputImagen.addEventListener("change", (e) => {
        const f = e.target.files && e.target.files[0];
        if (f) {
          const r = new FileReader();
          r.onload = ev => { preview.src = ev.target.result; preview.style.display = "block"; };
          r.readAsDataURL(f);
        } else {
          preview.src = "";
          preview.style.display = "none";
        }
      });
    }

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      try {
        const titulo = ($("#tituloNoticiaAdmin")?.value || "").trim();
        const contenido = ($("#contenidoNoticiaAdmin")?.value || "").trim();
        if (!titulo) throw new Error("El título es obligatorio");
        if (!contenido) throw new Error("El contenido es obligatorio");

        let imagenUrl = null;
        if (inputImagen && inputImagen.files && inputImagen.files.length > 0) {
          const r = await subirImagenAdmin(inputImagen.files[0]);
          if (!r || !r.success) throw new Error(r?.error || "Error subiendo imagen");
          imagenUrl = r.imagen;
        }

        const payload = {
          titulo,
          contenido,
          resumen: contenido.substring(0, 150),
          imagen: imagenUrl,
          tipo: "secundaria",
          destacado: 0,
          prioridad: 0,
          autor_id: currentAdminId || 0
        };

        const res = await fetch("../php/api_noticias.php?action=crear", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const text = await res.text();
        let j;
        try {
          j = text ? JSON.parse(text) : {};
        } catch (e) {
          console.error("Respuesta no-JSON al crear noticia:", text);
          throw new Error("Respuesta inválida del servidor");
        }

        if (res.ok && (j.success || j.id)) {
          mostrarNotificacion("Noticia publicada", "success");
          form.reset();
          if (preview) { preview.src = ""; preview.style.display = "none"; }
          fetchNoticias();
        } else {
          throw new Error(j.error || "Error al guardar noticia");
        }
      } catch (err) {
        console.error("Error al crear noticia desde admin:", err);
        mostrarNotificacion(err.message || "Error al crear noticia", "error");
      }
    });
  }

  // ---- Eventos: listar, crear, eliminar ----
  let eventosGlobales = [];

  async function fetchEventosGlobales() {
    try {
      const res = await fetch("../date/api_calendario.php?action=obtener&orden=ASC", { cache: "no-store" });
      if (!res.ok) throw new Error("No se pudo cargar eventos");
      eventosGlobales = await res.json();
      renderEventosGlobales();
    } catch (e) {
      console.error("Error cargando eventos:", e);
      const cont = $("#eventosGlobalesContainer");
      if (cont) cont.innerHTML = `<div class="placeholder"><em>⚠️ No se pudieron cargar los eventos.</em></div>`;
    }
  }

  function renderEventosGlobales() {
    const cont = $("#eventosGlobalesContainer");
    if (!cont) return;

    if (!Array.isArray(eventosGlobales) || eventosGlobales.length === 0) {
      cont.innerHTML = `<p class="placeholder">No hay eventos cargados aún.</p>`;
      return;
    }

    cont.innerHTML = "";
    const etiquetasTipo = {
      "titulo-feriado": "🔴 Día Feriado",
      "titulo-no-clases": "🟠 No hay clases",
      "titulo-evento": "🔵 Evento importante",
      "titulo-jornada": "🟣 Jornada Institucional"
    };
    eventosGlobales.forEach((ev) => {
      let color = "#1a73e8";
      if (ev.tipo === "titulo-feriado") color = "#d80000";
      if (ev.tipo === "titulo-no-clases") color = "#ff8c00";
      if (ev.tipo === "titulo-jornada") color = "#8e44ad";

      const etiqueta = etiquetasTipo[ev.tipo] || ev.tipo || "Sin tipo";

      const card = document.createElement("div");
      card.className = "evento-card";
      card.style.borderLeft = `5px solid ${color}`;
      card.style.marginBottom = "10px";
      card.style.padding = "10px";
      card.innerHTML = `
        <span class="evento-tipo-badge" style="color:${color};">${escapeHtml(etiqueta)}</span><br>
        <strong>${escapeHtml(ev.titulo)}</strong><br>
        📅 ${escapeHtml(ev.fecha)}<br>
        🕒 ${escapeHtml(ev.horaInicio || ev.hora_inicio || "")} - ${escapeHtml(ev.horaFin || ev.hora_fin || "")}<br>
        <em>${escapeHtml(ev.descripcion || "Sin descripción")}</em>
        <div style="margin-top:8px;">
          <button class="btn-delete">🗑️ Eliminar</button>
        </div>
      `;
      card.querySelector(".btn-delete").addEventListener("click", async () => {  // SL
        if (await mostrarConfirmacion(`¿Eliminar el evento "${ev.titulo}"?`)) eliminarEventoAdmin(ev.id);  // SL
      });
      cont.appendChild(card);
    });
  }

  async function eliminarEventoAdmin(id) {
    try {
      const res = await fetch("../date/api_calendario.php?action=eliminar", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const result = await res.json();
      if (result.success) {
        mostrarNotificacion("Evento eliminado", "success");
        fetchEventosGlobales();
      } else {
        mostrarNotificacion(result.error || "Error al eliminar evento", "error");
      }
    } catch (err) {
      console.error("Error eliminando evento:", err);
      mostrarNotificacion("Error al eliminar evento", "error");
    }
  }

  function initFormEventoAdmin() {
    const form = $("#formEventoAdmin");
    if (!form) return;

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      try {
        const datosEvento = {
          fecha: $("#fechaEventoAdmin")?.value || "",
          titulo: ($("#tituloEventoAdmin")?.value || "").trim(),
          tipo: $("#tipoEventoAdmin")?.value || "",
          descripcion: ($("#descripcionEventoAdmin")?.value || "").trim(),
          horaInicio: $("#horaInicioAdmin")?.value || "",
          horaFin: $("#horaFinAdmin")?.value || ""
        };

        if (!datosEvento.fecha || !datosEvento.titulo || !datosEvento.tipo || !datosEvento.horaInicio || !datosEvento.horaFin) {
          throw new Error("Completá todos los campos requeridos.");
        }

        const res = await fetch("../date/api_calendario.php?action=crear", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datosEvento)
        });
        const result = await res.json();
        if (result.success) {
          mostrarNotificacion("Evento creado", "success");
          form.reset();
          fetchEventosGlobales();
          if (window.refrescarEventosFlotantes) window.refrescarEventosFlotantes();
        } else {
          throw new Error(result.error || "Error al crear evento");
        }
      } catch (err) {
        console.error("Error creando evento desde admin:", err);
        mostrarNotificacion(err.message || "Error al crear evento", "error");
      }
    });
  }


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
            mostrarNotificacion('Parámetros inválidos para cambiar el rol.', 'error');
            return;
        }

        if (!(await mostrarConfirmacion(`¿Confirmar cambio de rol a "${nuevoRol}" para el usuario ${usuarioId}?`))) return;  // SL

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
            mostrarNotificacion('Respuesta inválida del servidor. Revisá la consola.', 'error');
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

// mostrarNotificacion() ahora vive en js/notificaciones.js (compartida por todo el sitio)  // SL

  document.addEventListener("DOMContentLoaded", init);
})();