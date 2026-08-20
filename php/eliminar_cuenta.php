<?php
session_start();
require_once '../conexion.php';
header('Content-Type: application/json; charset=utf-8');

$debug = [];
$debug['method'] = $_SERVER['REQUEST_METHOD'];
$debug['session_user_id'] = $_SESSION['user_id'] ?? null;

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || empty($input['password'])) {
    echo json_encode(['ok' => false, 'error' => 'Contraseña requerida', 'debug' => $debug]);
    exit;
}

$userId = $_SESSION['user_id'] ?? null;
if (!$userId) {
    echo json_encode(['ok' => false, 'error' => 'No autenticado', 'debug' => $debug]);
    exit;
}

try {
    // verificar conexión
    if ($conn->connect_error) {
        throw new Exception('DB connect error: ' . $conn->connect_error);
    }

    // obtener hash
    $stmt = $conn->prepare("SELECT contrasena, imagen_perfil FROM usuarios WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $res = $stmt->get_result();
    $user = $res->fetch_assoc();
    $stmt->close();

    if (!$user) {
        echo json_encode(['ok' => false, 'error' => 'Usuario no encontrado', 'debug' => $debug]);
        exit;
    }

    if (!password_verify($input['password'], $user['contrasena'])) {
        echo json_encode(['ok' => false, 'error' => 'Contraseña incorrecta', 'debug' => $debug]);
        exit;
    }

    // iniciar transacción
    $conn->begin_transaction();

    // eliminar imagen de perfil del servidor (si aplica)
    if (!empty($user['imagen_perfil'])) {
        $path = __DIR__ . '/../' . $user['imagen_perfil'];
        if (file_exists($path)) {
            @unlink($path);
            $debug['image_deleted'] = true;
        } else {
            $debug['image_deleted'] = false;
            $debug['image_path_checked'] = $path;
        }
    }

    // eliminar usuario (ajusta si otras tablas referencian FK)
    $stmt = $conn->prepare("DELETE FROM usuarios WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $affected = $stmt->affected_rows;
    $stmt->close();

    if ($affected === 0) {
        $conn->rollback();
        echo json_encode(['ok' => false, 'error' => 'No se eliminó usuario', 'debug' => $debug]);
        exit;
    }

    $conn->commit();
    // destruir sesión
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time()-42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();

    $debug['deleted_rows'] = $affected;
    echo json_encode(['ok' => true, 'message' => 'Eliminado', 'debug' => $debug]);
    exit;

} catch (Exception $e) {
    if ($conn->in_transaction) $conn->rollback();
    echo json_encode(['ok' => false, 'error' => $e->getMessage(), 'debug' => $debug]);
    exit;
}