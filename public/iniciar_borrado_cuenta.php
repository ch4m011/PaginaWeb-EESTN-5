<?php
// Requiere sesión iniciada y archivo de conexión a BD (ajusta la ruta)
session_start();
require_once __DIR__ . '/../includes/db.php'; // $mysqli

if (empty($_SESSION['user_email'])) {
    http_response_code(401);
    echo json_encode(['error' => 'No autenticado']);
    exit;
}

$user_email = $_SESSION['user_email'];
$token = bin2hex(random_bytes(32));

$sql = "UPDATE usuarios SET deletion_token = ? WHERE correo = ? AND deleted_at IS NULL";
$stmt = $mysqli->prepare($sql);
if (!$stmt) { error_log($mysqli->error); http_response_code(500); exit; }
$stmt->bind_param('ss', $token, $user_email);
$stmt->execute();

if ($stmt->affected_rows === 0) {
    http_response_code(400);
    echo json_encode(['error' => 'No se pudo iniciar el proceso']);
    exit;
}

// enviar email con enlace de confirmación (ajusta dominio y método de envío)
$confirmUrl = "https://tu-dominio.test/confirmar_borrado.php?token=$token";
$subject = "Confirmar borrado de cuenta";
$message = "Haz clic para confirmar el borrado de tu cuenta: $confirmUrl";
@mail($user_email, $subject, $message);

echo json_encode(['ok' => true, 'message' => 'Se envió un enlace de confirmación a tu correo.']);
?>