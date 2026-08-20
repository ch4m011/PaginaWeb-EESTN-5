<?php
// IMPORTANTE: este archivo debe comenzar exactamente con "<?php" sin BOM ni espacios
if (ob_get_length()) ob_clean();
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/actualizar_imagen_perfil_error.log');

if (session_status() !== PHP_SESSION_ACTIVE) session_start();

// Intentar cargar conexion.php o config.php según exista
if (file_exists(__DIR__ . '/conexion.php')) {
    require_once __DIR__ . '/conexion.php';
} elseif (file_exists(__DIR__ . '/config.php')) {
    require_once __DIR__ . '/config.php';
} else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Falta archivo de conexión (conexion.php o config.php)']);
    exit;
}

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'Usuario no autenticado', 'debug' => ['session_user_id' => $_SESSION['user_id'] ?? null]]);
    exit;
}

$user_id = (int) $_SESSION['user_id'];

// aceptar tanto 'avatar' (tu form) como 'imagen'
$fileKey = null;
if (isset($_FILES['avatar'])) $fileKey = 'avatar';
elseif (isset($_FILES['imagen'])) $fileKey = 'imagen';

if (!$fileKey) {
    echo json_encode(['ok' => false, 'error' => 'Archivo no recibido o error en upload']);
    exit;
}

$file = $_FILES[$fileKey];
if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['ok' => false, 'error' => 'Error en upload: ' . $file['error']]);
    exit;
}

// validaciones básicas
$allowed = ['image/jpeg','image/png','image/gif'];
if (!in_array($file['type'], $allowed)) {
    echo json_encode(['ok' => false, 'error' => 'Tipo de archivo no permitido']);
    exit;
}

// guardar archivo
$uploadDir = __DIR__ . '/uploads/avatars/';
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = 'avatar_' . $user_id . '_' . time() . '.' . $ext;
$target = $uploadDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $target)) {
    echo json_encode(['ok' => false, 'error' => 'No se pudo guardar el archivo']);
    exit;
}

// ruta pública según estructura (ajusta si usas otra)
$publicPath = '/web-escolar/php/uploads/avatars/' . $filename;

// actualizar DB (asegúrate $conn viene de conexion.php o config.php)
if (isset($conn)) {
    $stmt = $conn->prepare("UPDATE usuarios SET imagen_perfil = ? WHERE id = ?");
    $stmt->bind_param('si', $publicPath, $user_id);
    $stmt->execute();
}

echo json_encode(['ok' => true, 'imagen' => $publicPath]);
exit;
?>

