// Variables globales
let usuario = null;
const imagenPorDefecto = "../img_logo/logo-tecnica.png";

// Cargar usuario desde localStorage o backend
async function cargarDatosUsuario() {
    // Primero intentar getUser.php (sesión del servidor) - PRIORIDAD
    // Esto asegura que siempre obtenemos los datos correctos del servidor
    try {
        const resp = await fetch('../php/getUser.php', { credentials: 'same-origin' });
        const data = await resp.json();
        if (data && data.ok) {
            usuario = {
                nombre: data.nombre,
                correo: data.correo,
                rol: data.rol || 'usuario',
                foto: data.imagen_perfil || null
            };
            console.log('[perfil] Usuario cargado desde getUser.php (servidor):', usuario);
            // Sincronizar localStorage con los datos del servidor
            localStorage.setItem('usuarioSesion', JSON.stringify(usuario));
            return true;
        } else {
            console.error('[perfil] Usuario no autenticado:', data);
            alert('No estás autenticado. Por favor, inicia sesión.');
            window.location.href = '../pagina/login.html';
            return false;
        }
    } catch (err) {
        console.error('[perfil] Error cargando usuario desde getUser.php:', err);
        alert('Error al cargar los datos del usuario. Por favor, intenta nuevamente.');
        window.location.href = '../pagina/login.html';
        return false;
    }

    // Si getUser.php falla, intenta localStorage (como fallback)
    const usuarioGuardado = localStorage.getItem("usuarioSesion");
    if (usuarioGuardado) {
        usuario = JSON.parse(usuarioGuardado);
        console.log('[perfil] Usuario cargado desde localStorage (fallback):', usuario);
        return true;
    }

    // Si no hay usuario en ningún lado, redirigir a login
    console.warn('[perfil] No se encontró usuario. Redirigiendo a login...');
    window.location.href = '../pagina/login.html';
    return false;
}

// Actualizar UI con los datos del usuario
function actualizarUI() {
    if (!usuario) return;

    // Actualizar nombre
    const elNombreHeader = document.getElementById('nombrePerfilHeader');
    if (elNombreHeader) {
        elNombreHeader.textContent = usuario.nombre || 'Usuario';
    } else {
        console.warn('Elemento nombrePerfilHeader no encontrado en el DOM.');
    }

    const inputNombre = document.getElementById('nombre_completo');
    if (inputNombre) inputNombre.value = usuario.nombre || '';

    // Actualizar correo
    const inputCorreo = document.getElementById('correo_usuario');
    if (inputCorreo) inputCorreo.value = usuario.correo || '';

    // Actualizar avatar (manejo seguro de `foto`)
    const imgAvatar = document.getElementById('avatar');
    if (imgAvatar) {
        imgAvatar.src = usuario?.foto || imagenPorDefecto;
        imgAvatar.onerror = () => { imgAvatar.src = imagenPorDefecto; };
    }

    console.log('[perfil] UI actualizada con datos del usuario');
}

// Manejo del formulario de nombre
function configFormPerfil() {
    const formPerfil = document.getElementById('formPerfil');
    if (!formPerfil) return;

    formPerfil.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombreInput = document.getElementById('nombre_completo');
        const nuevoNombre = nombreInput?.value?.trim();
        if (!nuevoNombre) {
            alert('El nombre no puede estar vacío');
            return;
        }

        const btn = formPerfil.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;

        try {
            const resp = await fetch('/web-escolar/php/actualizar_perfil.php', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre: nuevoNombre })
            });

            const data = await resp.json();
            if (data.success || data.ok) {
                usuario.nombre = nuevoNombre;
                localStorage.setItem('usuarioSesion', JSON.stringify(usuario));
                const elNombreHeader = document.getElementById('nombrePerfilHeader');
                if (elNombreHeader) elNombreHeader.textContent = nuevoNombre;
                alert('Perfil actualizado correctamente');
            } else {
                alert('Error: ' + (data.error || data.message || 'desconocido'));
            }
        } catch (err) {
            console.error('[perfil] Error actualizar_perfil:', err);
            alert('Error al actualizar perfil');
        } finally {
            if (btn) btn.disabled = false;
        }
    });
}

// Manejo del formulario de imagen
function configFormImagen() {
    const form = document.getElementById('formImagenPerfil');
    const input = document.getElementById('avatarFile');
    if (!form || !input) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!input.files || !input.files[0]) {
            alert('Selecciona una imagen primero');
            return;
        }

        const fd = new FormData();
        fd.append('avatar', input.files[0]);

        const btn = form.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;

        try {
            const resp = await fetch('/web-escolar/php/actualizar_imagen_perfil.php', {
                method: 'POST',
                credentials: 'include',
                body: fd
            });

            const data = await resp.json();
            if (data.ok) {
                const imgAvatar = document.getElementById('avatar');
                if (imgAvatar && data.imagen) {
                    imgAvatar.src = data.imagen;
                    usuario.foto = data.imagen;
                    localStorage.setItem('usuarioSesion', JSON.stringify(usuario));
                }
                alert('Imagen actualizada correctamente');
                input.value = ''; // Limpiar input
            } else {
                alert('Error: ' + (data.error || 'desconocido'));
            }
        } catch (err) {
            console.error('[perfil] Error subida imagen:', err);
            alert('Error al subir imagen');
        } finally {
            if (btn) btn.disabled = false;
        }
    });
}

// Manejo del formulario de cambio de contraseña
function configFormPassword() {
    const form = document.getElementById('formCambioPassword');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const passwordActual = document.getElementById('password_actual')?.value || '';
        const passwordNueva = document.getElementById('password_nueva')?.value || '';

        if (!passwordActual || !passwordNueva) {
            alert('Por favor completa todos los campos');
            return;
        }

        const btn = form.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;

        try {
            const resp = await fetch('/web-escolar/php/cambiar_contrasena.php', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    password_actual: passwordActual,
                    password_nueva: passwordNueva
                })
            });

            const data = await resp.json();
            if (data.ok) {
                alert('Contraseña actualizada correctamente');
                form.reset();
            } else {
                alert('Error: ' + (data.error || 'desconocido'));
            }
        } catch (err) {
            console.error('[perfil] Error cambiar_contrasena:', err);
            alert('Error al cambiar contraseña');
        } finally {
            if (btn) btn.disabled = false;
        }
    });
}

// Manejo del formulario de eliminar cuenta
function configFormEliminar() {
    const form = document.getElementById('formEliminarCuentaReal');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!confirm('¿Seguro que deseas eliminar tu cuenta? Esta acción es irreversible.')) {
            return;
        }

        const passwordDelete = document.getElementById('passwordDelete')?.value || '';
        if (!passwordDelete) {
            alert('Por favor ingresa tu contraseña');
            return;
        }

        const btn = form.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;

        try {
            const resp = await fetch('/web-escolar/php/eliminar_cuenta.php', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: passwordDelete })
            });

            const data = await resp.json();
            if (data.ok) {
                localStorage.removeItem('usuarioSesion');
                alert('Cuenta eliminada correctamente');
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 1000);
            } else {
                alert('Error: ' + (data.error || 'desconocido'));
            }
        } catch (err) {
            console.error('[perfil] Error eliminar_cuenta:', err);
            alert('Error al eliminar cuenta');
        } finally {
            if (btn) btn.disabled = false;
        }
    });
}

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[perfil] Iniciando...');
    
    // Cargar datos
    const userLoaded = await cargarDatosUsuario();
    if (!userLoaded) return;

    // Actualizar UI
    actualizarUI();

    // Configurar formularios
    configFormPerfil();
    configFormImagen();
    configFormPassword();
    configFormEliminar();

    console.log('[perfil] Inicialización completada');
});
// Fin del script
function mostrarMensaje(texto, tipo = 'ok') {
    const mensajePerfil = document.getElementById("mensajePerfil");
    if (!mensajePerfil) return;
    
    mensajePerfil.textContent = texto;
    mensajePerfil.className = "mensaje " + tipo;
    mensajePerfil.style.display = "block";
    
    setTimeout(() => {
        mensajePerfil.style.opacity = "0";
        setTimeout(() => {
            mensajePerfil.textContent = "";
            mensajePerfil.className = "mensaje";
            mensajePerfil.style.opacity = "1";
        }, 300);
    }, 3000);
}

// helper: añade listener solo si existe el elemento
function safeAddListener(id, event, handler) {
    const el = document.getElementById(id);
    if (!el) {
        console.warn(`safeAddListener: elemento "${id}" no encontrado. Listener omitido.`);
        return;
    }
    el.addEventListener(event, handler);
}

document.addEventListener("DOMContentLoaded", () => {
    // Cargar usuario del localStorage
    try {
        const usuarioGuardado = localStorage.getItem("usuarioSesion");
        if (!usuarioGuardado) {
            console.log("No se encontró usuario en sesión");
            window.location.href = "login.html";
            return;
        }
        usuario = JSON.parse(usuarioGuardado);
        console.log("Usuario cargado:", usuario);
    } catch (error) {
        console.error("Error cargando usuario:", error);
        window.location.href = "login.html";
        return;
    }

    // Actualizar elementos del DOM
    const imgPerfil = document.getElementById("imgPerfil");
    const headerImgPerfil = document.querySelector(".header-imagen-perfil img");
    const nombreUsuario = document.getElementById("nombreUsuario");
    const nombreInput = document.getElementById("nombre");
    const correoInput = document.getElementById("correo");

    // Actualizar nombre
    if (nombreUsuario) nombreUsuario.textContent = usuario.nombre || 'Usuario';
    if (nombreInput) nombreInput.value = usuario.nombre || '';
    if (correoInput) correoInput.value = usuario.correo || '';

    // Actualizar imágenes
    if (imgPerfil) {
        imgPerfil.src = usuario.foto || imagenPorDefecto;
        imgPerfil.onerror = () => manejarErrorImagen(imgPerfil);
    }

    if (headerImgPerfil) {
        headerImgPerfil.src = usuario.foto || imagenPorDefecto;
        headerImgPerfil.onerror = () => manejarErrorImagen(headerImgPerfil);
    }

    // Subir imagen de perfil
    const formImagenPerfil = document.getElementById('formImagenPerfil');
    if (formImagenPerfil) {
        formImagenPerfil.addEventListener('submit', async function (e) {
            e.preventDefault();
            const mensajePerfil = document.getElementById("mensajePerfil");
            const input = document.getElementById("imagenPerfil");
            
            if (!input.files || !input.files[0]) {
              mostrarMensaje("Por favor, selecciona una imagen.", "error");
              return;
            }
            
            const file = input.files[0];
            // Validar tipo y tamaño (máx 2MB)
            if (!file.type.startsWith("image/") || file.size > 2*1024*1024) {
              mostrarMensaje("Solo se permiten imágenes (máx 2MB).", "error");
              return;
            }

            const reader = new FileReader();
            reader.onload = async function(ev) {
              const base64Image = ev.target.result;
              console.log('Enviando imagen (tamaño base64):', base64Image.length);

              try {
                const response = await fetch("../php/actualizar_imagen_perfil.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        correo: usuario && usuario.correo ? usuario.correo : null,
                        foto: base64Image
                    })
                });

                const raw = await response.text();
                console.log("Respuesta cruda del servidor:", raw);

                let result;
                try {
                    result = JSON.parse(raw);
                } catch (err) {
                    console.error("Respuesta no JSON recibida:", err);
                    throw new Error("Respuesta del servidor no válida (no JSON). Revisa php/debug.txt");
                }

                if (!result.success) {
                    throw new Error(result.message || "Error desconocido en servidor");
                }

                if (imgPerfil) imgPerfil.src = base64Image;
                if (headerImgPerfil) headerImgPerfil.src = base64Image;
                usuario.foto = base64Image;
                localStorage.setItem("usuarioSesion", JSON.stringify(usuario));

                mostrarMensaje("Imagen actualizada correctamente", "ok");

              } catch (error) {
                console.error("Error al subir imagen:", error);
                mostrarMensaje("Error al subir imagen: " + error.message, "error");
              }
            };
            
            mostrarMensaje("Procesando imagen...", "info");
            reader.readAsDataURL(file);
        });
    } else {
        console.warn('formImagenPerfil no encontrado en DOM.');
    }

    // Guardar cambios de nombre
    const formPerfil = document.getElementById('formPerfil');
    if (formPerfil) {
        // evitar añadir más de un listener
        if (!formPerfil.dataset.listenerAttached) {
            formPerfil.dataset.listenerAttached = 'true';

            formPerfil.addEventListener('submit', async function (e) {
                e.preventDefault();

                const btn = formPerfil.querySelector('button[type="submit"], .btn-guardar');
                if (btn) btn.disabled = true;

                const nombreInput = document.getElementById('nombre_completo');
                const nuevoNombre = nombreInput?.value?.trim();
                if (!nuevoNombre) {
                    alert('El nombre no puede estar vacío');
                    if (btn) btn.disabled = false;
                    return;
                }

                try {
                    console.debug('Enviando actualizar_perfil (solo 1 request)');
                    const resp = await fetch('/web-escolar/php/actualizar_perfil.php', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nombre: nuevoNombre })
                    });

                    const texto = await resp.text();
                    let data;
                    try {
                        data = JSON.parse(texto);
                    } catch (parseErr) {
                        console.error('Respuesta no JSON actualizar_perfil:', texto);
                        alert('Error del servidor: respuesta inválida. Revisá logs PHP.');
                        if (btn) btn.disabled = false;
                        return;
                    }

                    if (data.success || data.ok) {
                        // actualizar UI sin recargar
                        const elNombreHeader = document.getElementById('nombrePerfilHeader');
                        if (elNombreHeader) elNombreHeader.textContent = nuevoNombre;
                        if (nombreInput) nombreInput.value = nuevoNombre;
                        alert('Perfil actualizado correctamente');
                    } else {
                        alert('Error al actualizar perfil: ' + (data.message || data.error || 'desconocido'));
                    }
                } catch (err) {
                    console.error('Error actualizar_perfil:', err);
                    alert('Error al actualizar perfil (red o servidor).');
                } finally {
                    if (btn) btn.disabled = false;
                }
            });
        }
    } else {
        console.warn('formPerfil no encontrado en DOM.');
    }

    // Cambiar contraseña (nuevo formulario)
    document.getElementById('formCambioPassword')?.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        
        try {
            const response = await fetch('../php/cambiar_contrasena.php', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });
            
            const text = await response.text();
            try {
                const data = JSON.parse(text);
                if (data.ok) {
                    alert('Contraseña actualizada correctamente');
                    this.reset();
                } else {
                    alert(data.error || 'Error al cambiar la contraseña');
                }
            } catch (e) {
                console.error('Respuesta del servidor:', text);
                alert('Error en el formato de respuesta del servidor');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al procesar la solicitud');
        }
    });

    // Cambiar contraseña (seguro)
    const formCambioPass = document.getElementById('formCambioPass');
    if (formCambioPass) {
        formCambioPass.addEventListener('submit', async function (e) {
            e.preventDefault();
            const actualEl = document.getElementById('actual');
            const nuevaEl = document.getElementById('nueva');
            const actual = actualEl ? actualEl.value.trim() : '';
            const nueva = nuevaEl ? nuevaEl.value.trim() : '';

            if (!actual || !nueva) {
                mostrarMensaje('Por favor, completa todos los campos', 'error');
                return;
            }

            try {
                const res = await fetch('../php/cambiar_contrasena.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ correo: usuario?.correo, passwordActual: actual, passwordNueva: nueva })
                });

                const text = await res.text();
                let result;
                try { result = JSON.parse(text); } catch { throw new Error('Respuesta no válida del servidor'); }

                if (result.success) {
                    mostrarMensaje('✅ Contraseña actualizada correctamente', 'ok');
                    if (actualEl) actualEl.value = '';
                    if (nuevaEl) nuevaEl.value = '';
                } else {
                    mostrarMensaje(result.message || 'Error al cambiar contraseña', 'error');
                }
            } catch (err) {
                console.error('Error cambiar contraseña:', err);
                mostrarMensaje('Error al conectar con el servidor', 'error');
            }
        });
    } else {
        console.warn('formCambioPass no encontrado en el DOM.');
    }

    // Eliminar cuenta
    const formEliminar = document.getElementById('formEliminar');
    if (formEliminar) {
      formEliminar.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!usuario || !usuario.correo) {
          mostrarMensaje('No hay usuario en sesión', 'error');
          return;
        }
        if (!confirm('¿Seguro que deseas eliminar tu cuenta? Esta acción es irreversible.')) return;

        try {
          const resp = await fetch('../php/eliminar_cuenta.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo: usuario.correo })
          });

          const text = await resp.text();
          let data;
          try { data = JSON.parse(text); } catch {
            throw new Error('Respuesta no válida del servidor');
          }

          if (!data.success) throw new Error(data.message || 'No se pudo eliminar la cuenta');

          // Limpiar sesión y redirigir al inicio
          localStorage.removeItem('usuarioSesion');
          mostrarMensaje('Cuenta eliminada correctamente', 'ok');
          setTimeout(() => { window.location.href = '../index.html'; }, 1200);

        } catch (err) {
          console.error('Error eliminar cuenta:', err);
          mostrarMensaje('Error al eliminar cuenta: ' + err.message, 'error');
        }
      });
    } else {
      console.warn('formEliminar no encontrado en DOM; no se añadirá handler de eliminar cuenta.');
    }

    // Este handler está pendiente de implementación
    safeAddListener('formEliminarCuenta', 'submit', function (e) {
        e.preventDefault();
        console.warn('formEliminarCuenta handler invocado (implementación pendiente).');
    });

    document.getElementById('formEliminarCuenta')?.addEventListener('submit', async function (e) {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);

        try {
            const resp = await fetch('/confirmar_borrado.php', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin' // importante para que el navegador acepte Set-Cookie
            });

            const text = await resp.text();
            const data = (() => {
                try { return JSON.parse(text); } catch { return { _raw: text }; }
            })();

            if (!resp.ok) {
                throw new Error(data.error || data.message || data._raw || 'Error del servidor');
            }

            // limpiar storage cliente
            try { localStorage.clear(); sessionStorage.clear(); } catch(e){}

            // forzar recarga de la página inicial desde el servidor para que el header se renderice como visitante
            const home = data.redirect || '/';
            window.location.replace(home + '?_logout=' + Date.now());
        } catch (err) {
            console.error('Error eliminar cuenta:', err);
            alert('No se pudo eliminar la cuenta: ' + (err.message || err));
        }
    });

}); // fin DOMContentLoaded

/* Inicialización segura: asocia handlers sólo si existen elementos y funciones */
(function(){
  function byId(id){ return document.getElementById(id) || null; }
  function safeAddListener(el, evt, handler){
    if (!el) { console.warn('safeAddListener: elemento no encontrado', el); return false; }
    el.addEventListener(evt, handler);
    return true;
  }

  document.addEventListener('DOMContentLoaded', function(){
    var formImg = byId('formImagenPerfil');
    if (formImg) {
      // Si existe una función enviarImagen definida en el archivo, úsala; si no, fallback con FormData -> action
      if (typeof window.enviarImagen === 'function') {
        safeAddListener(formImg, 'submit', function(e){ e.preventDefault(); window.enviarImagen(e); });
      } else {
        safeAddListener(formImg, 'submit', function(e){
          e.preventDefault();
          var fileInput = formImg.querySelector('input[type="file"], input[name="avatar"], input[name="imagen"]');
          if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            console.warn('formImagenPerfil: input file vacío o no encontrado');
            return;
          }
          var fd = new FormData(formImg);
          var url = formImg.action || '../php/actualizar_imagen_perfil.php';
          fetch(url, { method: 'POST', body: fd })
            .then(r => r.json().catch(()=>({ok:false,raw:true})))
            .then(resp => {
              if (resp && resp.ok) { console.log('Imagen subida OK', resp); location.reload(); }
              else { console.error('Error subida imagen', resp); alert('Error al subir imagen'); }
            })
            .catch(err => { console.error('Fetch error', err); alert('Error de red al subir la imagen'); });
        });
      }
    } else {
      console.warn('formImagenPerfil no presente en DOM.');
    }

    // otros formularios: sólo añadir listeners si existen (no cambia lógica)
    var ids = ['formPerfil','formPassword','formCambioPass','formEliminar','formEliminarCuenta'];
    ids.forEach(function(id){
      var f = byId(id);
      if (f && typeof window[id+'Handler'] === 'function') {
        safeAddListener(f,'submit', function(e){ e.preventDefault(); window[id+'Handler'](e); });
      }
    });
  });
})();

document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('formImagenPerfil');
    if (!form) {
        console.warn('formImagenPerfil no existe en DOM.');
        return;
    }
    if (form.dataset._uploadListenerAttached) return;
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var input = form.querySelector('input[type="file"][name="avatar"]');
        if (!input) { alert('No se encontró input file (name="avatar") en el formulario.'); return; }
        if (!input.files || input.files.length === 0) { alert('Seleccioná una imagen antes de subir.'); return; }
        var fd = new FormData(form);
        // si necesitás enviar user_id: fd.append('user_id', <ID>);
        var url = form.action || '../php/actualizar_imagen_perfil.php';
        console.log('Enviando imagen a', url);
        fetch(url, { method: 'POST', body: fd })
            .then(function (res) { return res.text().then(function (t) { return { status: res.status, text: t }; }); })
            .then(function (r) {
                console.log('Respuesta raw:', r);
                try {
                    var j = JSON.parse(r.text);
                    console.log('JSON recibido:', j);
                    if (j.ok) { alert('Imagen subida correctamente.'); location.reload(); }
                    else { alert('Error al subir: ' + (j.error || JSON.stringify(j))); }
                } catch (err) {
                    console.error('No JSON. Content:', r.text);
                    alert('Respuesta del servidor no es JSON. Mirar consola (Network -> Response).');
                }
            })
            .catch(function (err) { console.error('Fetch error:', err); alert('Error de red al subir la imagen'); });
    });
    form.dataset._uploadListenerAttached = '1';
});

document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos del usuario
    fetch('../php/getUser.php', {
        method: 'GET',
        credentials: 'same-origin' // <- importante: envía la cookie de sesión
    })
        .then(r => r.json())
        .then(data => { console.log('getUser response', data); /* ... */ });

    // Manejar subida de imagen
    const formImagen = document.getElementById('formImagenPerfil');
    if (formImagen) {
        formImagen.addEventListener('submit', function(e) {
            e.preventDefault();
            const fileInput = this.querySelector('input[type="file"]');
            if (fileInput && fileInput.files.length > 0) {
                const formData = new FormData(this);
                fetch('../php/actualizar_imagen_perfil.php', {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin' // <- importante para enviar la cookie de sesión
                })
                .then(r => r.json())
                .then(resp => {
                    if (resp.ok) {
                        alert('Imagen actualizada correctamente');
                        location.reload();
                    } else {
                        alert('Error: ' + (resp.error || 'Error desconocido'));
                    }
                })
                .catch(err => console.error('Error:', err));
            }
        });
    }

    // Manejar actualización de nombre
    const formPerfil = document.getElementById('formActualizarPerfil');
    if (formPerfil) {
        formPerfil.addEventListener('submit', function(e) {
            e.preventDefault();
            const data = {
                nombre: document.getElementById('nombreUsuario').value
            };
            fetch('../php/actualizar_perfil.php', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(data)
            })
            .then(r => r.json())
            .then(resp => {
                if (resp.ok) {
                    alert('Perfil actualizado correctamente');
                } else {
                    alert('Error: ' + (resp.error || 'Error desconocido'));
                }
            })
            .catch(err => console.error('Error:', err));
        });
    }
});

function actualizarImagenPerfil(rutaImagen) {
    const contenedorPerfil = document.querySelector('.perfil-letra');
    if (!contenedorPerfil) return;

    // Ocultar la letra
    contenedorPerfil.style.display = 'none';

    // Buscar o crear el elemento img
    let imgPerfil = document.querySelector('.perfil-imagen');
    if (!imgPerfil) {
        imgPerfil = document.createElement('img');
        imgPerfil.className = 'perfil-imagen';
        // Mantener el estilo circular
        imgPerfil.style.width = '100%';
        imgPerfil.style.height = '100%';
        imgPerfil.style.objectFit = 'cover';
        imgPerfil.style.borderRadius = '50%';
        contenedorPerfil.parentNode.appendChild(imgPerfil);
    }

    // Actualizar la imagen
    imgPerfil.src = resolveAvatarUrl(rutaImagen) + '?t=' + Date.now();
    imgPerfil.onerror = () => { imgPerfil.src = imagenPorDefecto; };
}

// Modificar la función de subida para usar la nueva función
function subirImagen(event) {
    event.preventDefault();
    
    const form = event.target;
    const fileInput = form.querySelector('input[type="file"]');
    
    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
        alert('Por favor selecciona una imagen primero');
        return;
    }

    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    fetch('../php/actualizar_imagen_perfil.php', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin' // <- importante para enviar la cookie de sesión
    })
    .then(response => response.json())
    .then(data => {
        if (data.ok && data.ruta) {
            actualizarImagenPerfil(data.ruta);
            alert('Imagen actualizada correctamente');
        } else {
            throw new Error(data.error || 'Error desconocido');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error al subir la imagen: ' + error.message);
    })
    .finally(() => {
        if (submitButton) submitButton.disabled = false;
    });
}

// Cargar la imagen al iniciar la página
document.addEventListener('DOMContentLoaded', function() {
    // Agregar listener para el formulario
    const formImagen = document.getElementById('formImagenPerfil');
    if (formImagen && !formImagen.dataset.hasListener) {
        formImagen.addEventListener('submit', subirImagen);
        formImagen.dataset.hasListener = 'true';
    }

    // Cargar imagen existente si hay
    fetch('../php/getUser.php')
        .then(r => r.json())
        .then(user => {
            if (user.ok && user.imagen_perfil) {
                actualizarImagenPerfil(user.imagen_perfil);
            }
        })
        .catch(console.error);
});

function actualizarUIConUsuario(user) {
    // user es el objeto devuelto por getUser.php
    const nombreInput = document.getElementById('nombreCompleto');
    const emailInput = document.getElementById('emailUsuario');
    const avatarEl = document.getElementById('avatarUsuario'); // ejemplo

    if (nombreInput) nombreInput.value = user.nombre || '';
    if (emailInput) emailInput.value = user.correo || '';
    if (avatarEl && user.imagen_perfil) avatarEl.src = user.imagen_perfil;
}

function cargarDatosUsuario() {
    // eliminar cualquier cache local para evitar valores “pegados”
    try { localStorage.removeItem('usuario_cached'); sessionStorage.removeItem('usuario_cached'); } catch(e){}

    fetch('../php/getUser.php', { method: 'GET', credentials: 'same-origin' })
        .then(r => r.json())
        .then(resp => {
            console.log('getUser response', resp);
            if (!resp || !resp.ok) {
                // no autenticado: limpiar UI y/o redirigir al login
                actualizarUIConUsuario({ nombre: '', correo: '' });
                return;
            }
            const user = { id: resp.id, nombre: resp.nombre, correo: resp.correo, imagen_perfil: resp.imagen_perfil || null };
            actualizarUIConUsuario(user);
        })
        .catch(err => console.error('Error getUser:', err));
}
document.addEventListener('DOMContentLoaded', cargarDatosUsuario);

// Función para mostrar el modal con progreso
function mostrarModal(mensaje) {
    const modal = document.getElementById('modalEliminar');
    const mensajeEl = document.getElementById('mensajeEliminar');
    const progress = document.getElementById('progress');
    
    if (mensajeEl) mensajeEl.textContent = mensaje;
    if (modal) modal.style.display = 'block';
    if (progress) progress.style.width = '0%';

    let width = 0;
    const interval = setInterval(() => {
        if (width >= 100) {
            clearInterval(interval);
        } else {
            width += 2;
            if (progress) progress.style.width = width + '%';
        }
    }, 100); // 5 segundos total
}

// Función para eliminar cuenta
async function eliminarCuenta(e) {
    e.preventDefault();
    console.log('DEBUG: eliminarCuenta inicio');

    const form = e.target;
    const password = form.querySelector('[name="password_confirm"]')?.value;
    if (!password) {
        alert('Por favor ingresa tu contraseña para confirmar');
        return;
    }

    const btn = form.querySelector('button');
    if (btn) { btn.disabled = true; btn.dataset.text = btn.textContent; btn.textContent = 'Eliminando...'; }

    fetch('../php/eliminar_cuenta.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password })
    })
    .then(async response => {
        console.log('DEBUG: fetch response status', response.status);
        const text = await response.text();
        console.log('DEBUG: raw response text:', text);
        try {
            const json = JSON.parse(text);
            console.log('DEBUG: parsed JSON:', json);
            return json;
        } catch (err) {
            throw new Error('Respuesta no JSON: ' + text);
        }
    })
    .then(data => {
        console.log('DEBUG: parsed JSON:', data);
        if (data.ok) {
            // Mostrar mensaje visible encima del botón
            const mensajeEl = document.getElementById('mensajeEliminarCuenta');
            if (mensajeEl) {
                mensajeEl.textContent = 'Cuenta eliminada correctamente. Serás redirigido en 5 segundos...';
                mensajeEl.style.display = 'block';
            } else {
                alert('Cuenta eliminada correctamente. Serás redirigido en 5 segundos...');
            }

            // Esperar 5 segundos y luego limpiar cliente + redirigir
            setTimeout(async () => {
                // Intentar logout en servidor
                try {
                    await fetch('../php/logout.php', { method: 'POST' });
                } catch (e) {
                    console.warn('Logout falló:', e);
                }
                // Limpiar almacenamiento y cookies del cliente
                try { sessionStorage.clear(); localStorage.clear(); } catch(e){/* noop */ }
                document.cookie.split(";").forEach(c => {
                    const name = c.split('=')[0].trim();
                    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;";
                });
                // Redirigir forzando recarga
                window.location.href = '../index.html?ts=' + Date.now();
            }, 5000);

        } else {
            throw new Error(data.error || 'Error desconocido');
        }
    })
    .catch(err => {
        console.error('DEBUG: eliminarCuenta error:', err);
        alert('Error al eliminar: ' + err.message);
        if (btn) { btn.disabled = false; btn.textContent = btn.dataset.text || 'Eliminar cuenta'; }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const formEliminar = document.getElementById('formEliminarCuentaReal') || document.getElementById('formEliminarCuenta');
    if (formEliminar) {
        formEliminar.removeEventListener('submit', eliminarCuenta);
        formEliminar.addEventListener('submit', eliminarCuenta);
        console.log('DEBUG: listener eliminarCuenta añadido a', formEliminar.id);
    } else {
        console.warn('DEBUG: formEliminar no encontrado en DOM');
    }
});
// Reemplazado: uso seguro de la variable de sesión 'usuario' en vez de 'data' indefinida
const usernameEliminar = document.getElementById('usernameEliminar');
if (usernameEliminar) {
    // Si existe el objeto 'usuario' (lo cargas desde localStorage al iniciar), úsalo.
    // Si no, dejar campo vacío para evitar errores.
    usernameEliminar.value = (typeof usuario === 'object' && usuario && usuario.correo) ? usuario.correo : '';
}

// nueva función para manejo centralizado de eliminación de cuenta
async function postEliminacionCliente() {
    try { await fetch('../php/logout.php', { method: 'POST', credentials: 'same-origin' }); } catch(e){}
    try { sessionStorage.clear(); localStorage.clear(); } catch(e){}
    document.cookie.split(";").forEach(c => {
        const name = c.split("=")[0].trim();
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;";
    });
    window.location.href = '../index.html?ts=' + Date.now();
}

// ejemplo de fetch para subir avatar

// ejemplo: handler para subir avatar (ajusta selectores según tu HTML)
const inputAvatar = document.querySelector('#inputAvatar'); // input type="file"
const btnSubirAvatar = document.querySelector('#btnSubirAvatar');

if (btnSubirAvatar) {
  btnSubirAvatar.addEventListener('click', (e) => {
    e.preventDefault();
    if (!inputAvatar || !inputAvatar.files || inputAvatar.files.length === 0) {
      console.error('No hay archivo seleccionado');
      return;
    }

    // crear FormData correctamente (fix: formData no definido)
    const formData = new FormData();
    formData.append('avatar', inputAvatar.files[0]);
    // si tu formulario envía user_id hidden, añadirlo:
    const userId = window.USER_ID || document.querySelector('input[name="user_id"]')?.value;
    if (userId) formData.append('user_id', userId);

    fetch('../php/actualizar_imagen_perfil.php', {
      method: 'POST',
      body: formData,
      credentials: 'same-origin'
    })
    .then(r => r.json())
    .then(json => {
      console.log('actualizar_imagen_perfil response', json);
      if (json.ok && json.ruta) {
        // construir URL evitando doble prefijo
        const ruta = json.ruta;
        let finalUrl = ruta;
        // si la ruta guardada es relativa (no empieza con http ni con '/'), anteponer base
        if (!/^https?:\/\//i.test(ruta) && !ruta.startsWith('/')) {
          const base = window.location.pathname.replace(/\/[^\/]*$/, '/'); // carpeta actual
          finalUrl = base + ruta;
        }
        // si ruta comienza con '/' y la app ya añade prefijo, evita duplicar:
        // aquí asumimos que si finalUrl contiene doble '/web-escolar/' hay que limpiarla
        finalUrl = finalUrl.replace(/(\/web\-escolar){2,}/g, '/web-escolar');

        const img = document.querySelector('#avatar') || document.querySelector('.user-avatar');
        if (img) img.src = finalUrl + '?t=' + Date.now();

      } else {
        console.error('Error al actualizar imagen:', json.error || json);
      }
    })
    .catch(err => console.error('Fetch error', err));
  });
}

// Función para cargar datos del usuario
async function cargarDatosUsuario() {
    try {
        const response = await fetch('../php/getUser.php', {
            credentials: 'same-origin'
        });
        const data = await response.json();
        console.log('Datos usuario:', data);

        if (data.ok) {
            // Actualizar nombre en todos los lugares
            const nombreElements = document.querySelectorAll('#nombrePerfilHeader, .nombre-usuario');
            nombreElements.forEach(el => {
                if (el) el.textContent = data.nombre || 'Usuario';
            });

            // Actualizar input del formulario
            const inputNombre = document.getElementById('nombre_completo');
            if (inputNombre) {
                inputNombre.value = data.nombre || '';
            }

            // Actualizar imagen - corregir ruta
            if (data.imagen_perfil) {
                const imgElements = document.querySelectorAll('.perfil-imagen, #avatar');
                imgElements.forEach(img => {
                    if (img) {
                        // Usar la ruta que viene de la BD sin anteponer prefijos duplicados
                        img.src = resolveAvatarUrl(data.imagen_perfil) + '?t=' + Date.now();
                        img.onerror = () => img.src = imagenPorDefecto;
                    }
                });
            }

            // Actualizar campo de correo
            const correoInput = document.getElementById('correo_usuario');
            if (correoInput && data.correo) {
                correoInput.value = data.correo;
            }
        }
    } catch (error) {
        console.error('Error cargando datos:', error);
    }
}

// Actualizar el manejador del formulario de perfil
document.getElementById('formPerfil')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    
    try {
        const response = await fetch('../php/actualizar_perfil.php', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        });

        const data = await response.json();
        console.log('Respuesta actualizar perfil:', data);

        if (data.ok) {
            // Recargar datos inmediatamente después de actualizar
            await cargarDatosUsuario();
            alert('Perfil actualizado correctamente');
        } else {
            alert(data.error || 'Error al actualizar perfil');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al actualizar el perfil');
    }
});

// Función para actualizar el correo
function actualizarCorreoMostrado(correo) {
    const correoInput = document.getElementById('correo_usuario');
    if (correoInput && correo) {
        correoInput.value = correo;
    }
}

// Modificar solo la parte de cambio de contraseña
document.getElementById('formCambioPassword')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    
    try {
        const response = await fetch('../php/cambiar_contrasena.php', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        });
        
        const data = await response.json();
        
        if (data.ok) {
            alert('Contraseña actualizada correctamente');
            this.reset();
        } else {
            alert(data.error || 'Error al cambiar la contraseña');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cambiar la contraseña');
    }
});

// Añadir al código existente de cargarDatosUsuario (sin reemplazarlo)
const existingCargarDatosUsuario = cargarDatosUsuario;
cargarDatosUsuario = async function() {
    await existingCargarDatosUsuario();
    try {
        const response = await fetch('../php/getUser.php', {
            credentials: 'same-origin'
        });
        const data = await response.json();
        if (data.ok && data.correo) {
            actualizarCorreoMostrado(data.correo);
        }
    } catch (error) {
        console.error('Error cargando correo:', error);
    }
};

document.addEventListener('DOMContentLoaded', function () {

    // cargar usuario (ya existente)
    async function obtenerUsuario() {
        try {
            const resp = await fetch('/web-escolar/php/getUser.php', { credentials: 'include' });
            return await resp.json();
        } catch (err) {
            console.error('getUser fetch error', err);
            return { ok: false, error: 'fetch_error' };
        }
    }

    (async () => {
        const datos = await obtenerUsuario();
        if (datos.ok && datos.user) {
            const u = datos.user;
            const elNombreHeader = document.getElementById('nombrePerfilHeader');
            if (elNombreHeader) elNombreHeader.textContent = u.nombre || '';
            const inputNombre = document.getElementById('nombre_completo');
            if (inputNombre) inputNombre.value = u.nombre || '';
            const inputCorreo = document.getElementById('correo_usuario');
            if (inputCorreo) inputCorreo.value = u.correo || '';
            const imgAvatar = document.getElementById('avatar');
            if (imgAvatar) imgAvatar.src = u.imagen_perfil || '../img_logo/logo-tecnica.png';
        } else {
            console.warn('Usuario no cargado:', datos);
        }
    })();

    // subida de imagen: comprobar existencia antes de usar .files
    const formImagen = document.getElementById('formImagenPerfil');
    const inputAvatar = document.getElementById('avatarFile');

    if (formImagen && inputAvatar) {
        formImagen.addEventListener('submit', async function (e) {
            e.preventDefault();
            if (!inputAvatar.files || inputAvatar.files.length === 0) {
                alert('Seleccioná una imagen primero');
                return;
            }
            const fd = new FormData();
            fd.append('avatar', inputAvatar.files[0]);

            try {
                const resp = await fetch('/web-escolar/php/actualizar_imagen_perfil.php', {
                    method: 'POST',
                    credentials: 'include',
                    body: fd
                });
                const text = await resp.text();
                try {
                    const json = JSON.parse(text);
                    if (json.ok) {
                        // Actualizar imagen en el DOM
                        const imgAvatar = document.getElementById('avatar');
                        if (imgAvatar) imgAvatar.src = json.imagen;
                        // Volver a pedir datos del usuario para actualizar todo
                        try {
                            const respUser = await fetch('/web-escolar/php/getUser.php', { credentials: 'include' });
                            const userData = await respUser.json();
                            if (userData.ok) {
                                // Actualizar nombre y otros datos si es necesario
                                const elNombreHeader = document.getElementById('nombrePerfilHeader');
                                if (elNombreHeader) elNombreHeader.textContent = userData.nombre || '';
                                // Actualizar imagen de perfil si el backend la devuelve
                                if (imgAvatar && userData.imagen_perfil) imgAvatar.src = userData.imagen_perfil;
                            }
                        } catch (e) {
                            console.warn('No se pudo actualizar datos de usuario tras subir imagen', e);
                        }
                        alert('Imagen actualizada');
                    } else {
                        console.error('Error subida imagen', json);
                        alert('Error al subir imagen: ' + (json.error || 'desconocido'));
                    }
                } catch (err) {
                    console.error('Respuesta no JSON subida imagen:', text);
                    alert('Error: respuesta inválida del servidor al subir imagen');
                }
            } catch (err) {
                console.error('Error fetch subir imagen:', err);
                alert('Error al subir imagen');
            }
        });
    } else {
        console.debug('formImagenPerfil o avatarFile no encontrado; omitiendo handler de subida.');
    }

    // guardar nombre (formPerfil) — asegúrate actualizar_perfil.php maneje JSON { nombre }
    const formPerfil = document.getElementById('formPerfil');
    if (formPerfil) {
        // evitar añadir más de un listener
        if (!formPerfil.dataset.listenerAttached) {
            formPerfil.dataset.listenerAttached = 'true';

            formPerfil.addEventListener('submit', async function (e) {
                e.preventDefault();

                const btn = formPerfil.querySelector('button[type="submit"], .btn-guardar');
                if (btn) btn.disabled = true;

                const nombreInput = document.getElementById('nombre_completo');
                const nuevoNombre = nombreInput?.value?.trim();
                if (!nuevoNombre) {
                    alert('El nombre no puede estar vacío');
                    if (btn) btn.disabled = false;
                    return;
                }

                try {
                    console.debug('Enviando actualizar_perfil (solo 1 request)');
                    const resp = await fetch('/web-escolar/php/actualizar_perfil.php', {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nombre: nuevoNombre })
                    });

                    const texto = await resp.text();
                    let data;
                    try {
                        data = JSON.parse(texto);
                    } catch (parseErr) {
                        console.error('Respuesta no JSON actualizar_perfil:', texto);
                        alert('Error del servidor: respuesta inválida. Revisá logs PHP.');
                        if (btn) btn.disabled = false;
                        return;
                    }

                    if (data.success || data.ok) {
                        // actualizar UI sin recargar
                        const elNombreHeader = document.getElementById('nombrePerfilHeader');
                        if (elNombreHeader) elNombreHeader.textContent = nuevoNombre;
                        if (nombreInput) nombreInput.value = nuevoNombre;
                        alert('Perfil actualizado correctamente');
                    } else {
                        alert('Error al actualizar perfil: ' + (data.message || data.error || 'desconocido'));
                    }
                } catch (err) {
                    console.error('Error actualizar_perfil:', err);
                    alert('Error al actualizar perfil (red o servidor).');
                } finally {
                    if (btn) btn.disabled = false;
                }
            });
        }
    } else {
        console.warn('formPerfil no encontrado en DOM.');
    }
});
/**
 * Normaliza la ruta de avatar recibida desde el servidor.
 * Si server devuelve URL absoluta o ruta que empieza con '/', la retorna.
 * Si devuelve solo el filename, se antepone la carpeta de uploads.
 */
function resolveAvatarUrl(pathOrFilename) {
    if (!pathOrFilename) return imagenPorDefecto;
    // ya es URL absoluta
    if (/^https?:\/\//i.test(pathOrFilename)) return pathOrFilename;
    // ya es ruta absoluta desde web root
    if (pathOrFilename.startsWith('/')) return pathOrFilename;
    // si es solo filename (ej: avatar_xxx.png) -> carpeta uploads
    return '/web-escolar/php/uploads/avatars/' + pathOrFilename.replace(/^\/+/, '');
}

// Ejemplo de uso al actualizar UI (reemplazar asignaciones simples)
const imgAvatar = document.getElementById('avatar');
if (imgAvatar) {
    // Usar imagen_perfil si foto es null
    const imgField = (usuario && (usuario.foto || usuario.imagen_perfil)) ? (usuario.foto || usuario.imagen_perfil) : null;
    imgAvatar.src = resolveAvatarUrl(imgField) || imagenPorDefecto;
    imgAvatar.onerror = () => { imgAvatar.src = imagenPorDefecto; };
}

// Reemplaza cualquier fetch('../php/getUser.php') por:
fetch('/web-escolar/php/getUser.php', { credentials: 'same-origin' })
  .then(r => r.text())
  .then(text => {
      try {
          const data = JSON.parse(text);
          const imgAvatar = document.getElementById('avatar') || document.getElementById('imgPerfil') || document.querySelector('.perfil-imagen');
          if (imgAvatar) {
              const imgField = data.imagen_perfil || data.foto || null;
              imgAvatar.src = resolveAvatarUrl(imgField) || imagenPorDefecto;
              imgAvatar.onerror = () => { imgAvatar.src = imagenPorDefecto; };
          }
          const elNombreHeader = document.getElementById('nombrePerfilHeader');
          if (elNombreHeader) elNombreHeader.textContent = data.nombre || 'Usuario';
          const nombreInput = document.getElementById('nombreCompleto');
          if (nombreInput) nombreInput.value = data.nombre || '';
      } catch (e) {
          console.error('getUser.php no devolvió JSON válido:', text);
      }
  })
  .catch(err => console.error('Error getUser:', err));

// Manejo seguro de `usuario` y `foto`
if (usuario && (usuario.foto || usuario.imagen_perfil)) {
    const imgAvatar = document.getElementById('avatar');
    if (imgAvatar) {
        const imgField = usuario.foto || usuario.imagen_perfil;
        imgAvatar.src = resolveAvatarUrl(imgField) || imagenPorDefecto;
        imgAvatar.onerror = () => { imgAvatar.src = imagenPorDefecto; };
    }
} else {
    console.warn('[perfil] Usuario o foto no definidos. Usando imagen por defecto.');
    const imgAvatar = document.getElementById('avatar');
    if (imgAvatar) {
        imgAvatar.src = imagenPorDefecto;
    }
}

// Manejo seguro de formularios
function configForm(formId, callback) {
    const form = document.getElementById(formId);
    if (!form) {
        console.warn(`${formId} no encontrado en el DOM.`);
        return;
    }
    callback(form);
}

// Configurar formularios con validación de existencia
configForm('formCambioPass', (form) => {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Lógica para cambiar contraseña
    });
});

configForm('formEliminar', (form) => {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        // Lógica para eliminar cuenta
    });
});

// Manejo de errores de autenticación
async function cargarDatosUsuario() {
    try {
        const resp = await fetch('../php/getUser.php', { credentials: 'same-origin' });
        const data = await resp.json();
        if (data && data.ok) {
            usuario = {
                nombre: data.nombre,
                correo: data.correo,
                rol: data.rol || 'usuario',
                foto: data.foto || null
            };
            console.log('[perfil] Usuario cargado desde getUser.php:', usuario);
            localStorage.setItem('usuarioSesion', JSON.stringify(usuario));
            return true;
        } else {
            console.error('[perfil] Usuario no autenticado:', data);
            alert('No estás autenticado. Por favor, inicia sesión.');
            window.location.href = '../pagina/login.html';
            return false;
        }
    } catch (err) {
        console.error('[perfil] Error cargando usuario desde getUser.php:', err);
        alert('Error al cargar los datos del usuario. Por favor, intenta nuevamente.');
        window.location.href = '../pagina/login.html';
        return false;
    }
}

// Forzar la sincronización de datos después del registro
async function sincronizarDatosUsuario() {
    try {
        const resp = await fetch('../php/getUser.php', { credentials: 'same-origin' });
        const data = await resp.json();
        if (data && data.ok) {
            usuario = {
                nombre: data.nombre,
                correo: data.correo,
                rol: data.rol || 'usuario',
                foto: data.imagen_perfil || null
            };
            console.log('[perfil] Datos sincronizados desde el servidor:', usuario);
            localStorage.setItem('usuarioSesion', JSON.stringify(usuario));
            actualizarUI();
        } else {
            console.error('[perfil] Error al sincronizar datos del usuario:', data);
        }
    } catch (err) {
        console.error('[perfil] Error al sincronizar datos del usuario:', err);
    }
}

// Llamar a la sincronización después de cargar la página
window.addEventListener('load', async () => {
    await sincronizarDatosUsuario();
});