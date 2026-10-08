// ===============================
// panel_edicion_events.js — Eventos del calendario en el panel
// Lista, edita (en un diálogo) y elimina eventos.
// ===============================
(function () {
	const TIPOS = {
		'titulo-feriado':   { label: 'Día feriado',           color: '#c62828', icono: 'calendar' },
		'titulo-no-clases': { label: 'No hay clases',         color: '#b25f00', icono: 'ban' },
		'titulo-evento':    { label: 'Evento importante',     color: '#0f5fa8', icono: 'star' },
		'titulo-jornada':   { label: 'Jornada institucional', color: '#6a3fb5', icono: 'users' }
	};

	const icono = (n, c) => (window.icono ? window.icono(n, c) : '');
	const aviso = (m, t) => (window.mostrarNotificacion ? window.mostrarNotificacion(m, t) : console.log(m));
	const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({
		'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
	})[ch]);

	let eventos = [];
	let eventoEditando = null;
	let contenedor = null;
	let dialogo = null;

	function formatearFecha(f) {
		if (!f) return '';
		const d = new Date(String(f).length === 10 ? f + 'T00:00:00' : f);
		return isNaN(d) ? String(f) : d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
	}

	function estadoVacio(ic, texto) {
		return `<div class="estado-vacio">${icono(ic)}<p>${esc(texto)}</p></div>`;
	}

	async function cargarEventosGlobales() {
		if (!contenedor) return;
		try {
			const res = await fetch('../php/api_calendario.php?action=obtener&orden=ASC', { cache: 'no-store' });
			if (!res.ok) throw new Error('HTTP ' + res.status);
			const data = await res.json();
			eventos = Array.isArray(data) ? data : [];
			render();
		} catch (e) {
			console.error('Error cargando eventos:', e);
			contenedor.innerHTML = estadoVacio('alert', 'No se pudieron cargar los eventos.');
		}
	}

	function render() {
		if (!eventos.length) {
			contenedor.innerHTML = estadoVacio('calendar', 'Todavía no hay eventos cargados.');
			return;
		}
		contenedor.innerHTML = `<div class="eventos-grid">${eventos.map(tarjeta).join('')}</div>`;
	}

	function tarjeta(ev) {
		const t = TIPOS[ev.tipo] || { label: ev.tipo || 'Sin tipo', color: '#0f5fa8', icono: 'calendar' };
		const id = esc(ev.id);
		return `
		<article class="evento-card" style="--evento-color:${t.color}">
		  <span class="evento-tipo-badge">${icono(t.icono)} ${esc(t.label)}</span>
		  <h3>${esc(ev.titulo)}</h3>
		  <ul class="evento-card__datos">
		    <li>${icono('calendar')} <span>${esc(formatearFecha(ev.fecha))}</span></li>
		    <li>${icono('clock')} <span>${esc(ev.hora_inicio || '')} – ${esc(ev.hora_fin || '')}</span></li>
		  </ul>
		  <p class="evento-card__desc">${esc(ev.descripcion || 'Sin descripción')}</p>
		  <div class="acciones">
		    <button type="button" class="btn-editar" data-action="editar" data-id="${id}">${icono('edit')} Editar</button>
		    <button type="button" class="btn-eliminar" data-action="eliminar" data-id="${id}">${icono('trash')} Eliminar</button>
		  </div>
		</article>`;
	}

	function onClick(e) {
		const btn = e.target.closest('button[data-action]');
		if (!btn) return;
		const ev = eventos.find(x => String(x.id) === String(btn.dataset.id));
		if (!ev) return;
		if (btn.dataset.action === 'editar') return abrirEditar(ev);
		if (btn.dataset.action === 'eliminar') return eliminarEvento(ev);
	}

	async function eliminarEvento(ev) {
		const ok = await eestConfirm(`¿Eliminar el evento "${ev.titulo}"?`, {
			titulo: 'Eliminar evento', textoConfirmar: 'Eliminar'
		});
		if (!ok) return;

		try {
			const res = await fetch('../php/api_calendario.php?action=eliminar', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: ev.id })
			});
			const r = await res.json();
			if (r.success) {
				aviso('Evento eliminado.', 'success');
				await cargarEventosGlobales();
				window.refrescarEventosFlotantes?.();
			} else {
				aviso(r.error || 'Error al eliminar el evento.', 'error');
			}
		} catch (e) {
			console.error(e);
			aviso('Error de conexión al eliminar.', 'error');
		}
	}

	// ----- Diálogo de edición -----
	function crearDialogo() {
		dialogo = document.createElement('dialog');
		dialogo.className = 'admin-dialog';
		dialogo.setAttribute('aria-labelledby', 'tituloDialogoEvento');
		dialogo.innerHTML = `
		<form class="admin-dialog__form" id="formEditarEvento" novalidate>
		  <header class="admin-dialog__head">
		    <h3 id="tituloDialogoEvento">${icono('edit')} Editar evento</h3>
		    <button type="button" class="btn-icon" data-cerrar aria-label="Cerrar">${icono('x')}</button>
		  </header>
		  <div class="admin-dialog__body">
		    <div class="campo">
		      <label for="editTitulo">Título</label>
		      <input id="editTitulo" name="titulo" maxlength="255" required>
		    </div>
		    <div class="form-grid">
		      <div class="campo">
		        <label for="editFecha">Fecha</label>
		        <input id="editFecha" type="date" name="fecha" required>
		      </div>
		      <div class="campo">
		        <label for="editTipo">Tipo</label>
		        <select id="editTipo" name="tipo" required>
		          ${Object.entries(TIPOS).map(([v, t]) => `<option value="${v}">${esc(t.label)}</option>`).join('')}
		        </select>
		      </div>
		      <div class="campo">
		        <label for="editInicio">Hora de inicio</label>
		        <input id="editInicio" type="time" name="hora_inicio" required>
		      </div>
		      <div class="campo">
		        <label for="editFin">Hora de fin</label>
		        <input id="editFin" type="time" name="hora_fin" required>
		      </div>
		    </div>
		    <div class="campo">
		      <label for="editDesc">Descripción</label>
		      <textarea id="editDesc" name="descripcion" rows="3"></textarea>
		    </div>
		  </div>
		  <footer class="admin-dialog__foot">
		    <button type="button" class="btn btn-ghost" data-cerrar>Cancelar</button>
		    <button type="submit" class="btn btn-primario">${icono('check')} Guardar cambios</button>
		  </footer>
		</form>`;

		document.body.appendChild(dialogo);
		dialogo.querySelectorAll('[data-cerrar]').forEach(b => b.addEventListener('click', () => dialogo.close()));
		dialogo.querySelector('form').addEventListener('submit', guardarEdicion);
	}

	function abrirEditar(ev) {
		eventoEditando = ev;
		const f = dialogo.querySelector('form');
		f.elements.titulo.value = ev.titulo || '';
		f.elements.fecha.value = ev.fecha || '';
		f.elements.tipo.value = ev.tipo || 'titulo-evento';
		f.elements.hora_inicio.value = ev.hora_inicio || '';
		f.elements.hora_fin.value = ev.hora_fin || '';
		f.elements.descripcion.value = ev.descripcion || '';
		dialogo.showModal();
		f.elements.titulo.focus();
	}

	async function guardarEdicion(e) {
		e.preventDefault();
		const f = e.currentTarget;
		const datos = {
			id: eventoEditando.id,
			titulo: f.elements.titulo.value.trim(),
			fecha: f.elements.fecha.value,
			tipo: f.elements.tipo.value,
			hora_inicio: f.elements.hora_inicio.value,
			hora_fin: f.elements.hora_fin.value,
			descripcion: f.elements.descripcion.value.trim()
		};

		if (!datos.titulo || !datos.fecha || !datos.hora_inicio || !datos.hora_fin) {
			aviso('Completá los campos obligatorios.', 'error');
			return;
		}

		try {
			const res = await fetch('../php/api_calendario.php?action=actualizar', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(datos)
			});
			const r = await res.json();
			if (r.success) {
				dialogo.close();
				aviso('Evento actualizado.', 'success');
				await cargarEventosGlobales();
				window.refrescarEventosFlotantes?.();
			} else {
				aviso(r.error || 'Error al actualizar el evento.', 'error');
			}
		} catch (err) {
			console.error(err);
			aviso('Error de conexión al actualizar.', 'error');
		}
	}

	function init() {
		contenedor = document.getElementById('eventosGlobalesContainer');
		if (!contenedor) return;
		crearDialogo();
		contenedor.addEventListener('click', onClick);
		cargarEventosGlobales();
	}

	window.cargarEventosGlobales = cargarEventosGlobales;
	document.addEventListener('DOMContentLoaded', init);
})();