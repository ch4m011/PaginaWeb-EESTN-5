// perfil.js
// Página "Mi perfil": carga datos del usuario logueado y maneja los 4
// formularios de la página (imagen, nombre, contraseña, eliminar cuenta).
//
// NOTA: este archivo reemplaza una versión anterior que tenía ~9 copias
// acumuladas de esta misma lógica (cada edición se había agregado al final
// en vez de reemplazar la anterior), lo que dejaba varios listeners
// duplicados sobre los mismos formularios y llamadas a endpoints con el
// Content-Type equivocado. Contratos verificados contra el PHP real:
//   - get_user.php                  -> GET,  campos planos (ok, nombre, correo, imagen_perfil...)
//   - actualizar_perfil.php        -> POST JSON      {nombre}
//   - cambiar_contrasena.php       -> POST FormData  (password_actual, password_nueva) — NO admite JSON
//   - actualizar_imagen_perfil.php -> POST FormData con campo "avatar"
//   - eliminar_cuenta.php          -> POST JSON      {password}

const imagenPorDefecto = '../img/logo-tecnica.png';
let usuario = null;

/* ---------- Utilidades ---------- */

// Muestra un mensaje breve en el contenedor #mensajePerfil (definido en perfil.html).
// Si el contenedor no existe todavía en el HTML, usa alert() como respaldo
// para no perder el feedback al usuario.
function mostrarMensaje(texto, tipo = 'ok') {
    const el = document.getElementById('mensajePerfil');
    if (!el) {
        alert(texto);
        return;
    }
    el.textContent = texto;
    el.className = 'mensaje ' + tipo;
    el.style.display = 'block';
    el.style.opacity = '1';

    clearTimeout(mostrarMensaje._timeout);
    mostrarMensaje._timeout = setTimeout(() => {
        el.style.opacity = '0';
        setTimeout(() => { el.style.display = 'none'; }, 300);
    }, 3000);
}

// get_user.php a veces devuelve una ruta completa (../...) y a
// veces solo el nombre de archivo. Esta función normaliza ambos casos.
function resolveAvatarUrl(pathOrFilename) {
    if (!pathOrFilename) return imagenPorDefecto;
    if (/^https?:\/\//i.test(pathOrFilename)) return pathOrFilename;
    if (pathOrFilename.startsWith('/')) return pathOrFilename;
    return '../php/uploads/avatars/' + pathOrFilename.replace(/^\/+/, '');
}

function setBotonCargando(form, cargando) {
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = cargando;
}

/* ---------- Carga inicial ---------- */

async function cargarDatosUsuario() {
    try {
        const resp = await fetch('../php/get_user.php', { credentials: 'same-origin' });
        const data = await resp.json();

        if (!data || !data.ok) {
            mostrarMensaje('No estás autenticado. Redirigiendo al login...', 'error');
            setTimeout(() => { window.location.href = '../html/login.html'; }, 1500);
            return false;
        }

        usuario = {
            nombre: data.nombre,
            correo: data.correo,
            rol: data.rol || 'usuario',
            foto: data.imagen_perfil || null
        };
        return true;
    } catch (err) {
        console.error('[perfil] Error cargando usuario:', err);
        mostrarMensaje('Error al cargar los datos del usuario.', 'error');
        setTimeout(() => { window.location.href = '../html/login.html'; }, 1500);
        return false;
    }
}

function actualizarUI() {
    if (!usuario) return;

    const elNombreHeader = document.getElementById('nombrePerfilHeader');
    if (elNombreHeader) elNombreHeader.textContent = usuario.nombre || 'Usuario';

    const inputNombre = document.getElementById('nombre_completo');
    if (inputNombre) inputNombre.value = usuario.nombre || '';

    const inputCorreo = document.getElementById('correo_usuario');
    if (inputCorreo) inputCorreo.value = usuario.correo || '';

    const imgAvatar = document.getElementById('avatar');
    if (imgAvatar) {
        imgAvatar.src = resolveAvatarUrl(usuario.foto);
        imgAvatar.onerror = () => { imgAvatar.src = imagenPorDefecto; };
    }
}

/* ---------- Formulario: imagen de perfil ---------- */

function configFormImagen() {
    const form = document.getElementById('formImagenPerfil');
    const input = document.getElementById('avatarFile');
    if (!form || !input) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const file = input.files && input.files[0];
        if (!file) {
            mostrarMensaje('Selecciona una imagen primero.', 'error');
            return;
        }
        if (!file.type.startsWith('image/')) {
            mostrarMensaje('El archivo debe ser una imagen.', 'error');
            return;
        }

        const fd = new FormData();
        fd.append('avatar', file);

        setBotonCargando(form, true);
        try {
            const resp = await fetch('../php/actualizar_imagen_perfil.php', {
                method: 'POST',
                credentials: 'same-origin',
                body: fd
            });
            const data = await resp.json();

            if (data.ok) {
                usuario.foto = data.imagen;
                const imgAvatar = document.getElementById('avatar');
                if (imgAvatar) imgAvatar.src = resolveAvatarUrl(data.imagen) + '?t=' + Date.now();
                mostrarMensaje('Imagen actualizada correctamente.', 'ok');
                input.value = '';
            } else {
                mostrarMensaje('Error: ' + (data.error || 'desconocido'), 'error');
            }
        } catch (err) {
            console.error('[perfil] Error subiendo imagen:', err);
            mostrarMensaje('Error al subir la imagen.', 'error');
        } finally {
            setBotonCargando(form, false);
        }
    });
}

/* ---------- Formulario: nombre ---------- */

function configFormPerfil() {
    const form = document.getElementById('formPerfil');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombreInput = document.getElementById('nombre_completo');
        const nuevoNombre = nombreInput?.value?.trim();
        if (!nuevoNombre) {
            mostrarMensaje('El nombre no puede estar vacío.', 'error');
            return;
        }

        setBotonCargando(form, true);
        try {
            const resp = await fetch('../php/actualizar_perfil.php', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: nuevoNombre })
            });
            const data = await resp.json();

            if (data.success) {
                usuario.nombre = nuevoNombre;
                const elNombreHeader = document.getElementById('nombrePerfilHeader');
                if (elNombreHeader) elNombreHeader.textContent = nuevoNombre;
                mostrarMensaje('Perfil actualizado correctamente.', 'ok');
            } else {
                mostrarMensaje('Error: ' + (data.error || 'desconocido'), 'error');
            }
        } catch (err) {
            console.error('[perfil] Error actualizando perfil:', err);
            mostrarMensaje('Error al actualizar el perfil.', 'error');
        } finally {
            setBotonCargando(form, false);
        }
    });
}

/* ---------- Formulario: contraseña ---------- */

function configFormPassword() {
    const form = document.getElementById('formCambioPassword');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const actual = document.getElementById('password_actual')?.value || '';
        const nueva = document.getElementById('password_nueva')?.value || '';
        if (!actual || !nueva) {
            mostrarMensaje('Completa ambos campos de contraseña.', 'error');
            return;
        }

        setBotonCargando(form, true);
        try {
            // cambiar_contrasena.php lee $_POST, así que va como FormData
            // (multipart), no como JSON.
            const resp = await fetch('../php/cambiar_contrasena.php', {
                method: 'POST',
                credentials: 'same-origin',
                body: new FormData(form)
            });
            const data = await resp.json();

            if (data.ok) {
                mostrarMensaje('Contraseña actualizada correctamente.', 'ok');
                form.reset();
            } else {
                mostrarMensaje('Error: ' + (data.error || 'desconocido'), 'error');
            }
        } catch (err) {
            console.error('[perfil] Error cambiando contraseña:', err);
            mostrarMensaje('Error al cambiar la contraseña.', 'error');
        } finally {
            setBotonCargando(form, false);
        }
    });
}

/* ---------- Formulario: eliminar cuenta ---------- */

function configFormEliminar() {
    const form = document.getElementById('formEliminarCuentaReal');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!confirm('¿Seguro que deseas eliminar tu cuenta? Esta acción es irreversible.')) {
            return;
        }

        const password = document.getElementById('passwordDelete')?.value || '';
        if (!password) {
            mostrarMensaje('Ingresa tu contraseña para confirmar.', 'error');
            return;
        }

        setBotonCargando(form, true);
        mostrarModalEliminando(true);
        try {
            const resp = await fetch('../php/eliminar_cuenta.php', {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await resp.json();

            if (data.ok) {
                localStorage.removeItem('usuarioSesion');
                mostrarMensaje('Cuenta eliminada correctamente.', 'ok');
                setTimeout(() => { window.location.href = '../html/index.html'; }, 1200);
            } else {
                mostrarModalEliminando(false);
                mostrarMensaje('Error: ' + (data.error || 'desconocido'), 'error');
            }
        } catch (err) {
            console.error('[perfil] Error eliminando cuenta:', err);
            mostrarModalEliminando(false);
            mostrarMensaje('Error al eliminar la cuenta.', 'error');
        } finally {
            setBotonCargando(form, false);
        }
    });
}

function mostrarModalEliminando(visible) {
    const modal = document.getElementById('modalEliminar');
    const progress = document.getElementById('progress');
    if (!modal) return;
    modal.style.display = visible ? 'block' : 'none';
    if (progress) progress.style.width = visible ? '100%' : '0%';
}

/* ---------- Inicialización ---------- */

document.addEventListener('DOMContentLoaded', async () => {
    const userLoaded = await cargarDatosUsuario();
    if (!userLoaded) return;

    actualizarUI();
    configFormImagen();
    configFormPerfil();
    configFormPassword();
    configFormEliminar();
});
