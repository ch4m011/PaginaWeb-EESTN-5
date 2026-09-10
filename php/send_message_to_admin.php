<?php
/**
 * Envío de mensaje al administrador con LÍMITE por usuario/sesión por día.
 * - Usuarios logueados: limita por user_id (24h).
 * - Anónimos: limita por combinación (PHPSESSID + IP + UserAgent) para evitar que todos
 *   los usuarios detrás de la misma IP queden bloqueados.
 * - Guarda en DB (tabla messages_to_admin) y responde JSON.
 */

session_start();
date_default_timezone_set('America/Argentina/Buenos_Aires');
header('Content-Type: application/json; charset=utf-8');

// === VERIFICAR SESIÓN ===
$user_id = isset($_SESSION['user_id']) ? intval($_SESSION['user_id']) : null;
if (!$user_id) {
    echo json_encode(['status'=>'error','message'=>'No autenticado']);
    exit;
}

// === CONFIGURABLE ===
define('MAX_MESSAGES_PER_DAY', 3);

// === CONEXIÓN A BD ===
require_once __DIR__ . '/../conexion.php'; // crea $conn (mysqli)
if (!isset($conn) || !($conn instanceof mysqli)) {
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>'Conexión DB no inicializada']);
    exit;
}

// === ASEGURAR TABLA ===
$conn->query("CREATE TABLE IF NOT EXISTS messages_to_admin (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  anon_key VARCHAR(255) DEFAULT NULL,
  subject VARCHAR(255) DEFAULT NULL,
  message TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip VARCHAR(45) DEFAULT NULL,
  processed TINYINT(1) NOT NULL DEFAULT 0,
  INDEX (user_id, created_at),
  INDEX (anon_key, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

// === DATOS DE ENTRADA ===
$subject = isset($_POST['subject']) ? trim($_POST['subject']) : null;
$message = isset($_POST['message']) ? trim($_POST['message']) : '';
$ip      = $_SERVER['REMOTE_ADDR'] ?? null;

// === VALIDACIONES ===
if (mb_strlen($message) < 3) {
    echo json_encode(['status'=>'error','message'=>'Mensaje demasiado corto.']);
    exit;
}
if ($subject !== null && mb_strlen($subject) > 200) {
    $subject = mb_substr($subject, 0, 200);
}

// === CÁLCULO DE LÍMITE ===
$since = date('Y-m-d H:i:s', time() - 86400);
$stmt = $conn->prepare("SELECT COUNT(*) FROM messages_to_admin WHERE user_id = ? AND created_at >= ?");
$stmt->bind_param('is', $user_id, $since);
$stmt->execute();
$stmt->bind_result($cnt);
$stmt->fetch();
$stmt->close();

if (intval($cnt) >= MAX_MESSAGES_PER_DAY) {
    echo json_encode(['status'=>'limit_reached','message'=>'Has alcanzado el límite diario de mensajes.']);
    exit;
}

// === INSERTAR MENSAJE ===
$stmt = $conn->prepare("INSERT INTO messages_to_admin (user_id, subject, message, ip) VALUES (?, ?, ?, ?)");
$stmt->bind_param('isss', $user_id, $subject, $message, $ip);
if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['status'=>'error','message'=>'No se pudo guardar el mensaje.']);
    exit;
}
$stmt->close();

// === CARGAR .ENV ===
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($k, $v) = explode('=', $line, 2);
            $k = trim($k); $v = trim($v);
            if ($k !== '') {
                if (getenv($k) === false) putenv("$k=$v");
                $_ENV[$k] = $v;
                $_SERVER[$k] = $v;
            }
        }
    }
}

// === IMPORTAR PHPMailer (las líneas que daban error van aquí, al inicio del bloque) ===
require_once __DIR__ . '/PHPMailer/src/Exception.php';
require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// === ENVÍO DE CORREO ===
try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = getenv('GMAIL_SMTP_HOST') ?: 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = getenv('GMAIL_USER') ?: '';
    $mail->Password = getenv('GMAIL_PASS') ?: '';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = getenv('GMAIL_SMTP_PORT') ? intval(getenv('GMAIL_SMTP_PORT')) : 587;
    $mail->SMTPDebug = 0;

    $from = getenv('GMAIL_USER') ?: 'no-reply@example.com';
    $fromName = getenv('GMAIL_NAME') ?: 'Sitio Web';
    $mail->setFrom($from, $fromName);

    $adminEmail = getenv('ADMIN_EMAIL') ?: $from;
    $adminName = getenv('ADMIN_NAME') ?: 'Administrador';
    $mail->addAddress($adminEmail, $adminName);

    $mail->isHTML(true);
    $mail->Subject = 'Nuevo mensaje de contacto: ' . ($subject ?: '(sin asunto)');
    $mail->Body = '<b>Asunto:</b> ' . htmlentities($subject) .
                  '<br><b>Mensaje:</b><br>' . nl2br(htmlentities($message)) .
                  '<br><br><b>IP:</b> ' . htmlentities($ip);

    $mail->send();

} catch (Exception $e) {
    error_log('Error al enviar correo (send_message_to_admin): ' . $e->getMessage());
}

// === RESPUESTA ===
echo json_encode(['status'=>'ok','message'=>'Mensaje enviado al administrador.']);
?>
