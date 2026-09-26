<?php

require_once 'config.php';

$id = intval($_GET['id'] ?? 0);

$stmt = $conn->prepare(
    "SELECT imagen_blob, imagen_mime
     FROM noticias
     WHERE id = ?"
);

$stmt->bind_param("i", $id);
$stmt->execute();

$result = $stmt->get_result();
$row = $result->fetch_assoc();

if (!$row || !$row['imagen_blob']) {
    echo '';
    exit;
}

header('Content-Type: ' . $row['imagen_mime']);
echo $row['imagen_blob'];