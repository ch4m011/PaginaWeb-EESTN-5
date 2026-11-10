
<?php

// --------------------------------------------------
// CONFIGURACIÓN
// --------------------------------------------------

if (ob_get_length()) {
    ob_clean();
}

header('Content-Type: application/json; charset=utf-8');

ini_set('display_errors', 0);
ini_set('log_errors', 1);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

require_once __DIR__ . '/../config.php';

// --------------------------------------------------
// RESPUESTA JSON
// --------------------------------------------------

function responder($success, $mensaje) {
    echo json_encode([
        'success' => $success,
        'error' => $success ? null : $mensaje,
        'message' => $mensaje
    ]);

    exit;
}

// --------------------------------------------------
// COMPROBAR SESIÓN
// --------------------------------------------------

if (!isset($_SESSION['id'])) {
    responder(false, 'No hay una sesión iniciada.');
}

$user_id = (int) $_SESSION['id'];

// --------------------------------------------------
// RECIBIR CREDENCIAL
// --------------------------------------------------

$input = json_decode(file_get_contents('php://input'), true);

$id_token = $input['credential'] ?? $input['id_token'] ?? null;

if (!$id_token) {
    responder(false, 'No se recibió la credencial de Google.');
}

// --------------------------------------------------
// BUSCAR USUARIO
// --------------------------------------------------

$stmt = $conn->prepare("
    SELECT id, google_sub, tipo
    FROM usuarios
    WHERE id = ?
    LIMIT 1
");

if (!$stmt) {
    responder(false, 'Error al consultar el usuario.');
}

$stmt->bind_param('i', $user_id);
$stmt->execute();

$resultado = $stmt->get_result();
$usuario = $resultado->fetch_assoc();

$stmt->close();

if (!$usuario) {
    responder(false, 'No se encontró el usuario.');
}

// Comprobar que la cuenta esté vinculada a Google
if (
    $usuario['tipo'] !== 'google' ||
    empty($usuario['google_sub'])
) {
    responder(false, 'La cuenta no está vinculada a Google.');
}

// --------------------------------------------------
// VERIFICAR TOKEN CON GOOGLE
// --------------------------------------------------

$url = 'https://oauth2.googleapis.com/tokeninfo?id_token='
     . urlencode($id_token);

$ch = curl_init($url);

curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2
]);

$respuesta = curl_exec($ch);
$codigoHTTP = curl_getinfo($ch, CURLINFO_HTTP_CODE);

curl_close($ch);

if ($respuesta === false || $codigoHTTP !== 200) {
    responder(false, 'No se pudo verificar la cuenta de Google.');
}

$info = json_decode($respuesta, true);

if (!$info) {
    responder(false, 'La respuesta de Google no es válida.');
}

// --------------------------------------------------
// VALIDAR IDENTIDAD
// --------------------------------------------------

$client_id = '475324951083-lp2pvqi80vs95cshsij7hn5m8tg3b0s3.apps.googleusercontent.com';

if (
    !isset($info['sub'], $info['aud'], $info['iss'], $info['exp']) ||
    $info['aud'] !== $client_id ||
    !in_array($info['iss'], [
        'accounts.google.com',
        'https://accounts.google.com'
    ]) ||
    (int)$info['exp'] <= time()
) {
    responder(false, 'La credencial de Google no es válida.');
}

// Comprobar que sea la misma cuenta de Google
if (!hash_equals(
    (string)$usuario['google_sub'],
    (string)$info['sub']
)) {
    responder(false, 'La cuenta de Google no coincide.');
}

// --------------------------------------------------
// AUTORIZAR ELIMINACIÓN
// --------------------------------------------------

$_SESSION['google_delete_verified'] = [
    'user_id' => $user_id,
    'expires' => time() + 300
];

responder(true, 'Identidad verificada correctamente.');

?>
