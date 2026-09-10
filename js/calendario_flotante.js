// ============================================================
// calendario_flotante.js
// Agenda de la página de inicio. Se muestra automáticamente
// debajo de las últimas noticias y permite desplazamiento con
// flechas, rueda, touchpad y arrastre con el mouse.
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const viewport = document.getElementById('agendaViewport');
  const lista = document.getElementById('agendaLista');
  const anterior = document.getElementById('agendaAnterior');
  const siguiente = document.getElementById('agendaSiguiente');

  if (!viewport || !lista) return;

  let eventosActuales = [];

  const escapar = (valor) => String(valor ?? '').replace(/[&<>'"]/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;'
  }[c]));

  const formatearFecha = (fecha) => {
    if (!fecha) return { dia: '--/--', fechaCompleta: '' };
    const partes = String(fecha).split('-');
    if (partes.length !== 3) return { dia: fecha, fechaCompleta: fecha };
    return {
      dia: `${partes[2]}/${partes[1]}`,
      fechaCompleta: `${partes[2]}/${partes[1]}/${partes[0]}`
    };
  };

  const formatearHora = (horaInicio, horaFin) => {
    const inicio = String(horaInicio || '').slice(0, 5);
    const fin = String(horaFin || '').slice(0, 5);
    if (inicio && fin) return `${inicio} hs`;
    if (inicio) return `${inicio} hs`;
    return '';
  };

  function actualizarFlechas() {
    if (!anterior || !siguiente) return;
    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    anterior.disabled = viewport.scrollLeft <= 2;
    siguiente.disabled = maxScroll <= 2 || viewport.scrollLeft >= maxScroll - 2;
  }

  function desplazar(direccion) {
    const cantidad = Math.max(viewport.clientWidth * 0.78, 260);
    viewport.scrollBy({ left: direccion * cantidad, behavior: 'smooth' });
    setTimeout(actualizarFlechas, 350);
  }

  anterior?.addEventListener('click', () => desplazar(-1));
  siguiente?.addEventListener('click', () => desplazar(1));
  viewport.addEventListener('scroll', actualizarFlechas, { passive: true });
  window.addEventListener('resize', actualizarFlechas);

  // Arrastre con mouse para que funcione como un carrusel táctil.
  let arrastrando = false;
  let inicioX = 0;
  let scrollInicial = 0;

  viewport.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    arrastrando = true;
    inicioX = e.clientX;
    scrollInicial = viewport.scrollLeft;
    viewport.classList.add('arrastrando');
    viewport.setPointerCapture?.(e.pointerId);
  });

  viewport.addEventListener('pointermove', (e) => {
    if (!arrastrando) return;
    viewport.scrollLeft = scrollInicial - (e.clientX - inicioX);
  });

  const terminarArrastre = () => {
    arrastrando = false;
    viewport.classList.remove('arrastrando');
  };

  viewport.addEventListener('pointerup', terminarArrastre);
  viewport.addEventListener('pointercancel', terminarArrastre);
  viewport.addEventListener('mouseleave', terminarArrastre);

  async function cargarEventos() {
    lista.innerHTML = '<p class="agenda-mensaje agenda-vacio">Cargando agenda...</p>';

    try {
      // index.html está dentro de /html/, por eso la API se referencia con ../date/.
      const respuesta = await fetch('../date/api_calendario.php?action=obtener&orden=ASC', {
        cache: 'no-store'
      });

      if (!respuesta.ok) {
        throw new Error(`Error HTTP ${respuesta.status}`);
      }

      const datos = await respuesta.json();
      if (!Array.isArray(datos)) {
        throw new Error(datos?.error || 'La API no devolvió una lista de eventos');
      }

      // En la portada mostramos la agenda a partir de hoy, como en una
      // agenda institucional: los eventos pasados no ocupan espacio.
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      eventosActuales = datos.filter((evento) => {
        const fechaEvento = new Date(`${evento.fecha}T00:00:00`);
        return !Number.isNaN(fechaEvento.getTime()) && fechaEvento >= hoy;
      });
      renderizarEventos(eventosActuales);
    } catch (error) {
      console.error('Error cargando agenda:', error);
      lista.innerHTML = `<p class="agenda-mensaje agenda-error">No se pudo cargar la agenda.</p>`;
    }
  }

  function renderizarEventos(eventos) {
    if (!eventos.length) {
      lista.innerHTML = '<p class="agenda-mensaje agenda-vacio">No hay fechas importantes por el momento.</p>';
      actualizarFlechas();
      return;
    }

    lista.innerHTML = eventos.map((evento) => {
      const fecha = formatearFecha(evento.fecha);
      const titulo = escapar(evento.titulo || 'Sin título');
      const descripcion = escapar(evento.descripcion || '');
      const hora = escapar(formatearHora(evento.horaInicio, evento.horaFin));

      return `
        <article class="agenda-evento" title="${escapar(fecha.fechaCompleta)}">
          <div class="agenda-evento-cabecera">
            <span class="agenda-fecha">${escapar(fecha.dia)}</span>
            <span class="agenda-hora">${hora}</span>
          </div>
          <div class="agenda-evento-contenido">
            <p class="agenda-evento-titulo">${titulo}</p>
            ${descripcion ? `<p class="agenda-evento-descripcion">${descripcion}</p>` : ''}
          </div>
        </article>
      `;
    }).join('');

    viewport.scrollLeft = 0;
    actualizarFlechas();
  }

  // Expuesta para que otros módulos puedan solicitar una actualización.
  window.refrescarEventosFlotantes = cargarEventos;

  cargarEventos();
});
