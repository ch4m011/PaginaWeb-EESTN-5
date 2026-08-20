<?php
// IMPORTANTE: sin espacios antes de <?php
if (session_status() !== PHP_SESSION_ACTIVE) session_start();

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../conexion.php';

if (empty($_SESSION['user_id'])) {
    echo json_encode(['ok' => false, 'error' => 'No autenticado']);
    exit;
}

$user_id = (int) $_SESSION['user_id'];

$stmt = $conn->prepare("SELECT id, nombre, correo, imagen_perfil, celular, rol, tipoCuenta FROM usuarios WHERE id = ?");
$stmt->bind_param('i', $user_id);
$stmt->execute();
$res = $stmt->get_result();
$user = $res->fetch_assoc();

if ($user) {
    $user['imagen_perfil'] = $user['imagen_perfil'] ?: '/web-escolar/php/uploads/avatars/default-avatar.png';
    echo json_encode([
        'ok' => true,
        'id' => $user['id'],
        'nombre' => $user['nombre'],
        'correo' => $user['correo'],
        'imagen_perfil' => $user['imagen_perfil'],
        'celular' => $user['celular'],
        'rol' => $user['rol'],
        'tipoCuenta' => $user['tipoCuenta']
    ]);
} else {
    echo json_encode(['ok' => false, 'error' => 'Usuario no encontrado']);
}
exit;
?>
