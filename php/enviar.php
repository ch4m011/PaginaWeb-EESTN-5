<?php

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

header('Content-Type: application/json');

// Log de depuración
file_put_contents('debug.txt', 'Llamada recibida: ' . date('Y-m-d H:i:s') . "\n", FILE_APPEND);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/src/Exception.php';
require 'PHPMailer/src/PHPMailer.php';
require 'PHPMailer/src/SMTP.php';

/**
 * Cargar variables desde archivo .env
 */
function cargar_env($ruta) {
    if (!file_exists($ruta)) return;
    $lineas = file($ruta, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lineas as $linea) {
        if (trim($linea) === '' || str_starts_with(trim($linea), '#')) continue;
        list($clave, $valor) = explode('=', $linea, 2);
        $_ENV[trim($clave)] = trim(str_replace('"', '', $valor));
    }
}

cargar_env(__DIR__ . '/.env');

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    $nombre  = $_POST['nombre'] ?? '';
    $email   = $_POST['email'] ?? '';
    $mensaje = $_POST['mensaje'] ?? '';

    if (!$nombre || !$email || !$mensaje) {
        echo json_encode(['status' => 'error', 'message' => 'Complete todos los campos']);
        exit;
    }

    $mail = new PHPMailer(true);

    try {
        // Configuración SMTP Gmail
        $mail->isSMTP();
    // Configuración usando variables de entorno
    $mail->Host = getenv('GMAIL_SMTP_HOST') ? getenv('GMAIL_SMTP_HOST') : 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = getenv('GMAIL_USER') ?: getenv('GMAIL') ?: 'TU_CORREO@gmail.com';
    $mail->Password = getenv('GMAIL_PASS') ?: '';
    $mail->SMTPSecure = defined('PHPMailer::ENCRYPTION_STARTTLS') ? PHPMailer::ENCRYPTION_STARTTLS : 'tls';
    $mail->Port = getenv('GMAIL_SMTP_PORT') ? intval(getenv('GMAIL_SMTP_PORT')) : 587;
    // Debug temporal (registrar en error_log) - quitar en producción
    $mail->SMTPDebug = 0;
    $mail->Debugoutput = function($str, $level) { error_log("PHPMailer debug level $level; message: $str"); };
    file_put_contents('debug.txt', "GMAIL_USER: " . ($_ENV['GMAIL_USER'] ?? 'NO DEFINIDO') . "\n", FILE_APPEND);

        // Remitente y destinatario
        $mail->setFrom($_ENV['GMAIL_USER'], $_ENV['GMAIL_NAME']);
        $mail->addAddress($_ENV['GMAIL_USER'], 'Administrador');
        $mail->addReplyTo($email, $nombre);

        // Contenido del correo
        $mail->isHTML(true);
        $mail->Subject = 'Nuevo mensaje de contacto';
        $mail->Body    = "
            <strong>Nombre:</strong> $nombre <br>
            <strong>Email:</strong> $email <br>
            <strong>Mensaje:</strong><br>
            $mensaje
        ";

        $mail->send();
        echo json_encode(['status' => 'success', 'message' => 'Mensaje enviado correctamente.']);
    } catch (Exception $e) {
        file_put_contents('debug.txt', "[" . date('Y-m-d H:i:s') . "] Error: " . $mail->ErrorInfo . "\n", FILE_APPEND);
        echo json_encode(['status' => 'error', 'message' => "Error al enviar: {$mail->ErrorInfo}"]);
    }

} else {
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido']);
}
?>
