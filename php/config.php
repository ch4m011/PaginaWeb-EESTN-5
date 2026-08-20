<?php

/*
 * php/config.php
 * ----------------
 * Archivo de configuración central del proyecto.
 * - Carga variables desde `php/.env` si existe.
 * - Define constantes `DB_*` y crea conexiones MySQLi en `$conn` y `$mysqli`.
 * - Configura manejo de errores y logging para desarrollo.
 *
 * Propósito:
 * Este archivo debe ser la única fuente de verdad para la configuración
 * de conexión a la base de datos y opciones globales. Otros scripts
 * deben `require_once __DIR__ . '/php/config.php'` o `require_once __DIR__ . '/../php/config.php'`
 * según su ubicación para reutilizar la misma conexión y evitar duplicación.
 *
 * Excepciones / notas de seguridad:
 * - En producción desactivar `display_errors` (ponerlo a 0) y asegurar
 *   que los logs no sean accesibles públicamente.
 * - Evitar usar `root` con contraseña vacía en producción.
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
            if ($k !== '') {
                // solo definir si no existe ya en getenv
                if (getenv($k) === false) putenv("$k=$v");
                $_ENV[$k] = $v;
                $_SERVER[$k] = $v;
            }
        }
    }
}
// --- fin loader ---

// -----------------------------------------------------
//  CONFIGURACIÓN GOOGLE API
// -----------------------------------------------------
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', 'C:/xampp/php/logs/php_error.log');

// cargar vendor/autoload solo si existe
$autoload = __DIR__ . '/../vendor/autoload.php';
if (file_exists($autoload)) {
    require_once $autoload;
} else {
    file_put_contents(__DIR__ . '/debug_log.txt', '['.date('Y-m-d H:i:s').'] vendor/autoload.php no encontrado. Continuando.' . PHP_EOL, FILE_APPEND);
}

// conexión DB
$host = 'localhost';
$usuario = 'root';
$contrasena = '';
$base_datos = 'web_escolar';

try {
    $conexion = new mysqli($host, $usuario, $contrasena, $base_datos);
    
    if ($conexion->connect_error) {
        throw new Exception("Error de conexión: " . $conexion->connect_error);
    }
    
    $conexion->set_charset("utf8mb4");
    
} catch (Exception $e) {
    error_log("Error de conexión DB: " . $e->getMessage());
    die(json_encode([
        'success' => false,
        'message' => 'Error de conexión con la base de datos'
    ]));
}

// no instanciar Google_Client si no existe
if (!class_exists('Google_Client')) {
    file_put_contents(__DIR__ . '/debug_log.txt', '['.date('Y-m-d H:i:s').'] Google_Client no disponible.' . PHP_EOL, FILE_APPEND);
}

function logError($mensaje) {
    file_put_contents(__DIR__ . '/debug_log.txt', '['.date('Y-m-d H:i:s').'] ' . $mensaje . PHP_EOL, FILE_APPEND);
}

// --- CONFIGURACIÓN BASE DE DATOS ---
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'web_escolar');

try {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        throw new Exception("Error de conexión: " . $conn->connect_error);
    }

    $conn->set_charset("utf8mb4");
    
} catch (Exception $e) {
    error_log("Error de conexión: " . $e->getMessage());
    die(json_encode([
        'success' => false,
        'message' => 'Error de conexión a la base de datos'
    ]));
}

// --- CREACIÓN DE TABLAS ---
// Ejecuta esto en phpMyAdmin
/*
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    tipo_cuenta VARCHAR(20) DEFAULT 'manual',
    foto LONGTEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
*/

// filepath: c:\xampp\htdocs\web-escolar\php\config.php
// 
// Configuración centralizada de BD
// Protegida contra múltiples includes
//

// ========== CREDENCIALES DE BD (solo si no están definidas) ==========
if (!defined('DB_HOST')) define('DB_HOST', 'localhost');
if (!defined('DB_USER')) define('DB_USER', 'root');
if (!defined('DB_PASS')) define('DB_PASS', '');
if (!defined('DB_NAME')) define('DB_NAME', 'web_escolar');

// ========== CREAR CONEXIÓN MySQLi (solo si no existe) ==========
if (!isset($GLOBALS['mysqli'])) {
    $mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    // Chequear conexión
    if ($mysqli->connect_error) {
        error_log("Error conexión BD: " . $mysqli->connect_error);
        $mysqli = null;
    } else {
        // Charset UTF-8
        $mysqli->set_charset("utf8mb4");
        // Guardar en global para que otros includes la usen
        $GLOBALS['mysqli'] = $mysqli;
    }
} else {
    // Ya existe conexión, usarla
    $mysqli = $GLOBALS['mysqli'];
}

// ========== VARIABLES DE SESIÓN (compartidas con login/usuarios) ==========
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$loggedIn = isset($_SESSION['user_id']);
$userId = $_SESSION['user_id'] ?? null;
$userEmail = $_SESSION['user_email'] ?? null;

?>
