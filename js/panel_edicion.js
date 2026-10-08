// ===============================
// panel_edicion.js — Panel de gestión (admin y escritor)
//
// - Admin: ve el encabezado completo y gestiona usuarios.
// - Escritor: ve un encabezado simplificado y no ve la sección de usuarios.
// - Ambos: crean y eliminan noticias, y crean eventos.
//
// Expone window.icono y window.mostrarNotificacion para panel_edicion_events.js.
// ===============================
(function () {
	'use strict';

	const $ = s => document.querySelector(s);

	// ===============================
	// Íconos SVG
	// ===============================
	const svg = d =>
		`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;

	const ICONOS = {
		eye: svg('<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>'),
		edit: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
		pen: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
		trash: svg('<path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>'),
		user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>'),
		users: svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .8 3.5 2.6 3.5 5.2"/>'),
		shield: svg('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/>'),
		calendar: svg('<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
		clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
		alert: svg('<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>'),
		check: svg('<path d="M20 6L9 17l-5-5"/>'),
		x: svg('<path d="M18 6L6 18M6 6l12 12"/>'),
		info: svg('<circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/>'),
		megaphone: svg('<path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15 9a4 4 0 0 1 0 6"/>'),
		bold: svg('<path d="M6 4h8a4 4 0 0 1 0 8H6zM6 12h9a4 4 0 0 1 0 8H6z"/>'),
		italic: svg('<path d="M19 4h-9M14 20H5M15 4L9 20"/>'),
		underline: svg('<path d="M6 3v7a6 6 0 0 0 12 0V3M4 21h16"/>'),
		alignLeft: svg('<path d="M3 6h18M3 12h12M3 18h16"/>'),
		alignCenter: svg('<path d="M3 6h18M6 12h12M4 18h16"/>'),
		alignRight: svg('<path d="M3 6h18M9 12h12M5 18h16"/>'),
		link: svg('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'),
		image: svg('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>'),
		refresh: svg('<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 4v5h-5"/>'),
		search: svg('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'),
		plus: svg('<path d="M12 5v14M5 12h14"/>'),
		ban: svg('<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>'),
		star: svg('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'),
		list: svg('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>')
	};

	function icono(nombre, clase = '') {
		return `<span class="ico ${clase}" aria-hidden="true">${ICONOS[nombre] || ''}</span>`;
	}

	function completarIconos() {
		document.querySelectorAll('[data-icon]').forEach(el => {
			if (!el.innerHTML.trim()) el.innerHTML = ICONOS[el.dataset.icon] || '';
			el.classList.add('ico');
			el.setAttribute('aria-hidden', 'true');
		});
	}

	// ===============================
	// Avisos flotantes
	// ===============================
	const ICONO_AVISO = { success: 'check', error: 'alert', info: 'info' };
	const TITULO_AVISO = { success: 'Listo', error: 'No se pudo completar', info: 'Aviso' };

	function mostrarNotificacion(mensaje, tipo = 'success', duracion = 4500) {
		let cont = document.getElementById('notificaciones-container');
		if (!cont) {
			cont = document.createElement('div');
			cont.id = 'notificaciones-container';
			document.body.appendChild(cont);
		}

		const n = document.createElement('div');
		n.className = `notificacion ${tipo}`;
		n.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
		n.innerHTML = `
			<span class="notificacion__icono">${icono(ICONO_AVISO[tipo] || 'info')}</span>
			<div class="notificacion__texto">
				<strong></strong>
				<span></span>
			</div>
			<button type="button" class="notificacion__cerrar" aria-label="Cerrar aviso">${icono('x')}</button>
			<span class="notificacion__barra" style="animation-duration:${duracion}ms"></span>`;

		n.querySelector('strong').textContent = TITULO_AVISO[tipo] || 'Aviso';
		n.querySelector('.notificacion__texto span').textContent = mensaje;

		const cerrar = () => {
			n.classList.add('fadeout');
			setTimeout(() => n.remove(), 300);
		};
		n.querySelector('.notificacion__cerrar').addEventListener('click', cerrar);

		cont.appendChild(n);
		setTimeout(cerrar, duracion);
	}

	const aviso = (mensaje, tipo) => mostrarNotificacion(mensaje, tipo);

	// Expuestos para panel_edicion_events.js
	window.icono = icono;
	window.mostrarNotificacion = mostrarNotificacion;

	// ===============================
	// Utilidades
	// ===============================
	let users = [];
	let noticias = [];
	let currentAdminId = 0;

	function escapeHtml(valor) {
		if (valor === undefined || valor === null) return '';
		return String(valor).replace(/[&<>"']/g, ch => ({
			'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
		})[ch]);
	}

	function formatearFecha(fecha) {
		if (!fecha) return '';
		const d = new Date(String(fecha).length === 10 ? fecha + 'T00:00:00' : fecha);
		return isNaN(d) ? String(fecha) : d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
	}

	function textoPlano(html, max = 120) {
		if (!html) return '';
		const doc = new DOMParser().parseFromString(html, 'text/html');
		const txt = (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
		return txt.length > max ? txt.substring(0, max) + '…' : txt;
	}

	function estadoVacio(nombreIcono, texto) {
		return `<div class="estado-vacio">${icono(nombreIcono)}<p>${escapeHtml(texto)}</p></div>`;
	}

	// Envía datos como formulario (lo que lee $_POST) y devuelve un resultado claro
	async function postAdmin(url, datos) {
		const body = new URLSearchParams();
		Object.entries(datos).forEach(([k, v]) => body.append(k, v));

		try {
			const resp = await fetch(url, {
				method: 'POST',
				credentials: 'same-origin',
				headers: {
					'Accept': 'application/json',
					'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
				},
				body: body.toString()
			});

			const texto = await resp.text();
			let data;
			try {
				data = JSON.parse(texto);
			} catch (e) {
				console.error(`Respuesta no JSON de ${url} (HTTP ${resp.status}):`, texto);
				return { ok: false, mensaje: `El servidor respondió sin datos válidos (HTTP ${resp.status}).` };
			}

			if (data && data.success) return { ok: true, mensaje: data.message || '' };

			console.error(`Error en ${url}:`, data);
			return { ok: false, mensaje: data?.message || data?.error || `No se pudo completar la acción (HTTP ${resp.status}).` };
		} catch (e) {
			console.error(`Error de red en ${url}:`, e);
			return { ok: false, mensaje: 'No hay conexión con el servidor.' };
		}
	}

	// ===============================
	// Sesión y permisos
	// ===============================
	async function fetchRolActual() {
		try {
			const resp = await fetch('../php/get_user.php', { credentials: 'same-origin', cache: 'no-store' });
			const data = await resp.json();
			return data && data.ok ? (data.rol || 'usuario') : null;
		} catch (e) {
			console.error('No se pudo obtener el rol:', e);
			return null;
		}
	}

	async function fetchSessionUser() {
		try {
			const res = await fetch('../php/check_session.php', { cache: 'no-store', credentials: 'same-origin' });
			if (!res.ok) return { id: 0 };
			const json = await res.json();
			return { id: parseInt(json.id || 0, 10) || 0 };
		} catch (e) {
			console.warn('No fue posible obtener sesión:', e);
			return { id: 0 };
		}
	}

		// Ajusta el encabezado según el rol. Solo modifica el DOM; el HTML no cambia.
	function aplicarTextosEncabezado(rol) {
		if (rol !== 'escritor') return;

		const header = document.querySelector('.admin-header');
		if (!header) return;

		const eyebrow = header.querySelector('.admin-eyebrow');
		if (eyebrow) eyebrow.textContent = 'Redacción';

		const titulo = header.querySelector('h1');
		if (titulo) titulo.textContent = 'Panel del escritor';

		const descripcion = header.querySelector('.lead');
		if (descripcion) {
			descripcion.textContent = 'Publicá noticias con texto, imágenes y enlaces, y cargá eventos en el calendario del sitio.';
		}
	}

	// ===============================
	// Usuarios (solo admin)
	// ===============================
	async function fetchUsuarios() {
		const resp = await fetch('../php/admin/obtener_usuarios.php', { credentials: 'same-origin' });
		const texto = await resp.text();
		try {
			return JSON.parse(texto);
		} catch (e) {
			console.error('fetchUsuarios: respuesta no es JSON', texto);
			throw new Error('Respuesta inválida del servidor al cargar usuarios.');
		}
	}

	async function cargarUsuarios() {
		try {
			const data = await fetchUsuarios();
			if (data.error) console.error('Error al obtener usuarios:', data.error);
			users = Array.isArray(data.usuarios) ? data.usuarios : [];
		} catch (err) {
			console.error('Exception al obtener usuarios:', err);
			users = [];
		}
	}

	// Escritores: se quita la sección de usuarios del DOM
	function quitarGestionUsuarios() {
		document.getElementById('seccionUsuarios')?.remove();
	}

	function bindUsuarios() {
		$('#search').addEventListener('input', renderUsuarios);
		$('#filterRole').addEventListener('change', renderUsuarios);
		$('#reload').addEventListener('click', async () => {
			$('#search').value = '';
			$('#filterRole').value = 'all';
			await cargarUsuarios();
			renderUsuarios();
		});
		$('#usuarios-tbody').addEventListener('click', onTablaUsuariosClick);
	}

	function renderUsuarios() {
		renderContadorUsuarios();
		const tbody = $('#usuarios-tbody');
		if (!tbody) return;

		const q = ($('#search')?.value || '').trim().toLowerCase();
		const rol = $('#filterRole')?.value || 'all';

		const filtrados = users.filter(u =>
			(rol === 'all' || u.rol === rol) &&
			(!q || (u.nombre || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q))
		);

		if (!filtrados.length) {
			tbody.innerHTML = `<tr><td colspan="5" class="tabla-vacia">No hay usuarios que coincidan con la búsqueda.</td></tr>`;
			return;
		}

		tbody.innerHTML = filtrados.map(u => {
			const rolActual = u.rol || 'usuario';
			const etiqueta = rolActual.charAt(0).toUpperCase() + rolActual.slice(1);
			const esAdminFila = rolActual === 'admin';
			const otroRol = rolActual === 'escritor' ? 'usuario' : 'escritor';

			return `
			<tr>
			  <td data-label="Nombre">${escapeHtml(u.nombre)}</td>
			  <td data-label="Correo">${escapeHtml(u.email)}</td>
			  <td data-label="Rol">
			    <div class="celda-rol">
			      <span class="rol-badge rol-${escapeHtml(rolActual)}">${escapeHtml(etiqueta)}</span>
			      ${esAdminFila ? '' : `<button type="button" class="btn-role" data-user-id="${escapeHtml(u.id)}">${icono('shield')} Pasar a ${otroRol}</button>`}
			    </div>
			  </td>
			  <td data-label="Registro">${escapeHtml(formatearFecha(u.fecha_registro))}</td>
			  <td data-label="Acciones">
			    ${esAdminFila
					? '<span class="texto-suave">Administrador</span>'
					: `<button type="button" class="btn-eliminar-usuario" data-user-id="${escapeHtml(u.id)}" data-user-nombre="${escapeHtml(u.nombre)}">${icono('trash')} Eliminar</button>`}
			  </td>
			</tr>`;
		}).join('');
	}

	function renderContadorUsuarios() {
		const lista = users.filter(u => u.rol !== 'admin');
		const escritores = lista.filter(u => u.rol === 'escritor').length;
		const usuarios = lista.filter(u => !u.rol || u.rol === 'usuario').length;
		const el = $('#counts');
		if (el) el.textContent = `Total: ${lista.length} · Usuarios: ${usuarios} · Escritores: ${escritores}`;
	}

	async function onTablaUsuariosClick(e) {
		const btnRol = e.target.closest('.btn-role');
		const btnDel = e.target.closest('.btn-eliminar-usuario');
		if (btnRol) return cambiarRolUsuario(btnRol.dataset.userId);
		if (btnDel) return eliminarUsuario(btnDel.dataset.userId, btnDel.dataset.userNombre);
	}

	async function cambiarRolUsuario(id) {
		const user = users.find(u => String(u.id) === String(id));
		if (!user) return;
		const nuevoRol = (user.rol || 'usuario') === 'escritor' ? 'usuario' : 'escritor';

		const r = await postAdmin('../php/admin/cambiar_rol.php', {
			usuario_id: id,
			rol: nuevoRol,
			nuevo_rol: nuevoRol
		});

		if (r.ok) {
			user.rol = nuevoRol;
			renderUsuarios();
			aviso(`El rol de ${user.nombre} ahora es "${nuevoRol}".`, 'success');
		} else {
			aviso(r.mensaje, 'error');
		}
	}

	async function eliminarUsuario(id, nombre) {
		const ok = await eestConfirm(`¿Eliminar al usuario "${nombre}"? Esta acción no se puede deshacer.`, {
			titulo: 'Eliminar usuario',
			textoConfirmar: 'Eliminar'
		});
		if (!ok) return;

		const r = await postAdmin('../php/admin/eliminar_usuario.php', { usuario_id: id });

		if (r.ok) {
			users = users.filter(u => String(u.id) !== String(id));
			renderUsuarios();
			aviso(`Se eliminó al usuario "${nombre}".`, 'success');
		} else {
			aviso(r.mensaje, 'error');
		}
	}

	// ===============================
	// Noticias: listado, filtros y acciones
	// ===============================
	async function fetchNoticias() {
		const cont = $('#newsList');
		try {
			const res = await fetch('../php/noticias.php', { cache: 'no-store' });
			if (!res.ok) throw new Error('HTTP ' + res.status);
			noticias = await res.json();
			renderFiltrosNoticias();
			renderNoticias();
		} catch (e) {
			console.error('Error cargando noticias:', e);
			if (cont) cont.innerHTML = estadoVacio('alert', 'No se pudieron cargar las noticias.');
		}
	}

	function renderFiltrosNoticias() {
		const cont = $('#filtroNoticias');
		if (!cont) return;

		const autores = [...new Set(noticias.map(n => n.autor).filter(Boolean))].sort();

		cont.innerHTML = `
		<div class="filtros">
		  <label class="campo-buscar">
		    ${icono('search')}
		    <input type="search" id="filtroTexto" placeholder="Buscar por título o contenido" autocomplete="off">
		  </label>
		  <select id="filtroAutor" aria-label="Filtrar por autor">
		    <option value="">Todos los autores</option>
		    ${autores.map(a => `<option value="${escapeHtml(a)}">${escapeHtml(a)}</option>`).join('')}
		  </select>
		  <input type="date" id="filtroFecha" aria-label="Filtrar por fecha">
		  <button type="button" id="btnLimpiarFiltros" class="btn btn-ghost">Limpiar</button>
		</div>`;

		$('#filtroTexto').addEventListener('input', renderNoticias);
		$('#filtroAutor').addEventListener('change', renderNoticias);
		$('#filtroFecha').addEventListener('change', renderNoticias);
		$('#btnLimpiarFiltros').addEventListener('click', () => {
			$('#filtroTexto').value = '';
			$('#filtroAutor').value = '';
			$('#filtroFecha').value = '';
			renderNoticias();
		});
	}

	function renderNoticias() {
		const cont = $('#newsList');
		if (!cont) return;

		const texto = ($('#filtroTexto')?.value || '').toLowerCase();
		const autor = $('#filtroAutor')?.value || '';
		const fecha = $('#filtroFecha')?.value || '';

		const filtradas = noticias.filter(n => {
			const titulo = (n.titulo || '').toLowerCase();
			const contenido = (n.contenido || '').toLowerCase();
			const fechaNoticia = (n.fecha || '').split(' ')[0];
			return (titulo.includes(texto) || contenido.includes(texto))
				&& (!autor || n.autor === autor)
				&& (!fecha || fechaNoticia === fecha);
		});

		if (!filtradas.length) {
			cont.innerHTML = estadoVacio('info', 'No hay noticias que coincidan con los filtros.');
			return;
		}
		cont.innerHTML = filtradas.map(tarjetaNoticia).join('');
	}

	function tarjetaNoticia(n) {
		const id = escapeHtml(n.id);
		return `
		<article class="noticia-mini">
		  <div class="noticia-mini__img">
		    <img src="../php/imagen_noticia.php?id=${encodeURIComponent(n.id)}" alt="" loading="lazy"
		         onerror="this.onerror=null;this.src='../img/logo-tecnica.png';this.classList.add('is-fallback');">
		  </div>
		  <div class="noticia-mini__body">
		    <h3>${escapeHtml(n.titulo)}</h3>
		    <p class="noticia-mini__meta">
		      <span>${icono('user')} ${escapeHtml(n.autor || 'Sin autor')}</span>
		      <span>${icono('calendar')} ${escapeHtml(formatearFecha((n.fecha || '').split(' ')[0]))}</span>
		    </p>
		    <p class="noticia-mini__extracto">${escapeHtml(textoPlano(n.contenido || ''))}</p>
		    <div class="acciones">
		      <button type="button" class="btn-view" data-action="ver" data-id="${id}">${icono('eye')} Ver</button>
		      <button type="button" class="btn-edit" data-action="editar" data-id="${id}">${icono('edit')} Editar</button>
		      <button type="button" class="btn-delete" data-action="eliminar" data-id="${id}">${icono('trash')} Eliminar</button>
		    </div>
		  </div>
		</article>`;
	}

	function onNoticiasClick(e) {
		const btn = e.target.closest('button[data-action]');
		if (!btn) return;
		const noticia = noticias.find(x => String(x.id) === String(btn.dataset.id));
		if (!noticia) return;

		if (btn.dataset.action === 'ver') return verNoticia(noticia);
		if (btn.dataset.action === 'editar') return editarNoticia(noticia.id);
		if (btn.dataset.action === 'eliminar') return confirmarEliminarNoticia(noticia);
	}

	function verNoticia(noticia) {
		if (!noticia.id) return aviso('La noticia no tiene un identificador válido.', 'error');
		window.location.href = `../html/ver_noticia.html?id=${encodeURIComponent(noticia.id)}`;
	}

	function editarNoticia(id) {
		if (typeof window.editarNoticiaDesdeAdmin === 'function') return window.editarNoticiaDesdeAdmin(id);
		aviso('La edición de noticias todavía no está disponible desde este panel.', 'info');
	}

	async function confirmarEliminarNoticia(noticia) {
		const ok = await eestConfirm(`¿Eliminar la noticia "${noticia.titulo}"?`, {
			titulo: 'Eliminar noticia',
			textoConfirmar: 'Eliminar'
		});
		if (ok) eliminarNoticia(noticia.id);
	}

	async function eliminarNoticia(id) {
		const r = await postAdmin('../php/api_noticias.php?action=eliminar', { id });
		if (r.ok) {
			aviso('La noticia se eliminó correctamente.', 'success');
			fetchNoticias();
		} else {
			aviso(r.mensaje || 'No se pudo eliminar la noticia.', 'error');
		}
	}

	// ===============================
	// Crear noticia
	// ===============================
	function initFormNoticia() {
		const form = $('#formNoticia');
		if (!form) return;

		const inputImagen = $('#imagenNoticia');
		const preview = $('#previewImagen');
		const editor = $('#editor');

		inputImagen?.addEventListener('change', () => {
			const archivo = inputImagen.files?.[0];
			if (!archivo) {
				preview.removeAttribute('src');
				preview.style.display = 'none';
				return;
			}
			const lector = new FileReader();
			lector.onload = ev => {
				preview.src = ev.target.result;
				preview.style.display = 'block';
			};
			lector.readAsDataURL(archivo);
		});

		// Barra de herramientas del editor
		form.querySelectorAll('.editor-toolbar [data-cmd]').forEach(btn => {
			btn.addEventListener('click', e => {
				e.preventDefault();
				document.execCommand(btn.dataset.cmd, false, null);
				editor?.focus();
			});
		});

		$('#fontSizeSelect')?.addEventListener('change', e => {
			if (!e.target.value) return;
			document.execCommand('fontSize', false, e.target.value);
			e.target.value = '';
			editor?.focus();
		});

		$('#insertLinkBtn')?.addEventListener('click', e => {
			e.preventDefault();
			const url = prompt('Ingresá la dirección del enlace:', 'https://');
			if (url) {
				document.execCommand('createLink', false, url);
				editor?.focus();
			}
		});

		const btnImg = $('#insertImageBtn');
		const fileImg = $('#insertImageFile');
		btnImg?.addEventListener('click', e => {
			e.preventDefault();
			fileImg.click();
		});
		fileImg?.addEventListener('change', e => {
			const archivo = e.target.files?.[0];
			if (archivo) {
				const lector = new FileReader();
				lector.onload = ev => {
					document.execCommand('insertImage', false, ev.target.result);
					editor?.focus();
				};
				lector.readAsDataURL(archivo);
			}
			fileImg.value = '';
		});

		form.addEventListener('submit', async ev => {
			ev.preventDefault();
			try {
				const titulo = ($('#tituloNoticia')?.value || '').trim();
				const contenidoHTML = editor?.innerHTML || '';
				const contenidoTexto = (editor?.textContent || '').trim();

				if (!titulo) throw new Error('El título es obligatorio.');
				if (!contenidoTexto) throw new Error('El contenido es obligatorio.');

				let imagenBlob = null;
				let imagenMime = null;
				if (inputImagen?.files?.length) {
					const archivo = inputImagen.files[0];
					imagenMime = archivo.type;
					imagenBlob = await new Promise((resolve, reject) => {
						const lector = new FileReader();
						lector.onload = () => resolve(lector.result.split(',')[1]);
						lector.onerror = reject;
						lector.readAsDataURL(archivo);
					});
				}

				const tipo = form.querySelector('input[name="tipoNoticia"]:checked')?.value || 'secundaria';

				const res = await fetch('../php/api_noticias.php?action=crear', {
					method: 'POST',
					credentials: 'same-origin',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						titulo,
						contenido: contenidoHTML,
						resumen: contenidoTexto.substring(0, 150),
						imagen_blob: imagenBlob,
						imagen_mime: imagenMime,
						tipo,
						destacado: 0,
						prioridad: 0,
						autor_id: currentAdminId || 0
					})
				});

				const texto = await res.text();
				let j;
				try {
					j = texto ? JSON.parse(texto) : {};
				} catch (e) {
					console.error('Respuesta no JSON al crear noticia:', texto);
					throw new Error('Respuesta inválida del servidor.');
				}

				if (res.ok && (j.success || j.id)) {
					aviso('La noticia se publicó correctamente.', 'success');
					form.reset();
					if (editor) editor.innerHTML = '';
					if (preview) {
						preview.removeAttribute('src');
						preview.style.display = 'none';
					}
					fetchNoticias();
				} else {
					throw new Error(j.error || j.message || 'No se pudo guardar la noticia.');
				}
			} catch (err) {
				console.error('Error al crear noticia:', err);
				aviso(err.message || 'Error al crear la noticia.', 'error');
			}
		});
	}

	// ===============================
	// Crear evento (la lista la maneja panel_edicion_events.js)
	// ===============================
	function initFormEvento() {
		const form = $('#formEventoAdmin');
		if (!form) return;

		form.addEventListener('submit', async ev => {
			ev.preventDefault();
			const datos = {
				fecha: $('#fechaEventoAdmin')?.value || '',
				titulo: ($('#tituloEventoAdmin')?.value || '').trim(),
				tipo: $('#tipoEventoAdmin')?.value || '',
				descripcion: ($('#descripcionEventoAdmin')?.value || '').trim(),
				hora_inicio: $('#hora_inicioAdmin')?.value || '',
				hora_fin: $('#hora_finAdmin')?.value || ''
			};

			if (!datos.fecha || !datos.titulo || !datos.tipo || !datos.hora_inicio || !datos.hora_fin) {
				aviso('Completá todos los campos obligatorios.', 'error');
				return;
			}

			try {
				const res = await fetch('../php/api_calendario.php?action=crear', {
					method: 'POST',
					credentials: 'same-origin',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(datos)
				});
				const result = await res.json();
				if (result.success) {
					aviso('El evento se creó correctamente.', 'success');
					form.reset();
					window.cargarEventosGlobales?.();
					window.refrescarEventosFlotantes?.();
				} else {
					throw new Error(result.error || 'No se pudo crear el evento.');
				}
			} catch (err) {
				console.error('Error creando evento:', err);
				aviso(err.message || 'Error al crear el evento.', 'error');
			}
		});
	}

	// ===============================
	// Inicio
	// ===============================
	async function init() {
		completarIconos();

		const rol = await fetchRolActual();
		if (rol !== 'admin' && rol !== 'escritor') {
			window.location.href = '../html/login.html';
			return;
		}

		aplicarTextosEncabezado(rol);

		currentAdminId = (await fetchSessionUser()).id || 0;
		initFormNoticia();
		initFormEvento();
		$('#newsList')?.addEventListener('click', onNoticiasClick);

		if (rol === 'admin') {
			bindUsuarios();
			await cargarUsuarios();
			renderUsuarios();
		} else {
			quitarGestionUsuarios();
		}

		await fetchNoticias();
	}

	document.addEventListener('DOMContentLoaded', init);
})();