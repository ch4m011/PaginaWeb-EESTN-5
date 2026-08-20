<?php
require_once __DIR__ . '/../includes/db.php'; // $mysqli
session_start();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

$token = $_POST['token'] ?? $_GET['token'] ?? '';
$password = $_POST['password'] ?? '';

if (!$token) {
    http_response_code(400);
    echo json_encode(['error' => 'Token requerido']);
    exit;
}

$sql = "SELECT id, password_hash FROM usuarios WHERE deletion_token = ? AND deleted_at IS NULL";
$stmt = $mysqli->prepare($sql);
if (!$stmt) { error_log($mysqli->error); http_response_code(500); echo json_encode(['error'=>'DB error']); exit; }
$stmt->bind_param('s', $token);
$stmt->execute();
$stmt->bind_result($id, $hash);
if (!$stmt->fetch()) {
    http_response_code(400);
    echo json_encode(['error' => 'Token inválido o expirado']);
    exit;
}
$stmt->close();

if (!password_verify($password, $hash)) {
    http_response_code(403);
    echo json_encode(['error' => 'Contraseña incorrecta']);
    exit;
}

// marcar soft-delete y limpiar token
$deleted_at = date('Y-m-d H:i:s');
$sql2 = "UPDATE usuarios SET deleted_at = ?, deletion_token = NULL WHERE id = ?";
$stmt2 = $mysqli->prepare($sql2);
if (!$stmt2) { error_log($mysqli->error); http_response_code(500); echo json_encode(['error'=>'DB error']); exit; }
$stmt2->bind_param('si', $deleted_at, $id);
$stmt2->execute();
$stmt2->close();

// destruir sesión en servidor (reemplazar bloque existente)
error_log('DEBUG: Cookies antes de destruir: ' . print_r($_COOKIE, true));

$_SESSION = [];
if (session_id()) {
    $params = session_get_cookie_params();
    $path = $params['path'] ?? '/';
    $domain = $params['domain'] ?? '';
    $secure = !empty($params['secure']);
    $httponly = !empty($params['httponly']);
    $samesite = $params['samesite'] ?? null; // PHP >= 7.3 puede devolver esto

    if (PHP_VERSION_ID >= 70300) {
        $options = [
            'expires'  => time() - 42000,
            'path'     => $path,
            'domain'   => $domain,
            'secure'   => $secure,
            'httponly' => $httponly,
        ];
        if ($samesite) $options['samesite'] = $samesite;
        setcookie(session_name(), '', $options);
    } else {
        $cookie = session_name() . '=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=' . $path;
        if ($domain) $cookie .= '; Domain=' . $domain;
        if ($secure) $cookie .= '; Secure';
        if ($httponly) $cookie .= '; HttpOnly';
        // intentar SameSite=None si necesitas borrar cookies con SameSite=None (requiere Secure en modernos)
        $cookie .= '; SameSite=None';
        header('Set-Cookie: ' . $cookie);
    }
}
session_unset();
session_destroy();

// Expirar cookies propias con los mismos parámetros (ajusta nombre si corresponde)
if (isset($_COOKIE['auth_token'])) {
    if (PHP_VERSION_ID >= 70300) {
        setcookie('auth_token', '', ['expires' => time() - 42000, 'path' => '/', 'domain' => $domain, 'secure' => $secure, 'httponly' => true, 'samesite' => $samesite ?? 'None']);
    } else {
        header('Set-Cookie: auth_token=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=None');
    }
    unset($_COOKIE['auth_token']);
}

error_log('DEBUG: Headers enviados: ' . print_r(headers_list(), true));

// Respuesta JSON con redirect
echo json_encode([
    'ok' => true,
    'message' => 'Cuenta marcada para eliminación. Sesión cerrada.',
    'redirect' => '/' // ajustar si tu home es otra ruta
]);
exit;
?>