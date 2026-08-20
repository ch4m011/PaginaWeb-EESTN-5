<?php
// Respuesta JSON segura; errores se loguean, no se muestran al cliente
header('Content-Type: application/json; charset=UTF-8');
// No mostrar errores al cliente; registrar en log
ini_set('display_errors', 0);
error_reporting(0);

require_once __DIR__ . '/../conexion.php'; // Usar la conexión centralizada

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido']);
    exit;
}

$correo = isset($_POST['correo']) ? trim($_POST['correo']) : '';
if ($correo === '') {
    echo json_encode(['status' => 'error', 'message' => 'Correo no proporcionado']);
    exit;
}

try {
    $sql = "SELECT imagen_perfil FROM usuarios WHERE correo = ?";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('Error en preparación de consulta: ' . $conn->error);
    }
    $stmt->bind_param("s", $correo);
    if (!$stmt->execute()) {
        throw new Exception('Error en ejecución de consulta: ' . $stmt->error);
    }
    $res = $stmt->get_result();
    $fila = $res ? $res->fetch_assoc() : null;

    echo json_encode(['status' => 'success', 'foto' => $fila ? $fila['imagen_perfil'] : null]);
    $stmt->close();
    exit;
} catch (Exception $e) {
    error_log('obtener_imagen_usuario.php error: ' . $e->getMessage());
    echo json_encode(['status' => 'error', 'message' => 'Error interno']);
    exit;
}
?>