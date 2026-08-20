<?php
// login.php
// Script que procesa el login POST. Reemplaza tu actual login.php con este código.
// Asegurate de que config/db_connect.php exista y defina $conexion (mysqli).

// Mostrar errores solo en desarrollo
ini_set('display_errors',1);
ini_set('display_startup_errors',1);
error_reporting(E_ALL);

require_once 'functions.php';
// iniciar sesión ya hecho en functions.php

// incluir configuración / conexión real del proyecto
require_once __DIR__ . '/config.php';

// Solo aceptar POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    // Si preferís JSON para AJAX, detectá HTTP_X_REQUESTED_WITH
    flash_set('Método inválido', 'error');
    redirect('login_form.php');
}

// Capturar datos
// Normalizamos correo a minúsculas para búsqueda case-insensitive
$correo = isset($_POST['correo']) ? strtolower(trim($_POST['correo'])) : '';
$contrasena = isset($_POST['contrasena']) ? $_POST['contrasena'] : '';

// Validaciones mínimas
if ($correo === '' || $contrasena === '') {
    flash_set('Completa correo y contraseña', 'error');
    redirect('login_form.php');
}

// Validar formato de correo (después de normalizar)
if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    flash_set('Formato de correo inválido', 'error');
    redirect('login_form.php');
}

// Verificar conexión ($conexion viene de config.php)
if (!isset($conexion) || !$conexion) {
    // No exponemos detalles en producción
    flash_set('Problema con la conexión a la base de datos', 'error');
    redirect('login_form.php');
}

// Preparar sentencia (para evitar SQL injection)
// Usamos LOWER(correo) = LOWER(?) para forzar comparación case-insensitive
$stmt = $conexion->prepare("SELECT id, nombre, correo, contrasena, rol, activo FROM usuarios WHERE LOWER(correo) = LOWER(?) LIMIT 1");
if (!$stmt) {
    error_log("Error preparando login: " . $conexion->error);
    flash_set('Error de servidor (prepare)', 'error');
    redirect('login_form.php');
}

$stmt->bind_param("s", $correo);
$stmt->execute();
$result = $stmt->get_result();

if (!$result || $result->num_rows !== 1) {
    // No existe el correo
    // Para seguridad no decimos "correo no existe" — usamos mensaje genérico
    flash_set('Usuario o contraseña incorrecta', 'error');
    redirect('login_form.php');
}

$user = $result->fetch_assoc();
$hash = $user['contrasena']; // columna en DB, debe contener hash generado por password_hash

// Verificamos el hash con password_verify
if (!password_verify($contrasena, $hash)) {
    flash_set('Usuario o contraseña incorrecta', 'error');
    redirect('login_form.php');
}

// Opcional: Rehash si el algoritmo cambió/configuración
if (password_needs_rehash($hash, PASSWORD_DEFAULT)) {
    $newHash = password_hash($contrasena, PASSWORD_DEFAULT);
    $u = $conexion->prepare("UPDATE usuarios SET contrasena = ? WHERE id = ?");
    if ($u) {
        $u->bind_param("si", $newHash, $user['id']);
        $u->execute();
    }
}

// Verificar si la cuenta está activa
if ((isset($user['activo']) && (int)$user['activo'] === 0)) {
    flash_set('Cuenta inactiva. Contactá al administrador.', 'error');
    redirect('login_form.php');
}

// Todo OK: setear variables en sesión
// Regenerar id de sesión para prevenir fijación
session_regenerate_id(true);

$_SESSION['user_id'] = (int)$user['id'];
$_SESSION['user_nombre'] = $user['nombre'];
$_SESSION['user_email'] = $user['correo'];
$_SESSION['user_rol'] = $user['rol'];

// Registrar último acceso (opcional)
$u = $conexion->prepare("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?");
if ($u) {
    $u->bind_param("i", $user['id']);
    $u->execute();
}

// Redirigir al dashboard o una página interna
flash_set('Bienvenido ' . $user['nombre'], 'success');
redirect('index.html');


session_start();
require_once '../conexion.php';
header('Content-Type: application/json');

$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';

if (!$email || !$password) {
    echo json_encode(['ok'=>false,'error'=>'Faltan datos']);
    exit;
}

$stmt = $conn->prepare("SELECT id, contrasena FROM usuarios WHERE correo = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$res = $stmt->get_result();
$user = $res->fetch_assoc();
$stmt->close();

if ($user && password_verify($password, $user['contrasena'])) {
    $_SESSION['user_id'] = $user['id'];
    echo json_encode(['ok'=>true,'user_id'=>$_SESSION['user_id']]);
} else {
    echo json_encode(['ok'=>false,'error'=>'Credenciales inválidas']);
}
$conn->close();

// Buscar y reemplazar:
$redirect_uri = 'http://localhost/web-escolar/php/google-callback.php';
// Por:
$redirect_uri = 'http://localhost/web-escolar/php/google-callback.php';
