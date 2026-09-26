<?php

if (ob_get_length()) {
    ob_clean();
}

header('Content-Type: application/json; charset=utf-8');

ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/actualizar_imagen_error.log');

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

// incluir conexión (config.php)
if (file_exists(__DIR__ . '/../config.php')) {
    require_once __DIR__ . '/../config.php';
} else {
    http_response_code(500);

    echo json_encode([
        'ok' => false,
        'error' => 'Falta archivo de conexión (config.php)'
    ]);

    exit;
}

/* Usuario */
if (empty($_SESSION['id'])) {
    http_response_code(401);

    echo json_encode([
        'ok' => false,
        'error' => 'Usuario no autenticado'
    ]);

    exit;
}

$user_id = (int) $_SESSION['id'];

/* Archivo recibido */
if (isset($_FILES['avatar'])) {
    $file = $_FILES['avatar'];
} elseif (isset($_FILES['imagen'])) {
    $file = $_FILES['imagen'];
} else {
    echo json_encode([
        'ok' => false,
        'error' => 'Archivo no recibido'
    ]);

    exit;
}

/* Error de subida */
if ($file['error'] !== UPLOAD_ERR_OK) {
    echo json_encode([
        'ok' => false,
        'error' => 'Error en upload: ' . $file['error']
    ]);

    exit;
}

/* Tipo de imagen */
$allowed = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
];

$mime = mime_content_type($file['tmp_name']);

if (!in_array($mime, $allowed, true)) {
    echo json_encode([
        'ok' => false,
        'error' => 'Tipo de imagen no permitido'
    ]);

    exit;
}

/* Leer imagen */
$imagen = file_get_contents($file['tmp_name']);

if ($imagen === false) {
    echo json_encode([
        'ok' => false,
        'error' => 'No se pudo leer la imagen'
    ]);

    exit;
}

/* Guardar imagen en la base de datos */
$stmt = $conn->prepare(
    "UPDATE usuarios
     SET imagen_blob = ?, imagen_mime = ?
     WHERE id = ?"
);

if (!$stmt) {
    http_response_code(500);

    echo json_encode([
        'ok' => false,
        'error' => 'Error preparando la consulta'
    ]);

    exit;
}

$stmt->bind_param('bsi', $imagen, $mime, $user_id);

$stmt->send_long_data(0, $imagen);

if (!$stmt->execute()) {
    http_response_code(500);

    echo json_encode([
        'ok' => false,
        'error' => 'No se pudo guardar la imagen'
    ]);

    exit;
}

$stmt->close();

/* URL que usará el <img> */
$imagenUrl = '../php/perfil/obtener_imagen.php?id=' . $user_id;

echo json_encode([
    'ok' => true,
    'imagen' => $imagenUrl
]);

exit;
?>