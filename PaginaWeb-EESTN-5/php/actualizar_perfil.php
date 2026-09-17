<?php
// IMPORTANTE: el archivo debe comenzar exactamente con "<?php" (sin BOM ni espacios)
if (ob_get_length()) ob_clean();
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/actualizar_perfil_error.log');

if (session_status() !== PHP_SESSION_ACTIVE) session_start();

// incluir conexión (ajustar nombre si es config.php)
if (file_exists(__DIR__ . '/conexion.php')) {
    require_once __DIR__ . '/conexion.php';
} elseif (file_exists(__DIR__ . '/config.php')) {
    require_once __DIR__ . '/config.php';
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Falta archivo de conexión']);
    exit;
}

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'No autenticado']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(['success' => false, 'error' => 'JSON inválido: ' . json_last_error_msg()]);
    exit;
}

$nombre = trim($data['nombre'] ?? $data['nombre_completo'] ?? '');
if ($nombre === '') {
    echo json_encode(['success' => false, 'error' => 'Nombre vacío']);
    exit;
}

$user_id = (int) $_SESSION['user_id'];

$stmt = $conn->prepare("UPDATE usuarios SET nombre = ? WHERE id = ?");
if (!$stmt) {
    echo json_encode(['success' => false, 'error' => 'Error en la consulta: ' . $conn->error]);
    exit;
}
$stmt->bind_param('si', $nombre, $user_id);

if ($stmt->execute()) {
    // actualizar también datos de sesión para evitar recargas que vuelvan al valor antiguo
    $_SESSION['user_name'] = $nombre;
    echo json_encode(['success' => true, 'message' => 'Perfil actualizado']);
} else {
    echo json_encode(['success' => false, 'error' => 'Error BD: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
exit;
?>
