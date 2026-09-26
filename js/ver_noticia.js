document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.getElementById("noticiaContainer");
  const btnVolver = document.getElementById("btnVolver");
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  // ============================
  // BOTÓN VOLVER UNIVERSAL
  // ============================
  if (btnVolver) {
    btnVolver.addEventListener("click", () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = "../html/index.html";
      }
    });
  }

  // ============================
  // VALIDACIÓN DEL ID
  // ============================
  if (!id) {
    contenedor.innerHTML = "<p style='color:red;'>Error: No se especificó la noticia.</p>";
    return;
  }

  // ============================
  // CARGAR NOTICIAS
  // ============================
  try {
    const res = await fetch("../php/noticias.php", { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo conectar con el servidor.");

    const noticias = await res.json();
    if (!Array.isArray(noticias)) throw new Error("Formato de noticias inválido.");

    const noticia = noticias.find(n => n.id == id);
    if (!noticia) {
      contenedor.innerHTML = "<p style='color:red;'>No se encontró la noticia.</p>";
      return;
    }

    // Normalizar ruta de imagen: soportar rutas absolutas, relativas y paths desde PHP
    const noticiaImg = `../php/imagen_noticia.php?id=${noticia.id}`;
    let imgSrc;
    const fallback = '../img/sin_imagen.png';
    if (noticiaImg && String(noticiaImg).trim() !== '') {
      imgSrc = noticiaImg;
    } else {
      imgSrc = fallback;
    }

    const contenidoHtml = (noticia.contenido || '');

    contenedor.innerHTML = `
      <article class="noticia-articulo">
        <header class="noticia-header">
          <h1>${noticia.titulo}</h1>
          <div class="noticia-meta">
            <img class="noticia-meta__avatar" src="../php/perfil/obtener_imagen.php?id=${noticia.autor_id}" alt="${noticia.autor_nombre}" onerror="this.onerror=null;this.src='../img/logo-tecnica.png'">
            <div class="noticia-meta__info">
              <span class="noticia-meta__autor">${noticia.autor_nombre}</span>
              <span class="noticia-meta__fecha">${noticia.fecha || ''}</span>
            </div>
          </div>
        </header>
        <div class="imagen-wrapper">
          <img src="${imgSrc}" alt="Portada" class="imagen-noticia" onerror="this.onerror=null;this.src='../img/logo-tecnica.png'">
        </div>
        <div class="contenido">${contenidoHtml}</div>
      </article>
    `;

  } catch (error) {
    console.error("Error al cargar la noticia:", error);
    contenedor.innerHTML = `<p style='color:red;'>Error al cargar la noticia: ${error.message}</p>`;
  }
});
