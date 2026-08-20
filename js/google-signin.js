function handleCredentialResponse(response) {
    const msgEl = document.getElementById('loginMessage');
    
    if (msgEl) msgEl.textContent = 'Verificando con Google...';

    fetch('../php/loginphp/google_login.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
        },
        body: 'id_token=' + encodeURIComponent(response.credential),
        credentials: 'same-origin'
    })
    .then(resp => {
        if (!resp.ok) {
            throw new Error('Error en la respuesta del servidor');
        }
        return resp.json();
    })
    .then(data => {
        if (data.success) {
            window.location.href = '/index.html';
        } else {
            if (msgEl) msgEl.textContent = data.message || 'Error al iniciar sesión con Google';
        }
    })
    .catch(err => {
        console.error('Error Google:', err);
        if (msgEl) msgEl.textContent = 'Error de conexión con el servidor';
    });
}

async function sendGoogleTokenToServer(id_token) {
    try {
        const resp = await fetch('/web-escolar/php/google_signin.php', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ id_token: id_token })
        });
        const text = await resp.text();
        try {
            const data = JSON.parse(text);
            if (data.success) {
                console.log('Google sign-in OK:', data);
                // redirigir o actualizar UI según corresponda
                window.location.href = '/web-escolar/pagina/perfil.html'; // o panel
            } else {
                alert('Google sign-in error: ' + (data.error || data.message || 'Desconocido'));
            }
        } catch (err) {
            console.error('Respuesta inválida del servidor:', text);
            alert('Error del servidor al iniciar con Google. Revisá logs.');
        }
    } catch (err) {
        console.error('Error fetch google_signin:', err);
        alert('Error de red al iniciar con Google');
    }
}

// Callback para Google Identity Services (One Tap / Button)
// Si usás la librería GSI, la respuesta llega en "response.credential"
function handleCredentialResponse(response) {
    const token = response?.credential || response?.id_token || null;
    if (!token) {
        console.error('No se recibió token de Google', response);
        alert('No se recibió token de Google');
        return;
    }
    sendGoogleTokenToServer(token);
}

// Si usás el botón tradicional de gapi, adaptá el callback para enviar response.getIdToken()

window.handleCredentialResponse = handleCredentialResponse;