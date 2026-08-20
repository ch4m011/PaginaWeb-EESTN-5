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
        window.location.href = "../index.html";
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
    let imgSrc;
    const fallback = (typeof getBasePath === 'function' && typeof normalizarRuta === 'function') ? normalizarRuta(getBasePath() + 'img/sin_imagen.png') : '../img/sin_imagen.png';
    try {
      if (noticia.imagen && String(noticia.imagen).trim() !== '') {
        if (typeof normalizarRuta === 'function' && typeof getBasePath === 'function') {
          imgSrc = noticia.imagen.startsWith('/') ? normalizarRuta(noticia.imagen) : normalizarRuta(getBasePath() + noticia.imagen);
        } else {
          imgSrc = noticia.imagen.startsWith('/') ? noticia.imagen : `../${noticia.imagen}`;
        }
        // Cache-busting
        imgSrc += (imgSrc.includes('?') ? '&' : '?') + 'v=' + Date.now();
      } else {
        imgSrc = fallback;
      }
    } catch (e) {
      console.warn('[ver_noticia] Error resolviendo imagen:', e);
      imgSrc = fallback;
    }
    
    // Obtener autor usando utilidades compartidas si están disponibles
    let autorNombre = 'Anónimo';
    let autorFoto = (typeof getBasePath === 'function' ? normalizarRuta(getBasePath() + 'img_logo/logo-tecnica.png') : "../img_logo/logo-tecnica.png");
    
    if (typeof obtenerAutorNombre === 'function' && typeof obtenerAutorFoto === 'function') {
      try {
        autorNombre = obtenerAutorNombre(noticia);
        autorFoto = obtenerAutorFoto(noticia);
      } catch (e) {
        console.warn('Error usando utilidades del navbar en ver_noticia:', e);
        autorNombre = noticia.autor_nombre || noticia.nombre || 'Anónimo';
        if (noticia.imagen_perfil) {
          try {
            // Evitar duplicar rutas: si comienza con /, usarla directamente
            if (noticia.imagen_perfil.startsWith('/')) {
              if (typeof normalizarRuta === 'function') {
                autorFoto = normalizarRuta(noticia.imagen_perfil);
              } else {
                autorFoto = noticia.imagen_perfil;
              }
            } else if (typeof getBasePath === 'function' && typeof normalizarRuta === 'function') {
              autorFoto = normalizarRuta(getBasePath() + noticia.imagen_perfil);
            } else {
              autorFoto = `../img/perfiles/${noticia.imagen_perfil}`;
            }
          } catch (e2) {
            autorFoto = `../img/perfiles/${noticia.imagen_perfil}`;
          }
        }
      }
    } else {
      autorNombre = noticia.autor_nombre || noticia.nombre || 'Anónimo';
      if (noticia.imagen_perfil) {
        try {
          // Evitar duplicar rutas: si comienza con /, usarla directamente
          if (noticia.imagen_perfil.startsWith('/')) {
            if (typeof normalizarRuta === 'function') {
              autorFoto = normalizarRuta(noticia.imagen_perfil);
            } else {
              autorFoto = noticia.imagen_perfil;
            }
          } else if (typeof getBasePath === 'function' && typeof normalizarRuta === 'function') {
            autorFoto = normalizarRuta(getBasePath() + noticia.imagen_perfil);
          } else {
            autorFoto = `../img/perfiles/${noticia.imagen_perfil}`;
          }
        } catch (e) {
          autorFoto = `../img/perfiles/${noticia.imagen_perfil}`;
        }
      }
    }

    // Función util: eliminar etiquetas <img> del contenido HTML para mostrar solo texto
    function stripImagesFromHtml(html) {
      if (!html) return '';
      try {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        doc.querySelectorAll('img').forEach(i => i.remove());
        return doc.body.innerHTML;
      } catch (e) {
        // fallback: eliminar tags <img> con regex
        return html.replace(/<img[^>]*>/gi, '');
      }
    }

    const contenidoHtml = (noticia.contenido || '');

    contenedor.innerHTML = `
      <h1>${noticia.titulo}</h1>
      <div style="display: flex; align-items: center; gap: 10px; margin: 10px 0;">
        <img src="${autorFoto}" alt="${autorNombre}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
        <p class="autor">Por ${autorNombre} | ${noticia.fecha}</p>
      </div>
      <div class="imagen-wrapper">
        <img src="${imgSrc}" alt="Portada" class="imagen-noticia">
      </div>
      <div class="contenido">${contenidoHtml}</div>
    `;

    const imagen = contenedor.querySelector(".imagen-noticia");
    if (imagen) imagen.scrollIntoView({ behavior: "smooth" });

  } catch (error) {
    console.error("Error al cargar la noticia:", error);
    contenedor.innerHTML = `<p style='color:red;'>Error al cargar la noticia: ${error.message}</p>`;
  }
});
