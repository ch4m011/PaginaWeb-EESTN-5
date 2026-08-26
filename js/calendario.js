// ===============================
// calendario.js - Módulo de Calendario Escolar (v2 con edición y JSON externo)
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const formEvento = document.getElementById("formEvento");
  const calendarioContainer = document.getElementById("calendarioContainer");
  const misNoticias = document.querySelector(".mis-noticias");
  const botonesWrapper = document.getElementById("toggleBotones");
  const fechaInput = document.getElementById("fechaEvento");
  const calendarBody = document.getElementById("calendarBody");
  const monthYear = document.getElementById("monthYear");
  let eventos = [];
  let eventoEditando = null;

  // ===============================
  // BOTONES DE MODO
  // ===============================
  botonesWrapper.innerHTML = "";
  const btnNoticia = document.createElement("button");
  btnNoticia.className = "btn-primario";
  btnNoticia.textContent = "🖋️ Crear Noticia";

  const btnCalendario = document.createElement("button");
  btnCalendario.className = "btn-secundario";
  btnCalendario.textContent = "🗓️ Crear Calendario";

  botonesWrapper.appendChild(btnNoticia);
  botonesWrapper.appendChild(btnCalendario);

  btnNoticia.addEventListener("click", () => {
    document.getElementById("contenidoNoticias").style.display = "block";
    misNoticias.style.display = "block";
    calendarioContainer.style.display = "none";
    btnNoticia.className = "btn-primario";
    btnCalendario.className = "btn-secundario";
  });

  btnCalendario.addEventListener("click", () => {
    document.getElementById("contenidoNoticias").style.display = "none";
    misNoticias.style.display = "none";
    calendarioContainer.style.display = "block";
    btnCalendario.className = "btn-primario";
    btnNoticia.className = "btn-secundario";
  });

  // ===============================
  // CALENDARIO VISUAL
  // ===============================
  let currentDate = new Date();

  function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    monthYear.textContent = currentDate.toLocaleString("es-ES", {
      month: "long",
      year: "numeric",
    });
    calendarBody.innerHTML = "";

    const firstDay = new Date(year, month, 1).getDay() || 7;
    const lastDay = new Date(year, month + 1, 0).getDate();
    let date = 1;

    for (let i = 0; i < 6; i++) {
      const row = document.createElement("tr");
      for (let j = 1; j <= 7; j++) {
        const cell = document.createElement("td");

        if (i === 0 && j < firstDay) {
          cell.textContent = "";
          row.appendChild(cell);
          continue;
        }

        if (date > lastDay) {
          cell.textContent = "";
          row.appendChild(cell);
          continue;
        }

        cell.textContent = date;
        const cellDate = new Date(year, month, date);
        if (cellDate < new Date()) cell.style.color = "#aaa";

        cell.addEventListener("click", () => {
          fechaInput.value = `${year}-${String(month + 1).padStart(
            2,
            "0"
          )}-${String(date).padStart(2, "0")}`;
        });

        row.appendChild(cell);
        date++;
      }
      calendarBody.appendChild(row);
    }

    marcarEventos();
  }

  document
    .getElementById("prevMonth")
    .addEventListener("click", () => changeMonth(-1));
  document
    .getElementById("nextMonth")
    .addEventListener("click", () => changeMonth(1));

  function changeMonth(offset) {
    currentDate.setMonth(currentDate.getMonth() + offset);
    renderCalendar();
  }

  // ===============================
  // CRUD EVENTOS - Ahora usando BD
  // ===============================
  formEvento.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fecha = fechaInput.value;
    const titulo = document.getElementById("tituloEvento").value.trim();
    const tipo = document.getElementById("tipoEvento").value;
    const descripcion = document.getElementById("descripcionEvento").value.trim();
    const horaInicio = document.getElementById("horaInicio").value;
    const horaFin = document.getElementById("horaFin").value;

    if (!fecha || !titulo || !tipo || !horaInicio || !horaFin) {
      mostrarNotificacion("Completa todos los campos requeridos.", 'info');  // SL
      return;
    }

    if (eventoEditando) {
      // Modo edición - actualizar en BD
      await actualizarEventoBD(eventoEditando, {
        fecha, titulo, tipo, descripcion, horaInicio, horaFin
      });
      eventoEditando = null;
    } else {
      // Nuevo evento - crear en BD
      await crearEventoBD({
        fecha, titulo, tipo, descripcion, horaInicio, horaFin
      });
    }

    formEvento.reset();
    await cargarEventosJSON(); // Recargar desde BD
  });

  async function crearEventoBD(datosEvento) {
    try {
      const res = await fetch("../date/api_calendario.php?action=crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosEvento),
      });
      const result = await res.json();
      if (result.success) {
        console.log("Evento creado:", result);
        // Refrescar también el panel flotante si está disponible
        if (window.refrescarEventosFlotantes) {
          window.refrescarEventosFlotantes();
        }
      } else {
        mostrarNotificacion("Error al crear evento: " + (result.error || "Error desconocido"), 'error');  // SL
      }
    } catch (err) {
      console.error("Error creando evento:", err);
      mostrarNotificacion("Error al crear evento", 'error');  // SL
    }
  }

  async function actualizarEventoBD(id, datosEvento) {
    try {
      const res = await fetch("../date/api_calendario.php?action=actualizar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...datosEvento }),
      });
      const result = await res.json();
      if (result.success) {
        console.log("Evento actualizado:", result);
        // Refrescar también el panel flotante si está disponible
        if (window.refrescarEventosFlotantes) {
          window.refrescarEventosFlotantes();
        }
      } else {
        mostrarNotificacion("Error al actualizar evento: " + (result.error || "Error desconocido"), 'error');  // SL
      }
    } catch (err) {
      console.error("Error actualizando evento:", err);
      mostrarNotificacion("Error al actualizar evento", 'error');  // SL
    }
  }

  async function eliminarEvento(id) {
    try {
      const res = await fetch("../date/api_calendario.php?action=eliminar", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const result = await res.json();
      if (result.success) {
        console.log("Evento eliminado:", result);
        await cargarEventosJSON(); // Recargar desde BD
        // Refrescar también el panel flotante si está disponible
        if (window.refrescarEventosFlotantes) {
          window.refrescarEventosFlotantes();
        }
      } else {
        mostrarNotificacion("Error al eliminar evento: " + (result.error || "Error desconocido"), 'error');  // SL
      }
    } catch (err) {
      console.error("Error eliminando evento:", err);
      mostrarNotificacion("Error al eliminar evento", 'error');  // SL
    }
  }

  function editarEvento(id) {
    const ev = eventos.find((e) => e.id === id);
    if (!ev) return;
    eventoEditando = id;
    fechaInput.value = ev.fecha;
    document.getElementById("tituloEvento").value = ev.titulo;
    document.getElementById("tipoEvento").value = ev.tipo;
    document.getElementById("descripcionEvento").value = ev.descripcion;
    document.getElementById("horaInicio").value = ev.horaInicio;
    document.getElementById("horaFin").value = ev.horaFin;
    mostrarNotificacion("Modo edición activado. Realiza cambios y guarda el evento.", 'info');  // SL
  }

  // ===============================
  // MOSTRAR EVENTOS
  // ===============================
  function mostrarEventos() {
    const contenedor = document.getElementById("eventosContainer");
    contenedor.innerHTML = "";
    if (!eventos.length) {
      contenedor.innerHTML = `<p class="placeholder">No hay eventos cargados aún.</p>`;
      return;
    }

    eventos.forEach((ev) => {
      const card = document.createElement("div");
      card.className = "evento-card";
      let color = "#1a73e8";
      if (ev.tipo === "titulo-feriado") color = "#d80000";
      if (ev.tipo === "titulo-no-clases") color = "#ff8c00";
      card.style.borderLeft = `5px solid ${color}`;
      card.innerHTML = `
        <strong>${ev.titulo}</strong><br>
        📅 ${ev.fecha}<br>
        🕒 ${ev.horaInicio} - ${ev.horaFin}<br>
        <em>${ev.descripcion || "Sin descripción"}</em>
        <div style="margin-top:8px;">
          <button class="btn-editar">✏️ Editar</button>
          <button class="btn-eliminar">🗑️ Eliminar</button>
        </div>
      `;
      card.querySelector(".btn-editar").addEventListener("click", () => editarEvento(ev.id));
      card.querySelector(".btn-eliminar").addEventListener("click", () => eliminarEvento(ev.id));
      contenedor.appendChild(card);
    });
  }

  // ===============================
  // MARCAR EVENTOS EN CALENDARIO
  // ===============================
  function marcarEventos() {
    const cells = calendarBody.getElementsByTagName("td");
    for (let cell of cells) {
      if (!cell.textContent) continue;
      const cellDateStr = `${currentDate.getFullYear()}-${String(
        currentDate.getMonth() + 1
      ).padStart(2, "0")}-${String(cell.textContent).padStart(2, "0")}`;
      eventos.forEach((ev) => {
        if (ev.fecha === cellDateStr) {
          if (ev.tipo === "titulo-feriado") cell.classList.add("evento-feriado");
          else if (ev.tipo === "titulo-no-clases") cell.classList.add("evento-no-clases");
          else cell.classList.add("evento-importante");
        }
      });
    }
  }

  // ===============================
  // API (CARGAR / GUARDAR) - Conecta a BD via api_calendario.php
  // ===============================
  async function cargarEventosJSON(mine = false) {
    try {
      const url = `../date/api_calendario.php?action=obtener&orden=ASC${mine ? '&mine=1' : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al cargar eventos de la BD");
      eventos = await res.json();
      // Si solicitamos solo los eventos del autor (mine=true), no eliminamos eventos pasados
      if (!mine) {
        eliminarEventosPasados();
      } else {
        console.log('[calendario] cargando eventos del autor, mostrando también pasados. count=', eventos.length);
      }
      mostrarEventos();
      renderCalendar();
    } catch (err) {
      console.error("Error cargando eventos:", err);
    }
  }

  async function guardarEventosJSON() {
    // Ahora simplemente se guarda en la BD mediante las funciones crear/actualizar/eliminar
    // Esta función ya no es necesaria para guardar el array completo
    // Los cambios se persisten con cada operación CRUD
  }

  // ===============================
  // ELIMINAR EVENTOS PASADOS
  // ===============================
  function eliminarEventosPasados() {
    const hoy = new Date();
    eventos = eventos.filter((ev) => new Date(ev.fecha) >= hoy);
  }

  // ===============================
  // INICIO
  // ===============================
  // Cargar eventos al abrir la página
  // Si window.calendarioFiltroMio está definido, cargamos solo los eventos del usuario actual
  const usarFiltroMio = window.calendarioFiltroMio === true;
  cargarEventosJSON(usarFiltroMio);

  // Exportar función global para que otras vistas (por ejemplo el panel flotante o páginas) puedan forzar recarga
  window.cargarEventos = (mine = false) => cargarEventosJSON(mine);

  // Si alguien encoló llamadas antes de que existiera la función, las ejecutamos ahora
  try {
    if (window._calendario_queue && Array.isArray(window._calendario_queue)) {
      window._calendario_queue.forEach(m => {
        try { window.cargarEventos(!!m); } catch(e) { console.warn('Error al procesar cola de cargarEventos:', e); }
      });
      window._calendario_queue = [];
    }
  } catch(e) {
    console.warn('Error procesando _calendario_queue:', e);
  }
  
  // También mostrar eventos si la sección ya está visible
  setTimeout(() => {
    if (document.getElementById("eventosContainer")) {
      mostrarEventos();
    }
  }, 500);
});
