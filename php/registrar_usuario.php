<?php
// Registrar errores en archivo, no mostrarlos en pantalla
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/debug.txt');
error_reporting(E_ALL);

header('Content-Type: application/json; charset=utf-8');

require_once 'config.php';

try {
    $input = file_get_contents('php://input');
    error_log("registrar_usuario - input: " . $input);

    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('JSON inválido: ' . json_last_error_msg());
    }

    if (empty($data['nombre']) || empty($data['correo']) || empty($data['password'])) {
        throw new Exception('Faltan datos requeridos');
    }

    $nombre = trim(filter_var($data['nombre'], FILTER_SANITIZE_STRING));
    $correo = trim(filter_var($data['correo'], FILTER_SANITIZE_EMAIL));
    $hash = password_hash($data['password'], PASSWORD_DEFAULT);

    // Verificar conexión
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception('Error de conexión a la base de datos');
    }

    // Verificar si ya existe
    $check = $conn->prepare("SELECT id FROM `usuarios` WHERE `correo` = ?");
    if (!$check) throw new Exception('Error preparando consulta: ' . $conn->error);
    $check->bind_param("s", $correo);
    $check->execute();
    $res = $check->get_result();
    if ($res->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'El correo ya está registrado']);
        exit;
    }

    // Insertar usuario (usar columna 'contrasena' según tu tabla)
    $sql = "INSERT INTO `usuarios` (`nombre`, `correo`, `contrasena`) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($sql);
    if (!$stmt) throw new Exception('Error en prepare(): ' . $conn->error);
    $stmt->bind_param("sss", $nombre, $correo, $hash);
    if (!$stmt->execute()) {
        throw new Exception('Error al ejecutar inserción: ' . $stmt->error);
    }

    $userId = $conn->insert_id;

    // Obtener datos del usuario (sin devolver la contraseña)
    $sel = $conn->prepare("SELECT id, nombre, correo, rol, tipoCuenta, foto, imagen_perfil FROM `usuarios` WHERE id = ?");
    if (!$sel) throw new Exception('Error preparando select: ' . $conn->error);
    $sel->bind_param("i", $userId);
    $sel->execute();
    $result = $sel->get_result();
    $user = $result->fetch_assoc() ?: null;

    // Iniciar sesión automáticamente
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_name'] = $user['nombre'];
    $_SESSION['user_email'] = $user['correo'];

    echo json_encode(['success' => true, 'message' => 'Usuario registrado e iniciado sesión correctamente', 'user' => $user]);

} catch (Exception $e) {
    error_log("registrar_usuario - Excepción: " . $e->getMessage());
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
exit;
?>