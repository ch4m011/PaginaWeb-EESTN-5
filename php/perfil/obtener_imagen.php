<?php

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

if (!isset($_GET['id'])) {
    http_response_code(400);
    exit;
}

$id = (int) $_GET['id'];

$stmt = $conn->prepare(
    "SELECT imagen_blob, imagen_mime
     FROM usuarios
     WHERE id = ?"
);

$stmt->bind_param('i', $id);
$stmt->execute();

$resultado = $stmt->get_result();
$usuario = $resultado->fetch_assoc();

$stmt->close();

if (!$usuario || empty($usuario['imagen_blob'])) {
    echo '';
    exit;
}

header('Content-Type: ' . $usuario['imagen_mime']);

echo $usuario['imagen_blob'];

exit;
?>