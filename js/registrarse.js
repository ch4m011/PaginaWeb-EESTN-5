document.addEventListener('DOMContentLoaded', () => {
  console.log('Script de registro cargado');
  
  const formRegistro = document.getElementById('formRegistro');
  
  if (!formRegistro) {
      console.error('No se encontró el formulario de registro');
      return;
  }

  formRegistro.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Formulario enviado');

      const formData = {
          nombre: document.getElementById('nombre').value.trim(),
          correo: document.getElementById('correo').value.trim(),
          password: document.getElementById('password').value
      };

      try {
          const response = await fetch('../php/registrar_usuario.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(formData)
          });

          const text = await response.text();
          console.log('Respuesta cruda del servidor:', text);

          let data;
          try {
              data = JSON.parse(text);
          } catch (err) {
              console.error('Error parseando respuesta:', err, text);
              throw new Error('Respuesta del servidor no válida');
          }

          if (!data.success) throw new Error(data.message || 'Error desconocido');

          // Guardar usuario en localStorage para iniciar sesión automáticamente
          if (data.user) {
              localStorage.setItem('usuarioSesion', JSON.stringify(data.user));
          }

          // Redirigir al inicio del sitio (index.html)
          window.location.href = '../index.html';

      } catch (error) {
          console.error('Error en el registro:', error);
          alert('Error: ' + error.message);
      }
  });
});

async function handleCredentialResponse(response) {
    try {
        const responsePayload = jwt_decode(response.credential);
        console.log('Datos de Google recibidos:', responsePayload);

        const userData = {
            correo: responsePayload.email,
            nombre: responsePayload.name,
            google_id: responsePayload.sub,
            imagen_perfil: responsePayload.picture
        };

        console.log('Enviando datos:', userData);

        const fetchOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        };

        const respuesta = await fetch('../php/registro_google.php', fetchOptions);
        const textoRespuesta = await respuesta.text();
        
        console.log('Respuesta del servidor:', textoRespuesta);

        try {
            const data = JSON.parse(textoRespuesta);
            
            if (data.status === 'success') {
                localStorage.setItem('usuarioSesion', JSON.stringify({
                    nombre: userData.nombre,
                    correo: userData.correo,
                    imagen_perfil: userData.imagen_perfil
                }));
                window.location.href = '../index.html';
            } else {
                mostrarMensajeError(data.message || 'Error en el registro');
            }
        } catch (e) {
            console.error('Error al parsear respuesta:', textoRespuesta);
            mostrarMensajeError('Error al procesar la respuesta del servidor');
        }

    } catch (error) {
        console.error('Error completo:', error);
        mostrarMensajeError('Error en el proceso de registro');
    }
}

function mostrarMensajeError(mensaje) {
    const mensajeDiv = document.getElementById('mensaje-error') || document.createElement('div');
    mensajeDiv.id = 'mensaje-error';
    mensajeDiv.className = 'error-mensaje';
    mensajeDiv.textContent = mensaje;
    
    const googleBtn = document.querySelector('.google-btn-container');
    if (googleBtn && !document.getElementById('mensaje-error')) {
        googleBtn.parentNode.insertBefore(mensajeDiv, googleBtn.nextSibling);
    }
}

// Esperar a que el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    // Intentamos obtener el formulario
    const form = document.getElementById('registroForm') || document.querySelector('form');
    
    if (!form) {
        console.error('No se encontró el formulario de registro');
        return;
    }

    // Función para registro con Google
    window.handleGoogleSignIn = async function(response) {
        try {
            const payload = jwt_decode(response.credential);
            document.getElementById('nombre').value = payload.name;
            document.getElementById('correo').value = payload.email;
            
            // Hacer readonly los campos
            document.getElementById('nombre').readOnly = true;
            document.getElementById('correo').readOnly = true;
            
            // Enfocar contraseña
            document.getElementById('password').focus();
        } catch (error) {
            console.error('Error Google Sign-In:', error);
            alert('Error al procesar datos de Google');
        }
    };

    // Manejador del formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            const formData = {
                nombre: document.getElementById('nombre').value,
                correo: document.getElementById('correo').value,
                password: document.getElementById('password').value,
                celular: document.getElementById('celular')?.value || ''
            };

            console.log('Enviando datos:', formData);

            const response = await fetch('/web-escolar/php/registro_google.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            let data;
            const texto = await response.text();
            
            try {
                data = JSON.parse(texto);
            } catch (e) {
                console.error('Respuesta no JSON:', texto);
                throw new Error('Respuesta del servidor inválida');
            }

            if (data.success) {
                alert('Registro exitoso');
                window.location.href = '/web-escolar/pagina/login.html';
            } else {
                throw new Error(data.message || 'Error desconocido');
            }

        } catch (error) {
            console.error('Error:', error);
            alert('Error en el registro: ' + error.message);
        }
    });
});

// Agregar manejador de errores global
window.onerror = function(msg, url, line, col, error) {
    console.error('Error global:', {msg, url, line, col, error});
    return false;
};
