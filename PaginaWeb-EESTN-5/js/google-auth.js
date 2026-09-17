const googleConfig = {
    clientId: 'TU_CLIENT_ID.apps.googleusercontent.com',
    scopes: 'email profile'
};

async function handleGoogleSignIn(response) {
    try {
        console.log('Iniciando autenticación con Google');
        
        const result = await fetch('../php/loginphp/google_login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                credential: response.credential
            }),
            credentials: 'include'
        });

        if (!result.ok) {
            throw new Error(`Error HTTP: ${result.status}`);
        }

        const data = await result.json();
        
        if (data.success) {
            console.log('Inicio de sesión exitoso');
            window.location.href = '../html/index.html';
        } else {
            console.error('Error:', data.message);
            const aviso = document.getElementById('loginMessage') || document.getElementById('registroMessage');
            if (aviso) { aviso.textContent = data.message || 'Error al iniciar sesión con Google'; aviso.className = 'mensaje error'; aviso.style.display = 'block'; }
        }
    } catch (error) {
        console.error('Error en autenticación:', error);
        const aviso = document.getElementById('loginMessage') || document.getElementById('registroMessage');
        if (aviso) { aviso.textContent = 'Error al procesar el inicio de sesión con Google'; aviso.className = 'mensaje error'; aviso.style.display = 'block'; }
    }
}

function initGoogleAuth() {
    try {
        google.accounts.id.initialize({
            client_id: googleConfig.clientId,
            callback: handleGoogleSignIn,
            auto_select: false,
            cancel_on_tap_outside: true
        });

        google.accounts.id.renderButton(
            document.getElementById('googleSignInBtn'),
            { 
                theme: 'outline', 
                size: 'large', 
                width: '100%',
                type: 'standard'
            }
        );
    } catch (error) {
        console.error('Error al inicializar Google Auth:', error);
    }
}

// Manejar errores de postMessage
window.addEventListener('message', (event) => {
    // Verificar origen
    if (event.origin !== window.location.origin && 
        !event.origin.includes('accounts.google.com')) {
        return;
    }
    // Procesar mensaje...
}, false);

// Definición global que requiere el atributo data-callback="handleCredentialResponse"
window.handleCredentialResponse = async function (response) {
    try {
        if (!response || !response.credential) throw new Error('No credential');

        // Logging para diagnóstico (se puede eliminar luego)
        console.log('[google-auth] handleCredentialResponse received:', response);

        // Usar ruta absoluta para evitar errores de base/relativas
        const res = await fetch('../php/loginphp/google_login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ credential: response.credential })
        });
        // Registrar status y cuerpo para poder inspeccionar en DevTools
        console.log('[google-auth] server response status:', res.status, res.statusText);
        const text = await res.text();
        console.log('[google-auth] server raw response:', text);
        let data;
        try { data = JSON.parse(text); } catch (e) { throw new Error('Respuesta no JSON: ' + text); }

        console.log('[google-auth] parsed data:', data);

        if (data.success) {
            // login OK
            console.log('[google-auth] login success:', data);
            
            // Limpiar sesión anterior (importante cuando cambias de cuenta)
            localStorage.removeItem('usuarioSesion');
            localStorage.removeItem('usuarioActual');
            localStorage.removeItem('usuario');
            localStorage.removeItem('fotoPerfil');
            
            // Guardar la sesión en localStorage para que navbar.js la detecte
            const sesion = {
                nombre: data.nombre || 'Usuario',
                correo: data.correo || '',
                rol: data.rol || 'usuario'
            };
            localStorage.setItem('usuarioSesion', JSON.stringify(sesion));
            console.log('[google-auth] Sesión guardada en localStorage:', sesion);
            
            console.log('[google-auth] verificando sesión antes de redirigir...');
            // Esperar un breve momento para que la cookie se guarde
            setTimeout(() => {
                window.location.href = '../html/index.html';
            }, 500);
            return;
        }

        if (data.need_link) {
            // mostrar instrucción al usuario
            console.warn('[google-auth] account needs linking:', data);
            const aviso = document.getElementById('loginMessage') || document.getElementById('registroMessage');
            if (aviso) { aviso.textContent = data.message || 'Debes vincular la cuenta Google con tu cuenta existente.'; aviso.className = 'mensaje error'; aviso.style.display = 'block'; }
            // Redirigir a la pantalla de login manual y pasar parámetro para iniciar flujo de vinculación
            window.location.href = 'login.html?link_with_google=1&email=' + encodeURIComponent(response && response.credential ? '' : '');
            return;
        }

        throw new Error(data.message || 'Error autenticación');
    } catch (err) {
        console.error('[google-auth] Error completo:', err);
        console.error('[google-auth] Stack:', err.stack);
        const aviso = document.getElementById('loginMessage') || document.getElementById('registroMessage');
        if (aviso) { aviso.textContent = 'Error inicio con Google: ' + (err.message || 'Error desconocido.'); aviso.className = 'mensaje error'; aviso.style.display = 'block'; }
    }
};

// Función de diagnóstico (puedes ejecutar en la consola)
window.checkGoogleSessionDiag = async function() {
    console.log('=== DIAGNÓSTICO DE SESIÓN GOOGLE ===');
    console.log('localStorage.usuarioSesion:', localStorage.getItem('usuarioSesion'));
    
    try {
        const resp = await fetch('../php/check_session.php', {
            credentials: 'same-origin'
        });
        const data = await resp.json();
        console.log('check_session.php response:', data);
    } catch (err) {
        console.error('Error checking session:', err);
    }
    
    try {
        const respUser = await fetch('../php/get_user.php', {
            credentials: 'same-origin'
        });
        const dataUser = await respUser.json();
        console.log('get_user.php response:', dataUser);
    } catch (err) {
        console.error('Error getting user:', err);
    }
    
    console.log('=== FIN DIAGNÓSTICO ===');
};
