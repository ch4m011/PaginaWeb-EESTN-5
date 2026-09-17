<?php
session_start();
require_once('../../conexion.php');

header('Content-Type: application/json; charset=utf-8');
// evitar que warnings rompan JSON
ini_set('display_errors', 0);
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);

// limpiar buffer accidental
if (ob_get_length()) ob_clean();

// comprobar sesión admin
if (!isset($_SESSION['rol']) || $_SESSION['rol'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Acceso no autorizado']);
    exit;
}

// leer input compatible JSON o form-urlencoded
$raw = file_get_contents('php://input');
$input = json_decode($raw, true);
if (!is_array($input)) {
    parse_str($raw, $parsed);
    $input = $parsed;
}
if (empty($input)) $input = $_POST;

$usuario_id = isset($input['usuario_id']) ? intval($input['usuario_id']) : 0;
$nuevo_rol  = isset($input['nuevo_rol']) ? trim($input['nuevo_rol']) : (isset($input['rol']) ? trim($input['rol']) : '');

if (!$usuario_id || $nuevo_rol === '') {
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    exit;
}

$roles_permitidos = ['usuario','escritor','admin'];
if (!in_array($nuevo_rol, $roles_permitidos)) {
    echo json_encode(['success' => false, 'message' => 'Rol no válido']);
    exit;
}

// evitar cambiarse a sí mismo
if (isset($_SESSION['user_id']) && intval($_SESSION['user_id']) === $usuario_id) {
    echo json_encode(['success' => false, 'message' => 'No puedes cambiar tu propio rol']);
    exit;
}

try {
    $stmt = $conn->prepare("UPDATE usuarios SET rol = ? WHERE id = ?");
    if (!$stmt) {
        echo json_encode(['success' => false, 'message' => 'Error preparando consulta: ' . $conn->error]);
        exit;
    }
    $stmt->bind_param("si", $nuevo_rol, $usuario_id);
    if (!$stmt->execute()) {
        echo json_encode(['success' => false, 'message' => 'Error al ejecutar actualización: ' . $stmt->error]);
        $stmt->close();
        exit;
    }
    // OK
    echo json_encode(['success' => true, 'message' => 'Rol actualizado correctamente']);
    $stmt->close();
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

$conn->close();
?>