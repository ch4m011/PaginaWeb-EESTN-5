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

if (!$usuario_id) {
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    exit;
}

// evitar eliminarse a sí mismo
if (isset($_SESSION['user_id']) && intval($_SESSION['user_id']) === $usuario_id) {
    echo json_encode(['success' => false, 'message' => 'No puedes eliminar tu propia cuenta']);
    exit;
}

// evitar eliminar a otro admin (seguridad básica)
try {
    $check = $conn->prepare("SELECT rol FROM usuarios WHERE id = ?");
    if (!$check) {
        echo json_encode(['success' => false, 'message' => 'Error preparando consulta: ' . $conn->error]);
        exit;
    }
    $check->bind_param("i", $usuario_id);
    $check->execute();
    $result = $check->get_result();
    $usuario = $result->fetch_assoc();
    $check->close();

    if (!$usuario) {
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
        exit;
    }

    if ($usuario['rol'] === 'admin') {
        echo json_encode(['success' => false, 'message' => 'No se puede eliminar a otro administrador']);
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM usuarios WHERE id = ?");
    if (!$stmt) {
        echo json_encode(['success' => false, 'message' => 'Error preparando consulta: ' . $conn->error]);
        exit;
    }
    $stmt->bind_param("i", $usuario_id);
    if (!$stmt->execute()) {
        echo json_encode(['success' => false, 'message' => 'Error al ejecutar eliminación: ' . $stmt->error]);
        $stmt->close();
        exit;
    }

    if ($stmt->affected_rows > 0) {
        echo json_encode(['success' => true, 'message' => 'Usuario eliminado correctamente']);
    } else {
        echo json_encode(['success' => false, 'message' => 'No se pudo eliminar el usuario']);
    }
    $stmt->close();
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

$conn->close();
?>