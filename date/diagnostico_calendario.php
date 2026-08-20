<?php
/**
 * Script de diagnóstico para verificar por qué eventos existentes está vacío
 * 1. Muestra datos de sesión del usuario logueado
 * 2. Muestra todos los eventos en la BD con sus autores
 * 3. Intenta hacer la query de filtro mine
 */

require_once __DIR__ . '/../php/config.php';

// Header JSON para facilitar lectura
header('Content-Type: application/json; charset=utf-8');

$response = [];

// 1. Información de sesión
$response['sesion'] = [
    'user_id' => $_SESSION['user_id'] ?? null,
    'user_email' => $_SESSION['user_email'] ?? null,
    'correo' => $_SESSION['correo'] ?? null,
    'id_sesion' => session_id(),
];

// 2. Todos los eventos con autores
$response['todos_eventos'] = [];
$query = "SELECT id, fecha, titulo, autor_id, autor_email, fecha_creacion FROM calendarios ORDER BY fecha DESC LIMIT 20";
$result = $mysqli->query($query);
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $response['todos_eventos'][] = $row;
    }
}

// 3. Intentar query de filtro mine usando user_id
$response['filtro_por_id'] = [];
$sid = intval($_SESSION['user_id'] ?? 0);
if ($sid > 0) {
    $query_id = "SELECT id, fecha, titulo, autor_id, autor_email FROM calendarios WHERE autor_id = " . $sid;
    $result_id = $mysqli->query($query_id);
    if ($result_id) {
        while ($row = $result_id->fetch_assoc()) {
            $response['filtro_por_id'][] = $row;
        }
    } else {
        $response['filtro_por_id_error'] = $mysqli->error;
    }
}

// 4. Intentar query de filtro mine usando email
$response['filtro_por_email'] = [];
$email = strtolower(trim($_SESSION['user_email'] ?? $_SESSION['correo'] ?? ''));
if (!empty($email)) {
    $email_esc = $mysqli->real_escape_string($email);
    $query_email = "SELECT id, fecha, titulo, autor_id, autor_email FROM calendarios WHERE LOWER(TRIM(autor_email)) = '" . $email_esc . "'";
    $result_email = $mysqli->query($query_email);
    if ($result_email) {
        while ($row = $result_email->fetch_assoc()) {
            $response['filtro_por_email'][] = $row;
        }
    } else {
        $response['filtro_por_email_error'] = $mysqli->error;
    }
}

// 5. Estructura de tabla calendarios
$response['tabla_estructura'] = [];
$cols = $mysqli->query("SHOW COLUMNS FROM calendarios");
if ($cols) {
    while ($col = $cols->fetch_assoc()) {
        $response['tabla_estructura'][] = $col;
    }
}

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
