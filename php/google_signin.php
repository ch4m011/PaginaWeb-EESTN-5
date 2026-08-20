<?php
// IMPORTANTE: empezar exactamente con "<?php" (sin BOM ni espacios)
if (ob_get_length()) ob_clean();
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/google_signin_error.log');

if (session_status() !== PHP_SESSION_ACTIVE) session_start();

// Ajustá tu CLIENT_ID de Google aquí (o léelo desde config/.env)
define('GOOGLE_CLIENT_ID', 'TU_GOOGLE_CLIENT_ID.apps.googleusercontent.com');

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);
$id_token = $input['id_token'] ?? $input['credential'] ?? null;

if (!$id_token) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Falta id_token']);
    exit;
}

// Verificar token con Google tokeninfo (válido para desarrollo)
$tokeninfo = @file_get_contents('https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($id_token));
if ($tokeninfo === false) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'No se pudo verificar token con Google']);
    exit;
}
$info = json_decode($tokeninfo, true);
if (!isset($info['sub']) || !isset($info['email'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Token inválido']);
    exit;
}
// comprobar audiencia
if (($info['aud'] ?? '') !== GOOGLE_CLIENT_ID) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Token no destinado a este cliente (aud mismatch)']);
    exit;
}

// Datos desde Google
$google_sub = $info['sub'];
$email = $info['email'];
$name = $info['name'] ?? '';
$picture = $info['picture'] ?? null;

require_once __DIR__ . '/conexion.php'; // asegura que defina $conn

// Buscar usuario por google_sub o por correo
$stmt = $conn->prepare("SELECT id, nombre, correo, contrasena, tipoCuenta, google_sub FROM usuarios WHERE google_sub = ? OR correo = ? LIMIT 1");
$stmt->bind_param('ss', $google_sub, $email);
$stmt->execute();
$res = $stmt->get_result();
$user = $res->fetch_assoc();
$stmt->close();

if ($user) {
    // Si el registro existe pero no tiene google_sub, actualizarlo
    if (empty($user['google_sub'])) {
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

// No existe -> crear nuevo usuario con tipoCuenta = 'google'
// contrasena puede quedar NULL; tu tabla permite NULL
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

echo json_encode(['success' => true, 'message' => 'Usuario creado e inicio de sesión correcto', 'user' => ['id'=>$newId,'nombre'=>$name,'correo'=>$email]]);
exit;