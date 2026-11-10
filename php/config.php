<?php

/**
 * php/config.php
 * ----------------
 * Configuración central del proyecto. Fuente única de verdad para:
 *  - Carga de variables de entorno desde `php/.env`.
 *  - Conexión MySQLi (se expone como $mysqli, con $conn y $conexion
 *    como alias del MISMO objeto, para no romper código existente
 *    que ya usaba cualquiera de esos tres nombres).
 *  - Constantes DB_* (protegidas con if !defined para permitir includes múltiples).
 *  - Sesión PHP y variables de sesión compartidas ($loggedIn, $userId, $userEmail).
 *  - Autoload de Composer/PHPMailer si existe.
 *  - Logging de errores a un archivo de log (fuera del control de versiones).
 *
 * Otros scripts deben hacer:
 *   require_once __DIR__ . '/config.php';               (desde dentro de php/)
 *   require_once __DIR__ . '/../php/config.php';         (desde una subcarpeta)
 *
 * Notas de seguridad:
 *  - En producción, poner display_errors en 0.
 *  - No usar 'root' con contraseña vacía en producción.
 *  - php/.env NO debe subirse al repositorio (ver .gitignore).
 */

// --- CARGAR VARIABLES DE ENTORNO (.env) si existen ---
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($k, $v) = explode('=', $line, 2);
            $k = trim($k); $v = trim($v);
            if ($k !== '' && getenv($k) === false) {
                putenv("$k=$v");
                $_ENV[$k] = $v;
                $_SERVER[$k] = $v;
            }
        }
    }
}

// --- ERRORES / LOGGING ---
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/debug_log.txt'); // archivo ignorado por git, ver .gitignore

function logError(string $mensaje): void {
    file_put_contents(__DIR__ . '/debug_log.txt', '[' . date('Y-m-d H:i:s') . '] ' . $mensaje . PHP_EOL, FILE_APPEND);
}

// --- AUTOLOAD (Composer / PHPMailer) si existe ---
$autoload = __DIR__ . '/../vendor/autoload.php';
if (file_exists($autoload)) {
    require_once $autoload;
} else {
    logError('vendor/autoload.php no encontrado. Continuando.');
}
if (!class_exists('Google_Client')) {
    logError('Google_Client no disponible.');
}

// --- CREDENCIALES DE BD ---
$dbHost = getenv('DB_HOST') ?: 'localhost';
$dbUser = getenv('DB_USER') ?: 'root';
$dbPass = getenv('DB_PASS') ?: '';
$dbName = getenv('DB_NAME') ?: 'web-escolar';

// Constantes globales
if (!defined('DB_HOST')) define('DB_HOST', $dbHost);
if (!defined('DB_USER')) define('DB_USER', $dbUser);
if (!defined('DB_PASS')) define('DB_PASS', $dbPass);
if (!defined('DB_NAME')) define('DB_NAME', $dbName);

define('GOOGLE_CLIENT_SECRET', 'TU_CLIENT_SECRET');

// Conexión inicial sin seleccionar base de datos
$mysqli = new mysqli($dbHost, $dbUser, $dbPass);

if ($mysqli->connect_error) {
    logError('Error de conexión: ' . $mysqli->connect_error);
    die('No se pudo conectar con MySQL.');
}

// Crear base si no existe
$sql = "CREATE DATABASE IF NOT EXISTS `$dbName`
        CHARACTER SET utf8mb4
        COLLATE utf8mb4_general_ci";

if (!$mysqli->query($sql)) {
    logError('Error creando BD: ' . $mysqli->error);
    die('No se pudo crear la base de datos.');
}

// Seleccionar base
if (!$mysqli->select_db($dbName)) {
    logError('Error seleccionando BD: ' . $mysqli->error);
    die('No se pudo seleccionar la base de datos.');
}

$mysqli->set_charset('utf8mb4');

// Variables compartidas
$GLOBALS['mysqli'] = $mysqli;

$conn = $mysqli;
$conexion = $mysqli;

// --- INSTALACIÓN AUTOMÁTICA ---
require_once __DIR__ . '/bd/instalar.php';

// --- SESIÓN (compartida con login/usuarios) ---
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

if (isset($_SESSION['id'])) {
    $id = $_SESSION['id'];

    // Se revalida contra la BD en cada request: el rol siempre es el actual
    // y una cuenta eliminada (deleted_at) deja de tener sesión válida.
    $stmt = $mysqli->prepare("SELECT rol, nombre, email FROM usuarios WHERE id = ? AND deleted_at IS NULL");
    $stmt->bind_param("i", $id);
    $stmt->execute();

    $usuario = $stmt->get_result()->fetch_assoc();

    if ($usuario) {
        $_SESSION['rol'] = $usuario['rol'];
        $_SESSION['nombre'] = $usuario['nombre'];
        $_SESSION['email'] = $usuario['email'];
    } else {
        // La cuenta ya no existe o fue dada de baja: se descartan los datos
        // de autenticación obsoletos (la sesión queda activa para poder volver a loguearse).
        unset($_SESSION['id'], $_SESSION['rol'], $_SESSION['nombre'], $_SESSION['email']);
    }
}

$loggedIn  = isset($_SESSION['id']);
$userId    = $_SESSION['id'] ?? null;
$userEmail = $_SESSION['email'] ?? null;

/**
 * Cabeceras estándar para endpoints JSON con CORS abierto.
 * Antes estaba copiado y pegado en 5+ archivos distintos.
 */
function enviarCabecerasJson(): void {
    header('Content-Type: application/json; charset=UTF-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}

// El esquema de la tabla `usuarios` vive en sql/usuarios.sql (fuente de verdad).
// No se recrea aquí para evitar tener el DDL duplicado en dos lugares.
