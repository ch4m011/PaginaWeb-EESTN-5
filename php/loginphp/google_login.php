<?php
// Enable full error reporting for debugging (remove or limit en producción)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// IMPORTANTÍSIMO: Destruir cualquier sesión anterior completamente
if (session_status() === PHP_SESSION_ACTIVE) {
    error_log('[google_login] Destruyendo sesión anterior. session_id=' . session_id());
    // Limpiar todas las variables
    $_SESSION = [];
    // Destruir la cookie de sesión
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            time() - 42000,
            $params["path"],
            $params["domain"],
            $params["secure"],
            $params["httponly"]
        );
    }
    // Destruir la sesión
    session_destroy();
    error_log('[google_login] Sesión anterior destruida');
}

// Iniciar nueva sesión fresca con nuevo ID
session_start();
// Regenerar ID de sesión para evitar fijación de sesión
session_regenerate_id(true);
error_log('[google_login] Nueva sesión iniciada. session_id=' . session_id());

// Headers para permitir comunicación con Google Identity / CORS (dev)
header('Content-Type: application/json; charset=utf-8');
header('Cross-Origin-Opener-Policy: same-origin-allow-popups');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');


// Responder preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once '../../conexion.php';

// Configura tu CLIENT_ID de Google (el mismo que usás en el HTML)
$EXPECTED_CLIENT_ID = '475324951083-lp2pvqi80vs95cshsij7hn5m8tg3b0s3.apps.googleusercontent.com';

try {
    $input = file_get_contents('php://input');
    error_log('[google_login] INPUT recibido: ' . substr($input, 0, 100) . '...');
    if (!$input) throw new Exception('Cuerpo vacío');
    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) throw new Exception('JSON inválido');

    if (empty($data['credential'])) throw new Exception('Credencial no enviada');

    $id_token = $data['credential'];
    error_log('[google_login] id_token recibido (primeros 50 chars): ' . substr($id_token, 0, 50) . '...');

    // Verificar token con Google (tokeninfo)
    $tokeninfo = file_get_contents('https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($id_token));
    if ($tokeninfo === false) throw new Exception('No se pudo verificar token con Google');

    $payload = json_decode($tokeninfo, true);
    error_log('[google_login] Payload de Google decodificado: ' . json_encode($payload));
    if (empty($payload) || empty($payload['aud'])) throw new Exception('Token inválido');

    // Validar audiencia (client id)
    if ($payload['aud'] !== $EXPECTED_CLIENT_ID) {
        error_log('[google_login] aud mismatch. Esperado: ' . $EXPECTED_CLIENT_ID . ', recibido: ' . ($payload['aud'] ?? 'NULL'));
        throw new Exception('Token no emitido para este cliente (aud mismatch)');
    }

    $email = $payload['email'] ?? null;
    $google_sub = $payload['sub'] ?? null;
    $nombre = $payload['name'] ?? ($payload['given_name'] ?? 'Usuario');
    error_log('[google_login] Email: ' . $email . ', google_sub: ' . $google_sub . ', nombre: ' . $nombre);

    if (!$email || !$google_sub) throw new Exception('Payload incompleto');

    // Buscar usuario por correo
    $stmt = $conn->prepare("SELECT id, nombre, correo, contrasena, tipoCuenta, google_sub, rol FROM usuarios WHERE correo = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $res = $stmt->get_result();
    error_log('[google_login] Búsqueda en BD por correo: ' . $email . '. Filas encontradas: ' . ($res ? $res->num_rows : 'NULL'));

    if ($res && $res->num_rows > 0) {
        $usuario = $res->fetch_assoc();
        error_log('[google_login] Usuario encontrado: ID=' . $usuario['id'] . ', tipoCuenta=' . $usuario['tipoCuenta'] . ', google_sub=' . ($usuario['google_sub'] ?? 'NULL'));

        // Caso: ya registrado como cuenta Google (google_sub coincide o tipoCuenta=google)
        if (!empty($usuario['google_sub']) && $usuario['google_sub'] === $google_sub) {
            error_log('[google_login] Caso 1: google_sub coincide, permitiendo login');
            // iniciar sesión
        } elseif ($usuario['tipoCuenta'] === 'google' && empty($usuario['google_sub'])) {
            error_log('[google_login] Caso 2: cuenta google sin google_sub, actualizando');
            // posible antigua cuenta google sin google_sub -> actualizar
            $upd = $conn->prepare("UPDATE usuarios SET google_sub = ? WHERE id = ?");
            $upd->bind_param("si", $google_sub, $usuario['id']);
            if ($upd->execute()) {
                error_log('[google_login] UPDATE exitoso para google_sub');
            } else {
                error_log('[google_login] ERROR en UPDATE: ' . $upd->error);
            }
        } elseif ($usuario['tipoCuenta'] === 'manual') {
            error_log('[google_login] Caso 3: cuenta manual, vinculando google_sub');
            // Usuario con cuenta manual ya existe: vincular google_sub para permitir ambos tipos de login
            // (contraseña o Google sin sobrescribir la contraseña existente)
            if (empty($usuario['google_sub'])) {
                $upd = $conn->prepare("UPDATE usuarios SET google_sub = ? WHERE id = ?");
                $upd->bind_param("si", $google_sub, $usuario['id']);
                if ($upd->execute()) {
                    error_log('[google_login] Vinculación de google_sub exitosa');
                } else {
                    error_log('[google_login] ERROR en vinculación: ' . $upd->error);
                }
            }
        } else {
            error_log('[google_login] Caso 4: otros casos, actualizando google_sub y tipoCuenta');
            // Otros casos: actualizar google_sub y tipoCuenta
            $upd2 = $conn->prepare("UPDATE usuarios SET google_sub = ?, tipoCuenta = 'google' WHERE id = ?");
            $upd2->bind_param("si", $google_sub, $usuario['id']);
            if ($upd2->execute()) {
                error_log('[google_login] UPDATE google_sub y tipoCuenta exitoso');
            } else {
                error_log('[google_login] ERROR en UPDATE: ' . $upd2->error);
            }
        }

        // iniciar sesión
        error_log('[google_login] Iniciando sesión para usuario ID=' . $usuario['id']);
        $_SESSION['user_id'] = $usuario['id'];
        $_SESSION['nombre'] = $usuario['nombre'];
        $_SESSION['correo'] = $usuario['correo'];
        $_SESSION['rol'] = $usuario['rol'] ?? 'usuario';
        error_log('[google_login] Sesión iniciada. user_id=' . $_SESSION['user_id'] . ', session_id=' . session_id());

        echo json_encode([
            'success' => true,
            'message' => 'Inicio de sesión exitoso',
            'nombre' => $_SESSION['nombre'],
            'correo' => $_SESSION['correo'],
            'rol' => $_SESSION['rol']
        ]);
        exit;
    }

    // Usuario no existe: crear
    error_log('[google_login] Usuario NO encontrado en BD. Intentando crear nuevo usuario.');
    $stmtIns = $conn->prepare("INSERT INTO usuarios (nombre, correo, tipoCuenta, google_sub, rol) VALUES (?, ?, 'google', ?, 'usuario')");
    $stmtIns->bind_param("sss", $nombre, $email, $google_sub);
    if (!$stmtIns->execute()) {
        error_log('[google_login] ERROR al crear usuario: ' . $conn->error);
        throw new Exception('Error al crear usuario: ' . $conn->error);
    }

    $newId = $conn->insert_id;
    error_log('[google_login] Usuario creado exitosamente. ID=' . $newId);
    $_SESSION['user_id'] = $newId;
    $_SESSION['nombre'] = $nombre;
    $_SESSION['correo'] = $email;
    $_SESSION['rol'] = 'usuario';
    error_log('[google_login] Sesión iniciada para usuario nuevo ID=' . $newId . ', session_id=' . session_id());

    echo json_encode([
        'success' => true,
        'message' => 'Cuenta creada e inicio de sesión exitoso',
        'nombre' => $_SESSION['nombre'],
        'correo' => $_SESSION['correo'],
        'rol' => $_SESSION['rol']
    ]);
    exit;

} catch (Exception $e) {
    error_log('[google_login] ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error servidor: ' . $e->getMessage()]);
    exit;
}
?>
