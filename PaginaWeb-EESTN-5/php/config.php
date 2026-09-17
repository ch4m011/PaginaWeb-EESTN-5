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
 * o simplemente require_once '.../conexion.php', que ahora delega aquí.
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
// En XAMPP normalmente se usa root sin contraseña. Se puede cambiar
// DB_HOST, DB_USER, DB_PASS y DB_NAME desde php/.env.
$dbHost = getenv('DB_HOST') ?: 'localhost';
$dbUser = getenv('DB_USER') ?: 'root';
$dbPass = getenv('DB_PASS') ?: '';
$dbName = 'web_escolar';
// Si existe un .env con un nombre anterior (por ejemplo web_escolar),
// no lo usamos porque la base real del proyecto se llama web_escolar.
// Para cambiarla manualmente, modificá esta línea.

// Si "web_escolar" no existe pero el usuario ya importó las tablas en otra
// base local, buscamos una base que tenga las tablas principales del proyecto.
// Esto evita que el sitio quede inutilizado simplemente porque la base fue
// creada con otro nombre en phpMyAdmin.
$mysqli = @new mysqli($dbHost, $dbUser, $dbPass, $dbName);

if ($mysqli->connect_errno === 1049) {
    $servidor = @new mysqli($dbHost, $dbUser, $dbPass);

    if (!$servidor->connect_error) {
        $dbDetectada = null;
        $consulta = $servidor->query("
            SELECT t.table_schema
            FROM information_schema.tables t
            WHERE t.table_schema NOT IN ('information_schema','mysql','performance_schema','sys')
              AND t.table_name IN ('usuarios','noticias')
            GROUP BY t.table_schema
            HAVING COUNT(DISTINCT t.table_name) = 2
            ORDER BY CASE WHEN t.table_schema = 'web_escolar' THEN 0 ELSE 1 END, t.table_schema
            LIMIT 1
        ");

        if ($consulta) {
            $fila = $consulta->fetch_assoc();
            $dbDetectada = $fila['table_schema'] ?? null;
        }
        $servidor->close();

        if ($dbDetectada) {
            $dbName = $dbDetectada;
            $mysqli = @new mysqli($dbHost, $dbUser, $dbPass, $dbName);
        }
    }
}

if ($mysqli->connect_error) {
    $mensaje = 'Error de conexión DB: ' . $mysqli->connect_error;
    logError($mensaje);
    http_response_code(500);
    die(json_encode([
        'success' => false,
        'message' => 'No se pudo conectar con la base de datos. Verificá que MySQL esté iniciado y que la base creada en phpMyAdmin tenga las tablas usuarios y noticias.',
        'error' => $mysqli->connect_error
    ]));
}

if (!defined('DB_HOST')) define('DB_HOST', $dbHost);
if (!defined('DB_USER')) define('DB_USER', $dbUser);
if (!defined('DB_PASS')) define('DB_PASS', $dbPass);
if (!defined('DB_NAME')) define('DB_NAME', $dbName);

$mysqli->set_charset('utf8mb4');
$GLOBALS['mysqli'] = $mysqli;

// Alias de compatibilidad: código heredado usa $conn o $conexion.
$conn = $mysqli;
$conexion = $mysqli;

// --- SESIÓN (compartida con login/usuarios) ---
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
$loggedIn  = isset($_SESSION['user_id']);
$userId    = $_SESSION['user_id'] ?? null;
$userEmail = $_SESSION['user_email'] ?? null;

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
