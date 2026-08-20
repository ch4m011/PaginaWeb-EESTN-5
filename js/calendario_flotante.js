// ===============================
// calendario_flotante.js - Panel de eventos flotante desde BD
// ===============================
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('btnCalendarioFlotante');
  const panel = document.getElementById('panelCalendario');
  const cerrar = document.getElementById('cerrarPanelCalendario');
  const lista = document.getElementById('panelEventosLista');

  if (!btn || !panel || !lista) return;

  // Mostrar panel
  btn.addEventListener('click', () => {
    panel.classList.toggle('abierto');
    if (panel.classList.contains('abierto')) cargarEventos();
  });

  // Cerrar panel
  if (cerrar) cerrar.addEventListener('click', () => panel.classList.remove('abierto'));

  // Cargar eventos automáticamente cada vez que se abre el panel (para refrescar)
  // También se pueden cargar al inicializar si es necesario
  if (lista) {
    // Intentar cargar eventos al iniciar (sin abrir panel)
    cargarEventos();
  }

  // ===============================
  // Cargar eventos desde BD usando api_calendario.php
  // ===============================
  async function cargarEventos() {
    lista.innerHTML = `<li style="font-style:italic;color:gray;">Cargando eventos...</li>`;
    try {
      const res = await fetch('date/api_calendario.php?action=obtener&orden=ASC', { cache: 'no-store' });
      if (!res.ok) throw new Error('Error HTTP ' + res.status + ': ' + res.statusText);
      let eventos = await res.json();

      // Validar respuesta
      if (!Array.isArray(eventos)) {
        throw new Error('Respuesta inválida de la API');
      }

      // Si no hay eventos
      if (eventos.length === 0) {
        lista.innerHTML = `<li style="font-style:italic;color:gray;">No hay fechas importantes por el momento.</li>`;
        return;
      }

      // Ordenar del más reciente al más antiguo
      eventos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      // Mostrar eventos
      lista.innerHTML = '';
      eventos.forEach(e => {
        const li = document.createElement('li');
        let clase = '', icono = '';
        if (e.tipo === 'titulo-feriado') { clase='feriado'; icono='📅'; }
        else if (e.tipo === 'titulo-no-clases') { clase='no-clases'; icono='⚠️'; }
        else { clase='evento-importante'; icono='🎉'; }

        li.className = clase;
        li.innerHTML = `<span class="fecha">${icono} ${e.fecha}:</span> <strong>${e.titulo}</strong>`;

        // Descripción desplegable
        if (e.descripcion && e.descripcion.trim() !== '') {
          const desc = document.createElement('div');
          desc.className = 'evento-descripcion';
          desc.textContent = e.descripcion;
          desc.style.display = 'none'; // Oculto por defecto

          li.style.cursor = 'pointer';
          li.addEventListener('click', (event) => {
            event.stopPropagation();
            desc.style.display = desc.style.display === 'none' ? 'block' : 'none';
          });

          li.appendChild(desc);
        }

        lista.appendChild(li);
      });

    } catch (err) {
      console.error('Error cargando eventos:', err);
      lista.innerHTML = `<li style="color:red;">❌ Error al cargar eventos: ${err.message}</li>`;
    }
  }

  // Función global para refrescar (útil para llamar desde otros scripts)
  window.refrescarEventosFlotantes = cargarEventos;
});
