<?php
/**
 * Paso 2: valida el token y guarda la nueva contraseña (password_hash) en usuarios.contrasena.
 * POST: token, password
 * (GET ?token=... solo comprueba si el token es válido, para avisar antes de mostrar el formulario)
 */
require_once __DIR__ . '/../config.php';
header('Content-Type: application/json; charset=utf-8');

function buscarToken(mysqli $db, string $token): ?array {
    if (!preg_match('/^[a-f0-9]{64}$/', $token)) return null;
    $hash = hash('sha256', $token);
    $stmt = $db->prepare("SELECT id, user_id FROM password_resets
                          WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW() LIMIT 1");
    $stmt->bind_param('s', $hash);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    return $row ?: null;
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $ok = (bool) buscarToken($mysqli, (string)($_GET['token'] ?? ''));
        echo json_encode(['success' => $ok, 'message' => $ok ? 'Token válido' : 'El enlace es inválido o ya venció.']);
        exit;
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        exit;
    }

    $token = (string)($_POST['token'] ?? '');
    $pass  = (string)($_POST['password'] ?? '');

    $errorPass = null;
    if (mb_strlen($pass) < 6) {
        $errorPass = 'La contraseña debe tener al menos 6 caracteres.';
    } elseif (!preg_match('/[a-z]/', $pass)) {
        $errorPass = 'La contraseña debe contener al menos una letra minúscula.';
    } elseif (!preg_match('/[A-Z]/', $pass)) {
        $errorPass = 'La contraseña debe contener al menos una letra mayúscula.';
    } elseif (!preg_match('/[0-9]/', $pass)) {
        $errorPass = 'La contraseña debe contener al menos un número.';
    } elseif (!preg_match('/[^a-zA-Z0-9]/', $pass)) {
        $errorPass = 'La contraseña debe contener al menos un carácter especial.';
    }
    if ($errorPass !== null) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $errorPass]);
        exit;
    }

    $reset = buscarToken($mysqli, $token);
    if (!$reset) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'El enlace es inválido o ya venció. Pedí uno nuevo.']);
        exit;
    }

    $mysqli->begin_transaction();

    $nuevo = password_hash($pass, PASSWORD_DEFAULT);
    $stmt = $mysqli->prepare("UPDATE usuarios SET contrasena = ? WHERE id = ? AND deleted_at IS NULL");
    $stmt->bind_param('si', $nuevo, $reset['user_id']);
    $stmt->execute();
    $stmt->close();

    // Marcar usado (y cualquier otro pedido pendiente del usuario)
    $stmt = $mysqli->prepare("UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL");
    $stmt->bind_param('i', $reset['user_id']);
    $stmt->execute();
    $stmt->close();

    $mysqli->commit();

    echo json_encode(['success' => true, 'message' => 'Contraseña actualizada. Ya podés iniciar sesión.']);
} catch (Throwable $e) {
    if (isset($mysqli)) { @$mysqli->rollback(); }
    logError('Restablecer contraseña: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error del servidor. Intentá de nuevo.']);
}
