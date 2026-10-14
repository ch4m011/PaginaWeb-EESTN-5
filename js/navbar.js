// navbar.js - Navbar universal con sesión, roles e imagen

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
    if ((data.ok || data.nombre) && (data.email || data.nombre)) {
      const usuario = {
        id: data.id,
        nombre: data.nombre,
        email: data.email,
        rol: data.rol || 'usuario',
        foto: '../php/perfil/obtener_imagen.php?id=' + data.id
      };

      localStorage.setItem('usuarioSesion', JSON.stringify(usuario));
      return usuario
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

  const registroExternoBtn = Object.assign(document.createElement("a"), {
    textContent: "Pre-inscripción",
    href: "../html/preinscripcion.html",
    className: "nav-link"
  });

  // ===================================================
  // TECNICATURAS: menú desplegable con las especialidades
  // ===================================================
  const tecnicaturas = [
    { nombre: "Construcción", href: "../html/tecnicatura-construccion.html" },
    { nombre: "Electromecánica", href: "../html/tecnicatura-electromecanica.html" },
    { nombre: "Química", href: "../html/tecnicatura-quimica.html" },
    { nombre: "Informática", href: "../html/tecnicatura-informatica.html" }
  ];

  const tecnicaturasContainer = document.createElement("div");
  tecnicaturasContainer.className = "nav-dropdown";

  const tecnicaturasBtn = document.createElement("button");
  tecnicaturasBtn.type = "button";
  tecnicaturasBtn.className = "nav-link nav-dropdown-toggle";
  tecnicaturasBtn.innerHTML = `Tecnicaturas <span class="nav-dropdown-arrow">▾</span>`;

  const tecnicaturasMenu = document.createElement("div");
  tecnicaturasMenu.className = "nav-dropdown-menu";

  tecnicaturas.forEach(t => {
    const link = document.createElement("a");
    link.href = t.href;
    link.textContent = t.nombre;
    tecnicaturasMenu.appendChild(link);
  });

  tecnicaturasBtn.onclick = (e) => {
    e.stopPropagation();
    document.querySelectorAll(".nav-dropdown.show").forEach(d => { if (d !== tecnicaturasContainer) d.classList.remove("show"); });
    tecnicaturasContainer.classList.toggle("show");
  };
  window.addEventListener("click", () => tecnicaturasContainer.classList.remove("show"));

  tecnicaturasContainer.append(tecnicaturasBtn, tecnicaturasMenu);

  // ===================================================
  // AYUDA: menú desplegable con Contacto y Preguntas frecuentes
  // ===================================================
  const ayudaContainer = document.createElement("div");
  ayudaContainer.className = "nav-dropdown";

  const ayudaBtn = document.createElement("button");
  ayudaBtn.type = "button";
  ayudaBtn.className = "nav-link nav-dropdown-toggle";
  ayudaBtn.innerHTML = `Ayuda <span class="nav-dropdown-arrow">▾</span>`;

  const ayudaMenu = document.createElement("div");
  ayudaMenu.className = "nav-dropdown-menu";

  [
    { nombre: "Contacto", href: "../html/contacto.html" },
    { nombre: "Preguntas frecuentes", href: "../html/preguntas-frecuentes.html" }
  ].forEach(item => {
    const link = document.createElement("a");
    link.href = item.href;
    link.textContent = item.nombre;
    ayudaMenu.appendChild(link);
  });

  ayudaBtn.onclick = (e) => {
    e.stopPropagation();
    // cerrar los otros desplegables abiertos
    document.querySelectorAll(".nav-dropdown.show").forEach(d => { if (d !== ayudaContainer) d.classList.remove("show"); });
    ayudaContainer.classList.toggle("show");
  };
  window.addEventListener("click", () => ayudaContainer.classList.remove("show"));

  ayudaContainer.append(ayudaBtn, ayudaMenu);

  nav.append(tecnicaturasContainer, ayudaContainer, bibliotecaBtn, registroExternoBtn);

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

        // Íconos SVG del menú de usuario
    const ICONOS = {
      panel: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>
              </svg>`,
      escritor: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>
              </svg>`,
      perfil: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>
              </svg>`,
      salir: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M13 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7"/>
                <path d="M10 12h10"/>
                <path d="M16.5 8.5L20 12l-3.5 3.5"/>
              </svg>`
    };

    // Crea un ítem del menú con ícono + texto
    function crearItemMenu({ icono, texto, href, danger = false, onclick }) {
      const el = document.createElement(href ? "a" : "button");
      if (href) el.href = href;
      if (!href) el.type = "button";
      el.className = "menu-item" + (danger ? " menu-item--danger" : "");
      el.innerHTML = `
        <span class="menu-item__icon" aria-hidden="true">${icono}</span>
        <span class="menu-item__label">${texto}</span>`;
      if (onclick) el.onclick = onclick;
      return el;
    }

    if (usuario.rol === "admin" || usuario.rol === "escritor") {
      dropdown.appendChild(crearItemMenu({
        icono: usuario.rol === "admin" ? ICONOS.panel : ICONOS.escritor,
        texto: usuario.rol === "admin" ? "Panel Admin" : "Panel Escritor",
        href: "../html/panel_edicion.html"
      }));

      const sep = document.createElement("hr");
      sep.className = "menu-separator";
      dropdown.appendChild(sep);
    }

    dropdown.appendChild(crearItemMenu({
      icono: ICONOS.perfil,
      texto: "Mi perfil",
      href: "../html/perfil.html"
    }));

    dropdown.appendChild(crearItemMenu({
      icono: ICONOS.salir,
      texto: "Cerrar sesión",
      danger: true,
      onclick: cerrarSesion
    }));
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
// MENÚ HAMBURGUESA (solo se ve en celular, ver navegador.css)
// =======================================================
function inicializarMenuHamburguesa() {
  const header = document.querySelector(".navegador");
  const nav = document.getElementById("navPrincipal");
  if (!header || !nav || header.querySelector(".nav-toggle")) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "nav-toggle";
  btn.setAttribute("aria-label", "Abrir menú");
  btn.setAttribute("aria-expanded", "false");
  btn.setAttribute("aria-controls", "navPrincipal");
  btn.innerHTML = '<span class="nav-toggle-bar"></span><span class="nav-toggle-bar"></span><span class="nav-toggle-bar"></span>';
  header.insertBefore(btn, nav);

  function setAbierto(abierto) {
    header.classList.toggle("menu-abierto", abierto);
    btn.setAttribute("aria-expanded", String(abierto));
    btn.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
  }

  btn.addEventListener("click", () => setAbierto(!header.classList.contains("menu-abierto")));

  // Se cierra al tocar fuera del header, con Escape, al elegir un link o al pasar a pantalla ancha
  document.addEventListener("click", (e) => { if (!header.contains(e.target)) setAbierto(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setAbierto(false); });
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setAbierto(false); });
  window.addEventListener("resize", () => { if (window.innerWidth > 768) setAbierto(false); });
}
// =======================================================
// INICIO AUTOMÁTICO
// =======================================================
document.addEventListener("DOMContentLoaded", async () => {
  inicializarMenuHamburguesa();   // primero el botón, así no hay saltos de layout
  await actualizarNav();
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
console.log(footer)
if (footer) {
  footer.innerHTML = `
    <div class="eest-footer__top eest-container">
      <div class="eest-footer__brand">
        <img src="../img/logo-tecnica.png" alt="Escudo E.E.S.T. N.º 5">
        <div>
          <strong>E.E.S.T. N.º 5</strong>
          <span>"Gral. Manuel N. Savio" — La Plata</span>
        </div>
        <div class="eest-footer__social">
          <a href="https://www.youtube.com/" target="_blank" rel="noopener" aria-label="YouTube de la escuela" title="YouTube">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4L15.8 12l-6.2 3.6z"/>
            </svg>
          </a>
          <a href="https://www.instagram.com/" target="_blank" rel="noopener" aria-label="Instagram de la escuela" title="Instagram">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor"/>
            </svg>
          </a>
        </div>
      </div>

      <div>
        <h4>Navegación</h4>
        <ul>
          <li><a href="index.html">Inicio</a></li>
          <li><a href="tecnica5.html">Institucional</a></li>
          <li><a href="index.html#noticiasContainer">Noticias</a></li>
          <li><a href="contacto.html">Contacto</a></li>
          <li><a href="preguntas-frecuentes.html">Preguntas frecuentes</a></li>
        </ul>
      </div>

      <div>
        <h4>Especialidades</h4>
        <ul>
          <li><a href="tecnicatura-construccion.html">Construcción</a></li>
          <li><a href="tecnicatura-electromecanica.html">Electromecánica</a></li>
          <li><a href="tecnicatura-quimica.html">Química</a></li>
          <li><a href="tecnicatura-informatica.html">Informática</a></li>
        </ul>
      </div>

      <div>
        <h4>Recursos</h4>
        <ul>
          <li><a href="https://sites.google.com/eest5.com/bibliotecadigital" target="_blank" rel="noopener">Biblioteca escolar</a></li>
          <li><a href="preinscripcion.html">Pre-inscripción</a></li>
        </ul>
      </div>

      <div>
        <h4>Cuenta</h4>
        <ul>
          <li><a href="perfil.html">Mi perfil</a></li>
          <li><a href="login.html">Iniciar sesión</a></li>
          <li><a href="registrarse.html">Registrarse</a></li>
        </ul>
      </div>
    </div>
    <div class="eest-footer__bottom eest-container">
      <span>© 2026 Escuela Técnica - La Plata</span>
    </div>
  `;

}