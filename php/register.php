<?php
session_start();
require_once '../conexion.php';
header('Content-Type: application/json');

$email = $_POST['email'] ?? '';
$nombre = $_POST['nombre'] ?? '';
$password = $_POST['password'] ?? '';

if (!$email || !$password) {
    echo json_encode(['ok'=>false,'error'=>'Faltan datos']);
    exit;
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $conn->prepare("INSERT INTO usuarios (correo, contrasena, nombre) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $email, $hash, $nombre);

if ($stmt->execute()) {
    $_SESSION['user_id'] = $stmt->insert_id; // <- crear sesión aquí
    echo json_encode(['ok'=>true,'user_id'=>$_SESSION['user_id']]);
} else {
    echo json_encode(['ok'=>false,'error'=>$stmt->error]);
}
$stmt->close();
$conn->close();
?>