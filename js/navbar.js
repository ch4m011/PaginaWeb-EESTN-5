// navbar.js - Navbar universal con sesión, roles e imagen
// =======================================================
// Totalmente revisado y optimizado para WEB-ESCOLAR
console.log("Ruta actual:", window.location.pathname);

// =======================================================
// FUNCIONES DE LOGIN
// =======================================================

function irLogin() { window.location.href = "../html/login.html"; }
function irRegistro() { window.location.href = "../html/registrarse.html"; }
function irRegistroExterno() { window.open("https://aaferrando.com/alumno/nuevo.php", "_blank"); }

async function cerrarSesion() {
  // Limpiar datos locales
  localStorage.removeItem("usuarioSesion");
  localStorage.removeItem("usuarioActual");
  localStorage.removeItem("usuario");
  localStorage.removeItem("fotoPerfil");

  try {
    await fetch('../php/logout.php', { method: 'POST', credentials: 'same-origin' });
  } catch (err) {
    console.warn('[navbar] Error al cerrar sesión:', err);
  }

  window.location.href = "index.html";
}

// =======================================================
// GENERADOR DE AVATAR CON INICIALES
// =======================================================
function generarAvatarIniciales(nombre, tamaño = 64) {
  const canvas = document.createElement("canvas");
  canvas.width = tamaño;
  canvas.height = tamaño;
  const ctx = canvas.getContext("2d");

  let hash = 0;
  for (let i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
  const color = `hsl(${hash % 360}, 70%, 50%)`;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, tamaño, tamaño);

  const partes = nombre.split(" ");
  const iniciales = (partes[0][0] + (partes[1]?.[0] || "")).toUpperCase();

  ctx.fillStyle = "white";
  ctx.font = `${tamaño / 2}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(iniciales, tamaño / 2, tamaño / 2);

  return canvas.toDataURL("image/png");
}

// =======================================================
// UTILIDADES: obtener nombre y foto seguros para un autor
// =======================================================
function obtenerAutorNombre(noticia) {
  if (!noticia) return 'Anónimo';
  if (noticia.autor_nombre) return noticia.autor_nombre;
  if (noticia.nombre) return noticia.nombre + (noticia.apellido ? ' ' + noticia.apellido : '');
  return 'Anónimo';
}

function obtenerAutorFoto(noticia) {
  try {
    const nombre = obtenerAutorNombre(noticia) || 'Usuario';
    const img = noticia && (noticia.imagen_perfil || noticia.foto || noticia.foto_perfil);
    if (img) {
      return img;
    }
    return generarAvatarIniciales(nombre, 40);
  } catch (e) {
    return '../img/logo-tecnica.png';
  }
}

// =======================================================
// SESIÓN UNIFICADA: obtiene datos + imagen del usuario
// =======================================================
async function obtenerSesionUsuario() {
  try {
    const resp = await fetch('../php/get_user.php', { credentials: 'same-origin' });
    const texto = await resp.text();

    if (!texto.trim().startsWith('{')) {
      console.warn('[navbar] Respuesta no válida de get_user.php:', texto);
      throw new Error('Respuesta no JSON');
    }

    const data = JSON.parse(texto);

    if ((data.ok || data.nombre) && (data.correo || data.nombre)) {
      let imagen = null;

      if (data.imagen_perfil) {
        imagen = data.imagen_perfil
      } else {
        // Fallback: buscar imagen por PHP secundario
        try {
          const respImg = await fetch('../php/obtener_imagen_usuario.php', {
            method: 'POST',
            body: new URLSearchParams({ correo: data.correo })
          });
          const textoImg = await respImg.text();
          if (textoImg.trim().startsWith('{')) {
            const imgData = JSON.parse(textoImg);
            if (imgData.status === 'success' && imgData.foto) {
              // Mismo lógica para fallback
              imagen = imgData.foto;
            }
          }
        } catch (e) {
          console.warn('[navbar] No se pudo obtener imagen por PHP secundario:', e);
        }
      }

      const usuario = {
        nombre: data.nombre,
        correo: data.correo,
        rol: data.rol || 'usuario',
        foto: imagen || generarAvatarIniciales(data.nombre)
      };

      localStorage.setItem('usuarioSesion', JSON.stringify(usuario));
      return usuario;
    }
  } catch (e) {
    console.warn('[navbar] No se pudo leer sesión del servidor:', e);
  }

  const sesion = JSON.parse(localStorage.getItem('usuarioSesion') || 'null');
  if (sesion && sesion.nombre) return sesion;
  return null;
}

// =======================================================
// CONSTRUCCIÓN DEL NAVBAR
// =======================================================
async function actualizarNav() {
  const nav = document.getElementById("navPrincipal");
  if (!nav) return;
  nav.innerHTML = "";

  // Botones comunes
  const bibliotecaBtn = Object.assign(document.createElement("a"), {
    textContent: "Biblioteca Escolar",
    href: "https://sites.google.com/eest5.com/bibliotecadigital",
    target: "_blank",
    className: "nav-link"
  });

  const contactoBtn = Object.assign(document.createElement("a"), {
    textContent: "Contacto",
    href: "../html/contacto.html",
    className: "nav-link"
  });

  const registroExternoBtn = Object.assign(document.createElement("a"), {
    textContent: "Pre-inscripción",
    href: "../html/preinscripcion.html",
    className: "nav-link"
  });

  nav.append(bibliotecaBtn, contactoBtn, registroExternoBtn);

  // Usuario actual
  const usuario = await obtenerSesionUsuario();

  if (usuario && usuario.nombre) {
    const userContainer = document.createElement("div");
    userContainer.classList.add("user-container");

    const userBtn = document.createElement("button");
    userBtn.classList.add("user-btn");

    const img = document.createElement("img");
    img.src = usuario.foto || '../img/logo-tecnica.png';
    img.alt = "Perfil";
    img.className = "user-img";
    img.style.marginRight = "0.7em";
    img.onerror = () => (img.src = '../img/logo-tecnica.png');
    userBtn.appendChild(img);

    const spanNombre = document.createElement("span");
    spanNombre.textContent = usuario.nombre;
    userBtn.appendChild(spanNombre);

    const dropdown = document.createElement("div");
    dropdown.classList.add("user-menu");

    if (usuario.rol === "admin" || usuario.rol === "escritor") {
      const link = document.createElement("a");
      link.href = `../html/panel_${usuario.rol}.html`;
      link.innerHTML = usuario.rol === "admin" ? "⚙️ Panel Admin" : "📝 Panel Escritor";
      dropdown.appendChild(link);

      const sep = document.createElement("hr");
      sep.style.margin = "5px 0";
      dropdown.appendChild(sep);
    }

    const perfilLink = document.createElement("a");
    perfilLink.href = "../html/perfil.html";
    perfilLink.textContent = "👤 Mi perfil";
    dropdown.appendChild(perfilLink);

    const logoutBtn = document.createElement("button");
    logoutBtn.textContent = "🚪 Cerrar sesión";
    logoutBtn.onclick = cerrarSesion;
    dropdown.appendChild(logoutBtn);

    userBtn.onclick = (e) => {
      e.stopPropagation();
      dropdown.classList.toggle("show");
    };

    window.addEventListener("click", () => dropdown.classList.remove("show"));
    userContainer.append(userBtn, dropdown);
    nav.appendChild(userContainer);

  } else {
    const loginBtn = Object.assign(document.createElement("button"), {
      textContent: "Iniciar sesión",
      className: "btn-login",
      onclick: irLogin
    });

    const registroBtn = Object.assign(document.createElement("button"), {
      textContent: "Registrarse",
      className: "btn-registrarse",
      onclick: irRegistro
    });

    nav.append(loginBtn, registroBtn);
  }
}

// =======================================================
// BUSCADOR CON AUTOCOMPLETADO
// =======================================================
function inicializarBuscador() {
  const btn = document.getElementById("btnBuscar");
  const input = document.getElementById("buscarNoticias");
  const cont = document.querySelector(".buscador");

  if (!input || !btn || !cont) return;

  if (!window.location.pathname.endsWith("index.html")) {
    btn.style.display = input.style.display = cont.style.display = "none";
    return;
  }

  cont.style.position = "relative";

  const sugerenciasDiv = document.createElement("div");
  sugerenciasDiv.id = "sugerencias-escritor";
  sugerenciasDiv.classList.add("sugerencias");
  sugerenciasDiv.style.position = "absolute";
  sugerenciasDiv.style.top = "35px";
  sugerenciasDiv.style.left = "0";
  sugerenciasDiv.style.width = "100%";
  sugerenciasDiv.style.display = "none";
  cont.appendChild(sugerenciasDiv);

  let escritores = [];

  // Fallback: llamar a la API de noticias y extraer autores directamente
  // (se saltea el intento de cargar date/noticias.json que no existe)
  (async () => {
    try {
      const apiRes = await fetch('php/api_noticias.php?action=obtener&limite=200', { cache: 'no-store', credentials: 'same-origin' });
      if (!apiRes.ok) throw new Error('HTTP ' + apiRes.status);
      const noticias = await apiRes.json();
      escritores = [...new Set(noticias.map(n => (n.autor_nombre || (n.nombre ? (n.nombre + (n.apellido ? ' ' + n.apellido : '')) : '')).trim()))].filter(Boolean);
    } catch (err) {
      console.warn('⚠️ Error al cargar escritores desde API:', err);
    }
  })();

  input.addEventListener("input", () => {
    const val = input.value.toLowerCase().trim();
    sugerenciasDiv.innerHTML = "";
    if (!val) return (sugerenciasDiv.style.display = "none");

    const sugerencias = escritores.filter(n => n.toLowerCase().includes(val)).slice(0, 5);
    sugerencias.forEach(nombre => {
      const div = document.createElement("div");
      div.className = "sugerencia-item";
      div.textContent = nombre;
      div.onclick = () => {
        input.value = nombre;
        sugerenciasDiv.innerHTML = "";
        const params = new URLSearchParams({ escritor: nombre });
        window.location.href = "../html/busqueda.html?" + params.toString();
      };
      sugerenciasDiv.appendChild(div);
    });
    sugerenciasDiv.style.display = sugerencias.length ? "block" : "none";
  });

  document.addEventListener("click", (e) => {
    if (!sugerenciasDiv.contains(e.target) && e.target !== input) {
      sugerenciasDiv.style.display = "none";
    }
  });

  function aplicarBusqueda() {
    const query = input.value.trim();
    if (!query) return;
    const params = new URLSearchParams({ query });
    window.location.href = "../html/busqueda.html?" + params.toString();
  }

  btn.onclick = aplicarBusqueda;
  input.addEventListener("keypress", (e) => { if (e.key === "Enter") aplicarBusqueda(); });
}

// =======================================================
// INICIO AUTOMÁTICO
// =======================================================
document.addEventListener("DOMContentLoaded", async () => {
  await actualizarNav();
  inicializarBuscador();
});

// Ajusta automáticamente la variable --navegador-height según la altura real del header
(function () {
  const nav = document.querySelector('.navegador');
  if (!nav) return;

  // selectores probables del slider
  const selectors = ['.slider', '.home-slider', '.carousel', '#slider', '.owl-carousel', '.carousel-inner'];
  function getSliders() {
    return selectors.flatMap(s => Array.from(document.querySelectorAll(s)));
  }

  function ajustarSlider() {
    const h = Math.ceil(nav.getBoundingClientRect().height || 0);
    const gap = 0; // sin hueco: tocar borde con borde
    const amount = h + gap;
    // aplicar inline style a cada slider detectado
    const sliders = getSliders();
    sliders.forEach(sl => {
      // evitar aumentar repetidamente: sólo ajustar si es necesario
      if (parseInt(sl.style.marginTop || 0) !== amount) {
        // también actualizamos variable CSS por si hay reglas que la usan
        document.documentElement.style.setProperty('--header-height', amount + 'px');
        sl.style.marginTop = amount + 'px';
      }
    });
    // como compatibilidad extra, también ajustar padding-top del body (si hace falta)
    // document.body.style.paddingTop = amount + 'px';
  }

  // No añadimos separación: dejamos el slider pegado al header
  const sliders = getSliders();
  sliders.forEach(sl => {
    // asegurar que no quede margin-top agregado
    if (sl.style.marginTop && sl.style.marginTop !== '0px') {
      sl.style.marginTop = '0px';
    }
  });
  // Asegurar variable CSS en 0 para reglas que usen --header-height
  document.documentElement.style.setProperty('--header-height', '0px');
  document.documentElement.style.setProperty('--navegador-height', Math.ceil(nav.getBoundingClientRect().height || 0) + 'px');
  window.addEventListener('load', ajustarSlider);
  window.addEventListener('resize', ajustarSlider);
  document.addEventListener('DOMContentLoaded', ajustarSlider);
  setTimeout(ajustarSlider, 200);
  nav.querySelectorAll('img').forEach(img => img.addEventListener('load', ajustarSlider));
  if ('MutationObserver' in window) {
    const obs = new MutationObserver(ajustarSlider);
    obs.observe(nav, { childList: true, subtree: true, attributes: true });
  }
})();

const footer = document.querySelector(".eest-footer");
if (footer) {
  footer.innerHTML = `
    <div class="eest-footer__top eest-container">
      <div class="eest-footer__brand">
        <img src="../img/logo-tecnica.png" alt="Escudo E.E.S.T. N.º 5">
        <div>
          <strong>E.E.S.T. N.º 5</strong>
          <span>"Gral. Manuel N. Savio" — La Plata</span>
        </div>
      </div>
      <div>
        <h4>Navegación</h4>
        <ul>
          <li><a href="index.html">Inicio</a></li>
          <li><a href="busqueda.html">Noticias</a></li>
          <li><a href="contacto.html">Contacto</a></li>
        </ul>
      </div>
      <div>
        <h4>Recursos</h4>
        <ul>
          <li><a href="https://sites.google.com/eest5.com/bibliotecadigital" target="_blank" rel="noopener">Biblioteca
              escolar</a></li>
          <li><a href="preinscripcion.html">Pre-inscripción</a></li>
        </ul>
      </div>
      <div>
        <h4>Cuenta</h4>
        <ul>
          <li><a href="login.html">Iniciar sesión</a></li>
          <li><a href="registrarse.html">Registrarse</a></li>
        </ul>
      </div>
    </div>
    <div class="eest-footer__bottom eest-container">
      <span>© 2025 Escuela Técnica - La Plata</span>
      <span>Desarrolladores: Belawsky Lautaro, Sanchez Dylan, Cantero Eduardo, Sonco Fabio</span>
    </div>

`
}