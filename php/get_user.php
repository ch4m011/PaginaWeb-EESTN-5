<?php
// IMPORTANTE: sin espacios antes de <?php
if (session_status() !== PHP_SESSION_ACTIVE) session_start();

header('Content-Type: application/json; charset=utf-8');

// incluir conexión (config.php)
if (file_exists(__DIR__ . '/config.php')) {
    require_once __DIR__ . '/config.php';
} else {
    http_response_code(500);

    echo json_encode([
        'ok' => false,
        'error' => 'Falta archivo de conexión (config.php)'
    ]);

    exit;
}

if (empty($_SESSION['id'])) {
    echo json_encode(['ok' => false, 'error' => 'No autenticado']);
    exit;
}

$user_id = (int) $_SESSION['id'];

$stmt = $conn->prepare("SELECT id, nombre, email, celular, rol, tipo FROM usuarios WHERE id = ?");
$stmt->bind_param('i', $user_id);
$stmt->execute();
$res = $stmt->get_result();
$user = $res->fetch_assoc();

if ($user) {
    echo json_encode([
        'ok' => true,
        'id' => $user['id'],
        'nombre' => $user['nombre'],
        'email' => $user['email'],
        'celular' => $user['celular'],
        'rol' => $user['rol'],
        'tipo' => $user['tipo']
    ]);
} else {
    echo json_encode(['ok' => false, 'error' => 'Usuario no encontrado']);
}
exit;
?>
