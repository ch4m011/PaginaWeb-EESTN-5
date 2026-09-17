/**
 * Cargador de noticias desde BD (api_noticias.php)
 * Renderiza en grid con estilos CSS puros (noticias.css)
 * Maneja imágenes opcionales: si no hay imagen, solo muestra texto
 */

let sliderIndex = 0;
let sliderNoticiasGlobal = [];
const sliderIntervalTime = 4000;

/**
 * Cargar todas las noticias desde BD (API)
 */
async function cargarNoticias() {
    console.log('🔄 Cargando noticias desde BD...');
    const cont = document.getElementById('noticiasContainer');
    if (!cont) return;

    try {
        const res = await fetch('../php/api_noticias.php?action=obtener&estado=publicada&limite=50', { 
            cache: 'no-store',
            credentials: 'same-origin'
        });
        
        if (!res.ok) throw new Error('HTTP ' + res.status);
        
        const noticias = await res.json();
        console.log('✅ Noticias cargadas:', noticias.length);
        
        if (!Array.isArray(noticias)) throw new Error('Respuesta no es array');

        // Ordenar por prioridad y fecha
        noticias.sort((a, b) => {
            if ((b.prioridad || 0) !== (a.prioridad || 0)) {
                return (b.prioridad || 0) - (a.prioridad || 0);
            }
            return new Date(b.fecha_creacion || 0) - new Date(a.fecha_creacion || 0);
        });

        renderNoticiasGrid(noticias);
        cargarNoticiasSlider(noticias);
    } catch (err) {
        console.error('❌ Error cargando noticias:', err);
        cont.innerHTML = '<p style="color: #999; text-align: center; padding: 2rem;">No hay noticias disponibles</p>';
    }
}

/**
 * Helper: Extraer SOLO texto limpio del HTML (sin ningún código HTML)
 */
function textFromHtml(html) {
    if (!html) return '';
    try {
        // Remover primero todo lo que no queremos con regex
        let cleaned = html
            .replace(/<img[^>]*>/gi, '')                          // Remover imágenes
            .replace(/<div[^>]*style="[^"]*text-align[^"]*"[^>]*>.*?<\/div>/gi, '')  // Remover divs text-align
            .replace(/data:[^\"'\s>]+/gi, '');                    // Remover data URIs
        
        // Ahora extraer texto del HTML limpio
        const div = document.createElement('div');
        div.innerHTML = cleaned;
        
        // Remover todos los tags HTML restantes
        const text = (div.textContent || div.innerText || '')
            .trim()
            .replace(/\s+/g, ' ')           // Normalizar espacios
            .substring(0, 200);              // Limitar a 200 caracteres
        
        return text || '';
    } catch (e) {
        // fallback: remover tags con regex
        return html
            .replace(/<img[^>]*>/gi, '')
            .replace(/<div[^>]*style="[^"]*text-align[^"]*"[^>]*>.*?<\/div>/gi, '')
            .replace(/<[^>]+>/g, '')
            .replace(/data:[^\"'\s>]+/gi, '')
            .trim()
            .replace(/\s+/g, ' ')
            .substring(0, 200);
    }
}

/**
 * Renderizar grid de noticias con estilos CSS puros
 * Aplica clases de noticias.css para mantener estilos
 */
function renderNoticiasGrid(noticias) {
    const cont = document.getElementById('noticiasContainer');
    if (!cont) return;
    // Si no hay noticias, mostrar placeholder
    if (!Array.isArray(noticias) || noticias.length === 0) {
        cont.innerHTML = '<p style="color: #999; text-align: center; padding: 2rem;">No hay noticias disponibles</p>';
        return;
    }

    // Elegir noticia principal: preferir las marcadas como 'principal', y si hay varias elegir UNA al azar
    const candidatosPrincipal = noticias.filter(n => n.tipo && String(n.tipo).toLowerCase() === 'principal');
    let primary = null;
    if (candidatosPrincipal.length > 0) {
        primary = candidatosPrincipal[Math.floor(Math.random() * candidatosPrincipal.length)];
    } else {
        // Si no hay marcadas, elegir aleatoriamente una de las 6-8 primeras para variar el hero cada carga
        const pool = noticias.slice(0, Math.min(8, noticias.length));
        primary = pool[Math.floor(Math.random() * pool.length)];
    }

    // Preparar secundarias: quitar la primaria y barajar
    const others = noticias.filter(n => String(n.id) !== String(primary.id));
    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    const secundarias = shuffle(others).slice(0, 6);

    // Construir layout estilo "portal de noticias": destacada grande arriba
    // y debajo una grilla pareja de noticias secundarias (inspirado en UNLP)
    const layout = document.createElement('div');
    layout.className = 'noticias-home';

    // -------- Destacada (hero) --------
    const hero = document.createElement('article');
    hero.className = 'news-featured';
    const heroImgSrc = primary.imagen || '../img/logo-tecnica.png';
    const heroExcerpt = escapeHtml(textFromHtml(primary.resumen || primary.contenido).substring(0, 220));
    hero.innerHTML = `
        <a class="news-featured__link" href="../html/ver_noticia.html?id=${encodeURIComponent(primary.id)}">
            <div class="news-featured__media">
                <img class="news-featured__image" src="${escapeHtml(heroImgSrc)}" alt="${escapeHtml(primary.titulo)}" onerror="this.src='../img/logo-tecnica.png'">
                <span class="news-featured__badge">Destacada</span>
                <div class="news-featured__overlay">
                    <h2 class="news-featured__title">${escapeHtml(primary.titulo)}</h2>
                    <p class="news-featured__excerpt">${heroExcerpt}</p>
                    <div class="news-featured__meta">
                        <span class="news-author">${escapeHtml(primary.autor_nombre || primary.nombre || 'Anónimo')}</span>
                        <span class="news-date">${formatearFecha(primary.fecha_creacion)}</span>
                    </div>
                </div>
            </div>
        </a>
    `;

    // -------- Grilla pareja de secundarias --------
    const grid = document.createElement('div');
    grid.className = 'news-grid';

    secundarias.forEach((n) => {
        const card = document.createElement('article');
        card.className = 'news-card';
        card.setAttribute('data-id', n.id);

        const imgSrc = n.imagen || '../img/logo-tecnica.png';
        const excerpt = escapeHtml(textFromHtml(n.resumen || n.contenido).substring(0, 140));
        const autor = escapeHtml(n.autor_nombre || n.nombre || 'Anónimo');
        const autorFoto = n.imagen_perfil || '../img/logo-tecnica.png';

        card.innerHTML = `
            <a class="news-image-link" href="../html/ver_noticia.html?id=${encodeURIComponent(n.id)}">
                <img class="news-image" src="${escapeHtml(imgSrc)}" alt="${escapeHtml(n.titulo)}" onerror="this.src='../img/logo-tecnica.png'">
            </a>
            <div class="news-body">
                <h3 class="news-title"><a href="../html/ver_noticia.html?id=${encodeURIComponent(n.id)}">${escapeHtml(n.titulo)}</a></h3>
                <p class="news-excerpt">${excerpt}</p>
                <div class="news-meta">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <img src="${escapeHtml(autorFoto)}" alt="${autor}" style="width:24px;height:24px;border-radius:50%;object-fit:cover;" onerror="this.src='../img/logo-tecnica.png'">
                        <span class="news-author">${autor}</span>
                    </div>
                    <span class="news-date">${formatearFecha(n.fecha_creacion)}</span>
                </div>
            </div>
        `;

        grid.appendChild(card);
    });

    layout.appendChild(hero);
    layout.appendChild(grid);

    cont.innerHTML = '';
    cont.appendChild(layout);
    console.log('✅ Grid renderizado: destacada +', secundarias.length, 'secundarias');
}

/**
 * Cargar slider con las primeras 5 noticias
 */
function cargarNoticiasSlider(noticias) {
    const cont = document.getElementById('noticiasSlider');
    if (!cont) return;

    sliderNoticiasGlobal = noticias.slice(0, 5);
    cont.innerHTML = '';

    if (sliderNoticiasGlobal.length === 0) return;
    // Crear slides apiladas para efecto 'fade' con contenido profesional
    sliderNoticiasGlobal.forEach((n, i) => {
        const a = document.createElement('a');
        a.href = '../html/ver_noticia.html?id=' + encodeURIComponent(n.id);
        a.className = 'slide';

        // Imagen o placeholder
        if (n.imagen && String(n.imagen).trim() !== '') {
            const img = document.createElement('img');
            img.src = n.imagen;
            img.alt = n.titulo;
            img.onerror = function() { this.src = '../img/logo-tecnica.png'; };
            a.appendChild(img);
        } else {
            const img = document.createElement('img');
            img.src = '../img/logo-tecnica.png';
            img.alt = n.titulo;
            a.appendChild(img);
        }

        // Contenido de la noticia: solo título (imagen es clicable hacia la noticia)
        const contentDiv = document.createElement('div');
        contentDiv.className = 'slide-content';
        const title = document.createElement('h2');
        title.textContent = n.titulo || 'Sin título';
        contentDiv.appendChild(title);
        a.appendChild(contentDiv);

        // Marcar la primera como activa
        if (i === 0) a.classList.add('activo');

        cont.appendChild(a);
    });

    agregarPuntosSlider();
    // Inicializar slider y autoplay
    inicializarSlider();
    if (window.sliderIntervalId) clearInterval(window.sliderIntervalId);
    window.sliderIntervalId = setInterval(() => {
        sliderIndex = (sliderIndex + 1) % sliderNoticiasGlobal.length;
        mostrarSlide(sliderIndex);
    }, sliderIntervalTime);

    console.log('✅ Slider cargado con', sliderNoticiasGlobal.length, 'noticias');
}

/**
 * Mostrar el slide activo
 */
function mostrarSlide(index) {
    const cont = document.getElementById('noticiasSlider');
    const slides = cont ? Array.from(cont.querySelectorAll('.slide')) : [];
    const puntos = document.querySelectorAll('#puntosSlider span');

    if (slides.length === 0) return;

    // Ajustar índice en rango
    index = ((index % slides.length) + slides.length) % slides.length;
    sliderIndex = index;

    slides.forEach((s, i) => {
        if (i === index) s.classList.add('activo');
        else s.classList.remove('activo');
    });

    puntos.forEach((p, i) => {
        if (i === index) p.classList.add('activo');
        else p.classList.remove('activo');
    });
}

/**
 * Inicializar el slider: asegurar primer slide visible sin transición
 */
function inicializarSlider() {
    const cont = document.getElementById('noticiasSlider');
    if (!cont) return;
    const slides = Array.from(cont.querySelectorAll('.slide'));
    const puntos = document.querySelectorAll('#puntosSlider span');

    slides.forEach((s, i) => {
        if (i === 0) s.classList.add('activo');
        else s.classList.remove('activo');
    });

    puntos.forEach((p, i) => {
        if (i === 0) p.classList.add('activo');
        else p.classList.remove('activo');
    });
}

/**
 * Crear puntos de navegación para el slider
 */
function agregarPuntosSlider() {
    let puntosCont = document.getElementById('puntosSlider');
    if (!puntosCont) {
        puntosCont = document.createElement('div');
        puntosCont.id = 'puntosSlider';
        puntosCont.className = 'puntos-slider';
        const slider = document.querySelector('.slider');
        if (slider) slider.appendChild(puntosCont);
    }

    puntosCont.innerHTML = '';
    sliderNoticiasGlobal.forEach((_, i) => {
        const span = document.createElement('span');
        span.addEventListener('click', () => {
            sliderIndex = i;
            mostrarSlide(sliderIndex);
        });
        puntosCont.appendChild(span);
    });
}

/**
 * Escapar HTML para seguridad
 */
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

/**
 * Formatear fecha al formato local
 */
function formatearFecha(fecha) {
    if (!fecha) return '';
    try {
        return new Date(fecha).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        return '';
    }
}

/**
 * Inicializar cuando carga el DOM
 */
document.addEventListener('DOMContentLoaded', function () {
    cargarNoticias();
});

// Alternativa: si el DOM ya está cargado antes de que este script se ejecute
if (document.readyState !== 'loading') {
    cargarNoticias();
}
