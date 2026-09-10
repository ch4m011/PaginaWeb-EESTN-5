document.addEventListener('DOMContentLoaded', () => {
  const cont = document.getElementById('eventosGlobalesContainer');

  async function cargarEventosGlobales() {
    try {
      const res = await fetch('../date/api_calendario.php?action=obtener&orden=ASC');
      if (!res.ok) throw new Error('Error cargando eventos');
      const eventos = await res.json();
      renderLista(eventos);
    } catch (e) {
      console.error('Error al cargar eventos globales', e);
      cont.innerHTML = '<p class="placeholder">No se pudieron cargar los eventos.</p>';
    }
  }

  function renderLista(eventos) {
    cont.innerHTML = '';
    if (!eventos || !eventos.length) {
      cont.innerHTML = '<p class="placeholder">No hay eventos en la base de datos.</p>';
      return;
    }

    eventos.forEach(ev => {
      const card = document.createElement('div');
      card.className = 'evento-card';
      card.style.borderLeft = '5px solid #1a73e8';
      card.innerHTML = `
        <strong>${ev.titulo}</strong><br>
        📅 ${ev.fecha} • 🕒 ${ev.horaInicio} - ${ev.horaFin}<br>
        <em>${ev.descripcion || 'Sin descripción'}</em>
        <div style="margin-top:8px">
          <small>Autor: ${ev.autor_email || ev.autor || 'Desconocido'}</small>
          <div style="margin-top:6px">
            <button class="btn-editar">✏️ Editar</button>
            <button class="btn-eliminar">🗑️ Eliminar</button>
          </div>
        </div>
      `;

      const btnEditar = card.querySelector('.btn-editar');
      const btnEliminar = card.querySelector('.btn-eliminar');

      btnEditar.addEventListener('click', () => editarEvento(ev));
      btnEliminar.addEventListener('click', () => eliminarEvento(ev.id));

      cont.appendChild(card);
    });
  }

  async function eliminarEvento(id) {
    if (!confirm('¿Eliminar este evento? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch('../date/api_calendario.php?action=eliminar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const r = await res.json();
      if (r.success) {
        cargarEventosGlobales();
        if (window.refrescarEventosFlotantes) window.refrescarEventosFlotantes();
      } else {
        alert('Error eliminando: ' + (r.error || 'error desconocido'));
      }
    } catch (e) {
      console.error(e);
      alert('Error al eliminar evento');
    }
  }

  async function editarEvento(ev) {
    // Simple editor con prompts (ligero). Para UX mejorable si se desea.
    const nuevoTitulo = prompt('Título:', ev.titulo) || ev.titulo;
    const nuevaFecha = prompt('Fecha (YYYY-MM-DD):', ev.fecha) || ev.fecha;
    const nuevaHoraInicio = prompt('Hora inicio (HH:MM):', ev.horaInicio) || ev.horaInicio;
    const nuevaHoraFin = prompt('Hora fin (HH:MM):', ev.horaFin) || ev.horaFin;
    const nuevaDesc = prompt('Descripción:', ev.descripcion || '') || ev.descripcion;

    try {
      const res = await fetch('../date/api_calendario.php?action=actualizar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ev.id,
          fecha: nuevaFecha,
          titulo: nuevoTitulo,
          tipo: ev.tipo,
          descripcion: nuevaDesc,
          horaInicio: nuevaHoraInicio,
          horaFin: nuevaHoraFin
        })
      });
      const r = await res.json();
      if (r.success) {
        cargarEventosGlobales();
        if (window.refrescarEventosFlotantes) window.refrescarEventosFlotantes();
      } else {
        alert('Error actualizando: ' + (r.error || 'error desconocido'));
      }
    } catch (e) {
      console.error(e);
      alert('Error al actualizar evento');
    }
  }

  // Inicializar
  cargarEventosGlobales();

  // Exponer para recargas manuales
  window.cargarEventosGlobales = cargarEventosGlobales;
});
