<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

echo json_encode([
    'session_active' => session_status() === PHP_SESSION_ACTIVE,
    'session_id' => session_id(),
    'user_id' => $_SESSION['user_id'] ?? null,
    'nombre' => $_SESSION['nombre'] ?? null,
    'correo' => $_SESSION['correo'] ?? null,
    'rol' => $_SESSION['rol'] ?? null,
    'all_session_keys' => array_keys($_SESSION),
    'all_session_values' => $_SESSION
]);
?>
