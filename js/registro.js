const form = document.getElementById('formRegistro');
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const res = await fetch('../php/register.php', {
        method: 'POST',
        credentials: 'same-origin', // <- importante para que el navegador guarde PHPSESSID
        body: fd
    });
    const json = await res.json();
    console.log('register response', json);
    if (json.ok) {
        // Limpiar cualquier caché local/antiguo antes de ir al perfil
        try { localStorage.removeItem('usuario_cached'); sessionStorage.removeItem('usuario_cached'); } catch(e){}
        // Forzar recarga / ir a perfil (se cargará usando la sesión creada)
        window.location.href = '/pagina/perfil.html?ts=' + Date.now();
    } else {
        alert('Error: ' + (json.error || 'Registro fallido'));
    }
});