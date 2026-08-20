<?php
session_start();
header('Content-Type: application/json');

// Error handler
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Validar que se envió un archivo
if (!isset($_FILES['imagen'])) {
    http_response_code(400);
    echo json_encode(['error' => 'No se envió imagen']);
    exit;
}

$uploadDir = __DIR__ . '/../uploads/noticias/';
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'No se pudo crear directorio de uploads']);
        exit;
    }
}

$file = $_FILES['imagen'];
$error = $file['error'];

if ($error !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'Error del servidor al subir: ' . $error]);
    exit;
}

// Validar extensión (sin finfo, por si no está disponible)
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$allowedExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

if (!in_array($ext, $allowedExt)) {
    http_response_code(400);
    echo json_encode(['error' => 'Tipo de archivo no permitido. Solo: jpg, png, gif, webp']);
    exit;
}

// Validar tamaño (máx 5MB)
$maxSize = 5 * 1024 * 1024;
if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['error' => 'Archivo muy grande (máx 5MB)']);
    exit;
}

// Generar nombre único
$fileName = 'noticia_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
$filePath = $uploadDir . $fileName;

// Mover archivo
if (!move_uploaded_file($file['tmp_name'], $filePath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al guardar archivo']);
    exit;
}

// Retornar URL de la imagen (usar protocolo + host para evitar problemas con rutas relativas)
// O simplemente usar ruta relativa desde la raíz
$imageUrl = '/web-escolar/uploads/noticias/' . $fileName;

http_response_code(200);
echo json_encode([
    'success' => true,
    'imagen' => $imageUrl,
    'fileName' => $fileName
]);
?>