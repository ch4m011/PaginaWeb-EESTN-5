<?php
session_start();
require_once __DIR__ . '/config.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['ok' => false, 'error' => 'Usuario no autenticado']);
    exit;
}

$userId = $_SESSION['user_id'];
$contrasenaActual = $_POST['password_actual'] ?? '';
$contrasenaNueva = $_POST['password_nueva'] ?? '';

if (empty($contrasenaActual) || empty($contrasenaNueva)) {
    echo json_encode(['ok' => false, 'error' => 'Ambas contraseñas son requeridas']);
    exit;
}

try {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        throw new Exception("Error de conexión: " . $conn->connect_error);
    }

    // Verificar contraseña actual - Cambiado 'password' por 'contrasena'
    $stmt = $conn->prepare("SELECT contrasena FROM usuarios WHERE id = ?");
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $conn->error);
    }
    
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $usuario = $result->fetch_assoc();
    $stmt->close();

    if (!$usuario || !password_verify($contrasenaActual, $usuario['contrasena'])) {
        echo json_encode(['ok' => false, 'error' => 'Contraseña actual incorrecta']);
        exit;
    }

    // Actualizar contraseña - Cambiado 'password' por 'contrasena'
    $contrasenaHash = password_hash($contrasenaNueva, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("UPDATE usuarios SET contrasena = ? WHERE id = ?");
    if (!$stmt) {
        throw new Exception("Error preparando actualización: " . $conn->error);
    }
    
    $stmt->bind_param("si", $contrasenaHash, $userId);
    if (!$stmt->execute()) {
        throw new Exception("Error actualizando contraseña: " . $stmt->error);
    }

    $stmt->close();
    $conn->close();

    echo json_encode(['ok' => true, 'mensaje' => 'Contraseña actualizada correctamente']);

} catch (Exception $e) {
    error_log("Error en cambiar_contrasena.php: " . $e->getMessage());
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
?>
