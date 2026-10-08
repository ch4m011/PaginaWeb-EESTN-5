<?php
session_start();
require_once __DIR__ . '/../config.php';

header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', 0);
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
if (ob_get_length()) ob_clean();

// Solo administradores
if (!isset($_SESSION['rol']) || $_SESSION['rol'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Acceso no autorizado']);
    exit;
}

// Leer datos: JSON o formulario
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

// Desde el panel solo se asignan usuario o escritor
$roles_permitidos = ['usuario', 'escritor'];
if (!in_array($nuevo_rol, $roles_permitidos, true)) {
    echo json_encode(['success' => false, 'message' => 'Rol no válido']);
    exit;
}

// No cambiar el propio rol
if (isset($_SESSION['id']) && intval($_SESSION['id']) === $usuario_id) {
    echo json_encode(['success' => false, 'message' => 'No podés cambiar tu propio rol']);
    exit;
}

try {
    // Verificar que el usuario exista y no sea administrador
    $check = $conn->prepare("SELECT rol FROM usuarios WHERE id = ?");
    if (!$check) {
        echo json_encode(['success' => false, 'message' => 'Error preparando consulta: ' . $conn->error]);
        exit;
    }
    $check->bind_param("i", $usuario_id);
    $check->execute();
    $usuario = $check->get_result()->fetch_assoc();
    $check->close();

    if (!$usuario) {
        echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
        exit;
    }

    if ($usuario['rol'] === 'admin') {
        echo json_encode(['success' => false, 'message' => 'No se puede cambiar el rol de un administrador']);
        exit;
    }

    $stmt = $conn->prepare("UPDATE usuarios SET rol = ? WHERE id = ?");
    if (!$stmt) {
        echo json_encode(['success' => false, 'message' => 'Error preparando consulta: ' . $conn->error]);
        exit;
    }
    $stmt->bind_param("si", $nuevo_rol, $usuario_id);
    if (!$stmt->execute()) {
        echo json_encode(['success' => false, 'message' => 'Error al actualizar: ' . $stmt->error]);
        $stmt->close();
        exit;
    }
    $stmt->close();

    echo json_encode(['success' => true, 'message' => 'Rol actualizado correctamente']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

$conn->close();