<?php
// API de registro de usuarios.
// Recibe JSON desde html/registrarse.html y devuelve siempre JSON.
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/debug.txt');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/config.php';

try {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (!is_array($data)) {
        throw new Exception('Los datos enviados no tienen un formato válido.');
    }

    $nombre = trim((string)($data['nombre'] ?? ''));
    $correo = strtolower(trim((string)($data['correo'] ?? '')));
    $password = (string)($data['password'] ?? '');
    $celular = trim((string)($data['celular'] ?? ''));

    if ($nombre === '' || $correo === '' || $password === '') {
        throw new Exception('Completá nombre, correo y contraseña.');
    }

    if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('El correo electrónico no tiene un formato válido.');
    }

    if (mb_strlen($password) < 6) {
        throw new Exception('La contraseña debe tener al menos 6 caracteres.');
    }

    if (!isset($conn) || $conn->connect_errno) {
        throw new Exception('No se pudo conectar con la base de datos. Verificá que MySQL esté iniciado.');
    }

    // Evitar registros duplicados, incluso si cambia mayúsculas/minúsculas.
    $check = $conn->prepare("SELECT id FROM usuarios WHERE LOWER(correo) = LOWER(?) LIMIT 1");
    if (!$check) {
        throw new Exception('No se pudo comprobar el correo en la base de datos.');
    }
    $check->bind_param('s', $correo);
    $check->execute();
    $res = $check->get_result();
    $existe = $res && $res->num_rows > 0;
    $check->close();

    if ($existe) {
        echo json_encode(['success' => false, 'message' => 'El correo ya está registrado.']);
        exit;
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);

if ($hash === false) {
    throw new Exception('No se pudo generar el hash de la contraseña.');
}

    // Las demás columnas de usuarios tienen valores DEFAULT o aceptan NULL.
    $stmt = $conn->prepare("INSERT INTO usuarios (nombre, correo, contrasena, celular) VALUES (?, ?, ?, ?)");
    if (!$stmt) {
        throw new Exception('No se pudo preparar el registro en la base de datos.');
    }
    $stmt->bind_param('ssss', $nombre, $correo, $hash, $celular);

    if (!$stmt->execute()) {
        throw new Exception('No se pudo crear la cuenta: ' . $stmt->error);
    }

    $userId = (int)$conn->insert_id;
    $stmt->close();

    // Iniciar sesión automáticamente.
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
    session_regenerate_id(true);
    $_SESSION['user_id'] = $userId;
    $_SESSION['id'] = $userId;
    $_SESSION['user_name'] = $nombre;
    $_SESSION['nombre'] = $nombre;
    $_SESSION['user_email'] = $correo;
    $_SESSION['correo'] = $correo;
    $_SESSION['user_rol'] = 'usuario';
    $_SESSION['rol'] = 'usuario';

    echo json_encode([
        'success' => true,
        'message' => 'Cuenta creada correctamente.',
        'user' => [
            'id' => $userId,
            'nombre' => $nombre,
            'correo' => $correo,
            'rol' => 'usuario'
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    error_log('registrar_usuario: ' . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
exit;
?>
