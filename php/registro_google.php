<?php
// IMPORTANTE: archivo debe empezar exactamente con "<?php" sin BOM ni espacios
if (ob_get_length()) ob_clean();
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/registro_google_error.log');

if (session_status() !== PHP_SESSION_ACTIVE) session_start();

// verificar existencia de conexion.php o config.php
if (file_exists(__DIR__ . '/conexion.php')) {
    require_once __DIR__ . '/conexion.php';
} elseif (file_exists(__DIR__ . '/config.php')) {
    require_once __DIR__ . '/config.php';
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Falta archivo de conexión']);
    exit;
}

// CONFIG: pon tu client id de Google aquí si quieres validar aud
define('GOOGLE_CLIENT_ID', 'TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com');

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

if (!$input) {
    echo json_encode(['success' => false, 'error' => 'Petición inválida']);
    exit;
}

$id_token = $input['id_token'] ?? $input['credential'] ?? null;
$name = $input['name'] ?? null;
$email = $input['email'] ?? null;
$google_sub = $input['google_sub'] ?? null;
$picture = $input['picture'] ?? null;

// Si llega id_token, verificar con Google (recomendado)
if ($id_token) {
    $tokeninfo = @file_get_contents('https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($id_token));
    if ($tokeninfo === false) {
        echo json_encode(['success' => false, 'error' => 'No se pudo verificar token con Google']);
        exit;
    }
    $info = json_decode($tokeninfo, true);
    if (!isset($info['sub']) || !isset($info['email'])) {
        echo json_encode(['success' => false, 'error' => 'Token inválido']);
        exit;
    }
    // opcional: verificar audiencia si definiste CLIENT_ID
    if (defined('GOOGLE_CLIENT_ID') && GOOGLE_CLIENT_ID && ($info['aud'] ?? '') !== GOOGLE_CLIENT_ID) {
        // no bloquear, solo avisar: comentar si no usás client id
        // echo json_encode(['success' => false, 'error' => 'Token no destinado a este cliente']);
        // exit;
    }
    $google_sub = $info['sub'];
    $email = $info['email'];
    $name = $info['name'] ?? $name;
    $picture = $info['picture'] ?? $picture;
}

// ahora buscar en BD por google_sub o correo
$stmt = $conn->prepare("SELECT id, nombre, correo, tipoCuenta, imagen_perfil FROM usuarios WHERE google_sub = ? OR correo = ? LIMIT 1");
$stmt->bind_param('ss', $google_sub, $email);
$stmt->execute();
$res = $stmt->get_result();
$user = $res->fetch_assoc();
$stmt->close();

if ($user) {
    // si existe pero no tiene google_sub, actualizarlo
    if (empty($user['google_sub'] ?? null) && $google_sub) {
        $upd = $conn->prepare("UPDATE usuarios SET google_sub = ?, tipoCuenta = 'google', imagen_perfil = COALESCE(imagen_perfil, ?) WHERE id = ?");
        $upd->bind_param('ssi', $google_sub, $picture, $user['id']);
        $upd->execute();
        $upd->close();
    }
    // iniciar sesión
    $_SESSION['user_id'] = (int)$user['id'];
    $_SESSION['user_name'] = $user['nombre'];
    $_SESSION['user_email'] = $user['correo'];
    echo json_encode(['success' => true, 'message' => 'Inicio de sesión correcto', 'user' => ['id'=>$_SESSION['user_id'],'nombre'=>$_SESSION['user_name'],'correo'=>$_SESSION['user_email']]]);
    exit;
}

// no existe -> crear usuario nuevo (si querés)
$insert = $conn->prepare("INSERT INTO usuarios (nombre, correo, contrasena, tipoCuenta, google_sub, imagen_perfil, fecha_registro) VALUES (?, ?, NULL, 'google', ?, ?, CURRENT_TIMESTAMP())");
$insert->bind_param('ssss', $name, $email, $google_sub, $picture);
if (!$insert->execute()) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Error al crear usuario: ' . $insert->error]);
    exit;
}
$newId = $insert->insert_id;
$insert->close();

// iniciar sesión para el nuevo usuario
$_SESSION['user_id'] = (int)$newId;
$_SESSION['user_name'] = $name;
$_SESSION['user_email'] = $email;

echo json_encode(['success' => true, 'message' => 'Usuario creado e iniciada sesión', 'user' => ['id'=>$newId,'nombre'=>$name,'correo'=>$email]]);
exit;
?>