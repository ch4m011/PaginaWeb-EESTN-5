<?php
// logout.php
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

// Destruir la sesión completamente
$_SESSION = [];
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}
session_destroy();

// Si usas alguna cookie 'remember' o custom, bórrala aquí:
// setcookie('remember_token', '', time() - 3600, '/');

// Devolver JSON para que el cliente sepa que ya cerró (nunca cacheable)
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Content-Type: application/json');
echo json_encode(['ok' => true]);
exit;
