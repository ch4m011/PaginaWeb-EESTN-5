//Funcion para iniciar sesion y mantener cuenta//

function parseJwt (token) {
      let base64Url = token.split('.')[1];
      let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      let jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    }

    function handleCredentialResponse(response) {
      const data = parseJwt(response.credential);
      
      // En algun lado hay que guardar
      localStorage.setItem("google_token", response.credential);
      localStorage.setItem("google_user", JSON.stringify(data));
      mostrarMensaje();
    }

    function mostrarMensaje() {
      document.getElementById("mensaje").style.display = "block";
      document.getElementById("logout").style.display = "inline-block";
    }

    function logout() {
      localStorage.removeItem("google_token");
      localStorage.removeItem("google_user");
      document.getElementById("mensaje").style.display = "none";
      document.getElementById("logout").style.display = "none";
    }

    window.onload = function() {
      const user = localStorage.getItem("google_user");
      if (user) {
        mostrarMensaje();
      }
    }
// ============================
// GOOGLE LOGIN HANDLER
// ============================

function parseJwt(token) {
  let base64Url = token.split('.')[1];
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  let jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  ).join(''));
  return JSON.parse(jsonPayload);
}

async function handleCredentialResponse(response) {
  const data = parseJwt(response.credential);
  
  // Datos del usuario de Google
  const usuarioGoogle = {
    nombre: data.name,
    correo: data.email,
    contraseña: "", // No se necesita
    tipoCuenta: "google"
  };

  try {
    // Enviar al servidor para registrar o iniciar sesión
    const resp = await fetch("../php/loginphp/registrar_usuario.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(usuarioGoogle)
    });

    const result = await resp.json();
    if (result.success) {
      localStorage.setItem("usuarioActual", JSON.stringify(result.usuario));
      window.location.href = "../index.html";
    } else {
      alert(result.message);
    }
  } catch (err) {
    console.error("Error Google Login:", err);
    alert("Hubo un problema al iniciar sesión con Google");
  }
}

    