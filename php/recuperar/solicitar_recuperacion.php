<?php
/**
 * Paso 1 de "Olvidé mi contraseña".
 * Recibe el email (POST), genera un token de un solo uso (vence en 1 hora),
 * guarda SOLO su hash en `password_resets` y manda el link por mail (PHPMailer + .env).
 * Siempre responde lo mismo, exista o no el email.
 */
require_once __DIR__ . '/../config.php'; // $mysqli, carga php/.env, inicia sesión
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../PHPMailer/src/Exception.php';
require_once __DIR__ . '/../PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/../PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;

const RESET_MINUTOS = 60;
const RESET_MAX_POR_HORA = 3;

$respuesta = [
    'success' => true,
    'message' => 'Si el correo está registrado, te enviamos un enlace para restablecer la contraseña. Revisá también la carpeta de spam.'
];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

$email = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
if (!$email) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Ingresá un correo electrónico válido.']);
    exit;
}

// Tabla nueva (si no se ejecutó sql/06_password_resets.sql)
$mysqli->query("CREATE TABLE IF NOT EXISTS password_resets (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip VARCHAR(45) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY token_hash (token_hash),
  KEY user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

try {
    // Solo cuentas manuales activas (las de Google no tienen contraseña propia)
    $stmt = $mysqli->prepare("SELECT id, nombre, email FROM usuarios
                              WHERE email = ? AND deleted_at IS NULL AND tipo = 'manual' LIMIT 1");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$user) { echo json_encode($respuesta); exit; }

    // Límite: máx. 3 pedidos por hora por usuario
    $stmt = $mysqli->prepare("SELECT COUNT(*) FROM password_resets
                              WHERE user_id = ? AND created_at > (NOW() - INTERVAL 1 HOUR)");
    $stmt->bind_param('i', $user['id']);
    $stmt->execute();
    $stmt->bind_result($cant);
    $stmt->fetch();
    $stmt->close();
    if ($cant >= RESET_MAX_POR_HORA) { echo json_encode($respuesta); exit; }

    // Invalidar pedidos anteriores sin usar
    $stmt = $mysqli->prepare("UPDATE password_resets SET used_at = NOW() WHERE user_id = ? AND used_at IS NULL");
    $stmt->bind_param('i', $user['id']);
    $stmt->execute();
    $stmt->close();

    $token = bin2hex(random_bytes(32));
    $hash  = hash('sha256', $token);
    $ip    = $_SERVER['REMOTE_ADDR'] ?? null;

    $stmt = $mysqli->prepare("INSERT INTO password_resets (user_id, token_hash, expires_at, ip)
                              VALUES (?, ?, NOW() + INTERVAL " . RESET_MINUTOS . " MINUTE, ?)");
    $stmt->bind_param('iss', $user['id'], $hash, $ip);
    $stmt->execute();
    $stmt->close();

    // URL base: en producción definí APP_URL en php/.env (ej: APP_URL=https://eest5.com)
    // En XAMPP se arma sola: http://localhost/<carpeta-del-proyecto>
    $base = getenv('APP_URL');
    if (!$base) {
        $raiz = preg_replace('#/php/recuperar/[^/]*$#', '', $_SERVER['SCRIPT_NAME']);
        $base = 'http://localhost' . $raiz;
    }
    $link = rtrim($base, '/') . '/html/restablecer_contrasena.html?token=' . $token;

    $nombre = htmlspecialchars($user['nombre'], ENT_QUOTES, 'UTF-8');

    try {
        if (!getenv('GMAIL_USER') || !getenv('GMAIL_PASS')) {
            throw new Exception('Faltan GMAIL_USER / GMAIL_PASS en php/.env');
        }
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host       = getenv('GMAIL_SMTP_HOST') ?: 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = getenv('GMAIL_USER');
        $mail->Password   = getenv('GMAIL_PASS');
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = getenv('GMAIL_SMTP_PORT') ? intval(getenv('GMAIL_SMTP_PORT')) : 587;
        $mail->CharSet    = 'UTF-8';
        $mail->setFrom(getenv('GMAIL_USER'), getenv('GMAIL_NAME') ?: 'Sitio Web');
        $mail->addAddress($user['email'], $user['nombre']);
        $mail->isHTML(true);
        $mail->Subject = 'Restablecer tu contraseña';
        $mail->Body = "<p>Hola $nombre,</p>"
            . "<p>Recibimos un pedido para restablecer tu contraseña. Hacé clic en el botón (vence en 1 hora y se puede usar una sola vez):</p>"
            . "<p><a href=\"$link\" style=\"background:#1d4e89;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;display:inline-block\">Restablecer contraseña</a></p>"
            . "<p>Si el botón no funciona, copiá este enlace en tu navegador:<br>$link</p>"
            . "<p>Si no fuiste vos, ignorá este mensaje: tu contraseña no cambia.</p>";
        $mail->AltBody = "Restablecé tu contraseña (vence en 1 hora): $link";
        $mail->send();
    } catch (Throwable $e) {
        logError('Recuperar contraseña - error al enviar mail: ' . $e->getMessage());
    }
} catch (Throwable $e) {
    logError('Recuperar contraseña: ' . $e->getMessage());
}

echo json_encode($respuesta);
