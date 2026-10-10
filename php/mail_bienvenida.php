<?php
/**
 * php/mail_bienvenida.php
 * Envía un mail de bienvenida al correo de la persona que acaba de crear su cuenta.
 * Usa PHPMailer y las credenciales GMAIL_* de php/.env (igual que el formulario de contacto).
 * Nunca lanza errores: si el mail falla, el registro sigue funcionando y el motivo
 * queda en php/debug_log.txt.
 */

require_once __DIR__ . '/PHPMailer/src/Exception.php';
require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/src/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;

function enviarMailBienvenida(string $email, string $nombre): bool
{
    try {
        if (!getenv('GMAIL_USER') || !getenv('GMAIL_PASS')) {
            throw new Exception('Faltan GMAIL_USER / GMAIL_PASS en php/.env');
        }

        // URL del sitio: APP_URL en php/.env, o la dirección local con la que se abrió la web.
        $base = getenv('APP_URL');
        if (!$base) {
            $raiz = preg_replace('#/php/[^?]*$#', '', $_SERVER['SCRIPT_NAME'] ?? '');
            $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
            $esq  = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
            if (!preg_match('/^(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d{1,5})?$/', $host)) {
                $host = 'localhost';
            }
            $base = $esq . '://' . $host . $raiz;
        }
        $linkWeb   = rtrim($base, '/') . '/html/index.html';
        $linkLogin = rtrim($base, '/') . '/html/login.html';

        $nombreSeguro = htmlspecialchars($nombre, ENT_QUOTES, 'UTF-8');

        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host       = getenv('GMAIL_SMTP_HOST') ?: 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = getenv('GMAIL_USER');
        $mail->Password   = getenv('GMAIL_PASS');
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = getenv('GMAIL_SMTP_PORT') ? intval(getenv('GMAIL_SMTP_PORT')) : 587;
        $mail->Timeout    = 10;
        $mail->CharSet    = 'UTF-8';
        $mail->setFrom(getenv('GMAIL_USER'), getenv('GMAIL_NAME') ?: 'Web Escuela Técnica');
        $mail->addAddress($email, $nombre);

        $mail->isHTML(true);
        $mail->Subject = '¡Bienvenido/a a la web de la E.E.S.T. N.º 5!';
        $mail->Body = '
<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#14202e">
  <h2 style="color:#003d7a;margin-bottom:4px">¡Hola, ' . $nombreSeguro . '!</h2>
  <p>Tu cuenta en la web de la <strong>E.E.S.T. N.º 5 "Gral. Manuel N. Savio"</strong> se creó correctamente.</p>
  <p>Con tu cuenta podés seguir las noticias y el calendario de eventos de la escuela, actualizar tu perfil y escribirle al administrador desde el formulario de contacto.</p>
  <p style="margin:24px 0">
    <a href="' . $linkLogin . '" style="background:#f5a623;color:#1a1204;padding:11px 20px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block">Iniciar sesión</a>
  </p>
  <p style="font-size:14px;color:#5b6777">Si alguna vez olvidás tu contraseña, usá la opción <em>"¿Olvidaste tu contraseña?"</em> en la pantalla de inicio de sesión.</p>
  <p style="font-size:14px;color:#5b6777">Si no fuiste vos quien creó esta cuenta, ignorá este mensaje o escribinos desde la sección Ayuda &gt; Contacto de la web.</p>
  <hr style="border:none;border-top:1px solid #e3e9f1;margin:24px 0">
  <p style="font-size:12px;color:#8a94a3">Este es un mensaje automático. <a href="' . $linkWeb . '" style="color:#0f5fa8">Ir a la web</a></p>
</div>';
        $mail->AltBody = "Hola $nombre, tu cuenta en la web de la E.E.S.T. N.º 5 se creó correctamente. Iniciá sesión en: $linkLogin";

        $mail->send();
        return true;
    } catch (Throwable $e) {
        if (function_exists('logError')) {
            logError('Mail de bienvenida a ' . $email . ': ' . $e->getMessage());
        } else {
            error_log('Mail de bienvenida: ' . $e->getMessage());
        }
        return false;
    }
}
