
<?php
session_start();

require_once __DIR__ . '/../config.php';

header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true) ?? [];

$userId = $_SESSION['id'] ?? null;

if (!$userId) {
    echo json_encode(['ok' => false, 'error' => 'No autenticado']);
    exit;
}

try {
    // Obtener los datos del usuario
    $stmt = $conn->prepare(
        "SELECT contrasena, tipo FROM usuarios WHERE id = ?"
    );
    $stmt->bind_param("i", $userId);
    $stmt->execute();

    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$user) {
        echo json_encode(['ok' => false, 'error' => 'Usuario no encontrado']);
        exit;
    }

    // Verificar identidad según el tipo de cuenta
    if ($user['tipo'] === 'google') {

        $verificacion = $_SESSION['google_delete_verified'] ?? null;

        if (
            !$verificacion ||
            $verificacion['user_id'] != $userId ||
            $verificacion['expires'] < time()
        ) {
            echo json_encode([
                'ok' => false,
                'error' => 'Verificación de Google inválida o vencida'
            ]);
            exit;
        }

        // Consumir la verificación para que no pueda reutilizarse
        unset($_SESSION['google_delete_verified']);

    } else {

        if (empty($input['password'])) {
            echo json_encode([
                'ok' => false,
                'error' => 'Contraseña requerida'
            ]);
            exit;
        }

        if (!password_verify($input['password'], $user['contrasena'])) {
            echo json_encode([
                'ok' => false,
                'error' => 'Contraseña incorrecta'
            ]);
            exit;
        }
    }

    // Eliminar usuario
    $conn->begin_transaction();

    $stmt = $conn->prepare("DELETE FROM usuarios WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();

    $affected = $stmt->affected_rows;
    $stmt->close();

    if ($affected === 0) {
        $conn->rollback();

        echo json_encode([
            'ok' => false,
            'error' => 'No se eliminó el usuario'
        ]);
        exit;
    }

    $conn->commit();

    // Cerrar sesión
    $_SESSION = [];

    if (ini_get("session.use_cookies")) {
        $p = session_get_cookie_params();

        setcookie(
            session_name(),
            '',
            time() - 42000,
            $p['path'],
            $p['domain'],
            $p['secure'],
            $p['httponly']
        );
    }

    session_destroy();

    echo json_encode([
        'ok' => true,
        'message' => 'Usuario eliminado'
    ]);

} catch (Exception $e) {

    if ($conn->in_transaction) {
        $conn->rollback();
    }

    echo json_encode([
        'ok' => false,
        'error' => $e->getMessage()
    ]);
}
