<?php
// Verificar estado de la sesión para diagnóstico
if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');

error_log('[check_session] Verificando sesión. session_id=' . session_id() . ', session_status=' . session_status());
error_log('[check_session] $_SESSION: ' . json_encode($_SESSION));

$response = [
    'session_id' => session_id(),
    'session_status' => session_status(),
    'has_user_id' => isset($_SESSION['user_id']),
    'user_id' => $_SESSION['user_id'] ?? $_SESSION['id'] ?? null,
    // Normalizar claves de nombre y correo que pueden venir de distintos scripts
    'nombre' => $_SESSION['nombre'] ?? $_SESSION['user_nombre'] ?? $_SESSION['user_name'] ?? null,
    'correo' => $_SESSION['correo'] ?? $_SESSION['user_email'] ?? $_SESSION['email'] ?? null,
    'all_session_vars' => $_SESSION
];

if (!empty($_SESSION['user_id'])) {
    $response['success'] = true;
    $response['message'] = 'Sesión activa';
} else {
    $response['success'] = false;
    $response['message'] = 'No hay sesión iniciada';
}

echo json_encode($response);
exit;
?>
