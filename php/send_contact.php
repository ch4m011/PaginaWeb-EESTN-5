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
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['ok' => false, 'error' => 'Método no permitido']);
        exit;
    }

    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!$data) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'JSON inválido']);
        exit;
    }

    $nombre = trim($data['nombre'] ?? '');
    $email = trim($data['email'] ?? '');
    $mensaje = trim($data['mensaje'] ?? '');
    $usuarioLogueado = trim($data['usuarioLogueado'] ?? '');

    if ($usuarioLogueado === '') {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'Debes iniciar sesión']);
        exit;
    }

    if ($nombre === '' || $email === '' || $mensaje === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Faltan campos']);
        exit;
    }

    // Cargar configuración de correo si existe
    $destinatario = 'destino@ejemplo.com';
    $subjectPrefix = '[Contacto Web]';
    $configPath = __DIR__ . '/../date/mail_config.json';
    if (file_exists($configPath)) {
        $cfg = json_decode(file_get_contents($configPath), true);
        if (!empty($cfg['to'])) $destinatario = $cfg['to'];
        if (!empty($cfg['subject_prefix'])) $subjectPrefix = $cfg['subject_prefix'];
    }

    $subject = $subjectPrefix . ' ' . $nombre;
    $body = "Nombre: {$nombre}\nEmail: {$email}\nUsuario logueado: {$usuarioLogueado}\n\nMensaje:\n{$mensaje}\n";
    $headers = "From: {$nombre} <{$email}>\r\nReply-To: {$email}\r\n";

    // Intento con mail() nativo (requiere configuración en XAMPP/Windows)
    $ok = @mail($destinatario, $subject, $body, $headers);

    if (!$ok) {
        // Si mail() falla, responder error explícito para configurar SMTP
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'No se pudo enviar. Configura SMTP en date/mail_config.json']);
        exit;
    }

    echo json_encode(['ok' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Error del servidor']);
}

