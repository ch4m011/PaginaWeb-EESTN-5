// ===============================
// busqueda.js - Mostrar resultados de búsqueda desde noticias.json
// ===============================

document.addEventListener("DOMContentLoaded", async () => {
  const cont = document.getElementById("resultadosContainer");
  const params = new URLSearchParams(window.location.search);

  // Leer posibles parámetros de búsqueda
  const query = (params.get("query") || params.get("q") || "").toLowerCase().trim();
  const tituloFiltro = (params.get("titulo") || "").toLowerCase().trim();
  const escritorFiltro = (params.get("escritor") || "").toLowerCase().trim();
  const fechaFiltro = params.get("fecha") || "";

  if (!query && !tituloFiltro && !escritorFiltro && !fechaFiltro) {
    mostrarMensaje(`No se ingresó ninguna búsqueda.`, true);
    return;
  }

  cont.innerHTML = `<p class="cargando">Buscando resultados...</p>`;

  try {
    // Usar API de noticias en lugar de archivo estático
    const res = await fetch("../php/api_noticias.php?action=obtener&limite=500", { 
      cache: "no-store",
      credentials: 'same-origin'
    });
    if (!res.ok) throw new Error("No se pudo cargar noticias desde API (HTTP " + res.status + ")");

    let noticias = await res.json();
    if (!Array.isArray(noticias)) throw new Error("Formato inválido de respuesta de API");

    // Aplicar filtros
    const resultados = noticias.filter(n => {
      const titulo = (n.titulo || "").toLowerCase();
      const contenido = (n.contenido || "").toLowerCase();
      const escritor = (n.escritor || "").toLowerCase();
      const fecha = (n.fecha || "").trim();

      const coincideQuery = query ? (titulo.includes(query) || contenido.includes(query)) : true;
      const coincideTitulo = tituloFiltro ? titulo.includes(tituloFiltro) : true;
      const coincideEscritor = escritorFiltro ? escritor.includes(escritorFiltro) : true;
      const coincideFecha = fechaFiltro ? fecha === fechaFiltro : true;

      return coincideQuery && coincideTitulo && coincideEscritor && coincideFecha;
    });

    if (resultados.length === 0) {
      mostrarMensaje(`No se encontraron resultados.`, true);
      return;
    }

    cont.innerHTML = "";
    resultados.forEach(n => {
      const div = document.createElement("div");
      div.className = "noticia-mini";
      div.innerHTML = `
        ${n.imagen ? `<img src="../date/img/${n.imagen.split('/').pop()}" alt="${n.titulo}">` : ""}
        <h3>${n.titulo}</h3>
        <p>${n.contenido.substring(0, 120)}...</p>
      `;

      // 🔧 Aquí estaba el error: quitar las barras invertidas
      div.addEventListener("click", () => {
        window.location.href = `ver_noticia.html?id=${n.id}`;
      });

      cont.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    mostrarMensaje(`Error: ${err.message}`, true);
  }

  // ===============================
  // Función para mostrar mensaje con botón de volver
  // ===============================
  function mostrarMensaje(texto, incluirBoton = false) {
    cont.innerHTML = `
      <div class="mensaje">
        <p class="cargando">${texto}</p>
        ${incluirBoton ? `<button class="btn-volver" onclick="window.location.href='../index.html'">Volver al inicio</button>` : ""}
      </div>
    `;
  }
});
