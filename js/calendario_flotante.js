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

      // AGREGADO: mapa de etiquetas legibles por tipo, con ícono y color propios
      const infoTipo = {
        'titulo-feriado':   { clase: 'feriado',           icono: '📅', etiqueta: 'Feriado',              color: '#d80000' },
        'titulo-no-clases': { clase: 'no-clases',         icono: '⚠️', etiqueta: 'No hay clases',        color: '#ff8c00' },
        'titulo-evento':    { clase: 'evento-importante', icono: '🎉', etiqueta: 'Evento importante',    color: '#1a73e8' },
        'titulo-jornada':   { clase: 'jornada',           icono: '🏫', etiqueta: 'Jornada institucional', color: '#8e44ad' }
      };
      const infoPorDefecto = { clase: 'evento-importante', icono: '🎉', etiqueta: 'Evento', color: '#1a73e8' };

      // Mostrar eventos
      lista.innerHTML = '';
      eventos.forEach(e => {
        const info = infoTipo[e.tipo] || infoPorDefecto;

        const li = document.createElement('li');
        li.className = info.clase;
        li.innerHTML = `
          <span class="tipo-evento-flotante" style="color:${info.color};font-weight:700;font-size:0.75rem;text-transform:uppercase;display:block;">${info.icono} ${info.etiqueta}</span>
          <span class="fecha">${e.fecha}:</span> <strong>${e.titulo}</strong>
        `;

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