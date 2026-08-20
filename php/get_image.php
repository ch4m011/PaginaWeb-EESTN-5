<?php
session_start();
require_once __DIR__ . '/config.php';

$user_id = $_GET['user_id'] ?? ($_SESSION['user_id'] ?? null);
if (!$user_id) { http_response_code(404); exit; }

$stmt = $pdo->prepare("SELECT imagen_blob, imagen_mime, imagen_perfil FROM usuarios WHERE id = ?");
$stmt->execute([$user_id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$row) { http_response_code(404); exit; }

if (!empty($row['imagen_blob'])) {
    // si imagen_blob está en BLOB o en base64: ajustar según cómo la guardaste
    $mime = $row['imagen_mime'] ?: 'image/jpeg';
    header('Content-Type: ' . $mime);
    // si guardaste como base64 en DB: echo base64_decode($row['imagen_blob']);
    echo $row['imagen_blob'];
    exit;
}

// si guardaste sólo filename o ruta en imagen_perfil -> leer archivo
$filename = $row['imagen_perfil'];
$path = $_SERVER['DOCUMENT_ROOT'] . '/web-escolar/php/uploads/avatars/' . basename($filename);
if (is_file($path)) {
    header('Content-Type: ' . mime_content_type($path));
    readfile($path);
    exit;
}

http_response_code(404);
?>
<img id="avatar" src="/php/get_image.php?user_id=<?=$_SESSION['user_id']?>&t=<?=time()?>" alt="avatar">
<span id="username"><?=$_SESSION['nombre_completo'] ?? $_SESSION['username'] ?? 'Usuario'?></span>