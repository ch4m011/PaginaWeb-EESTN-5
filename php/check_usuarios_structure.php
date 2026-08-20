<?php
// check_usuarios_structure.php
// Verifica la estructura exacta de la tabla usuarios
require_once __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');

if (!$conn || $conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'No hay conexión a BD']);
    exit;
}

// Obtener estructura de la tabla usuarios
$columnsResult = $conn->query("DESCRIBE usuarios");
$columns = [];
if ($columnsResult) {
    while ($col = $columnsResult->fetch_assoc()) {
        $columns[] = $col['Field'];
    }
}

// Obtener datos de ejemplo
$dataResult = $conn->query("SELECT * FROM usuarios LIMIT 5");
$sampleData = [];
if ($dataResult) {
    while ($row = $dataResult->fetch_assoc()) {
        $sampleData[] = $row;
    }
}

// Lista todos los usuarios con su correo
$allUsersResult = $conn->query("SELECT id, correo FROM usuarios LIMIT 50");
$allUsers = [];
if ($allUsersResult) {
    while ($row = $allUsersResult->fetch_assoc()) {
        $allUsers[] = $row;
    }
}

// Buscar específicamente al usuario con email lebelawsky@eest5.com
$searchResult = $conn->query("SELECT * FROM usuarios WHERE correo = 'lebelawsky@eest5.com' OR correo LIKE '%lebelawsky%'");
$foundUsers = [];
if ($searchResult) {
    while ($row = $searchResult->fetch_assoc()) {
        $foundUsers[] = $row;
    }
}

echo json_encode([
    'tabla_usuarios_columnas' => $columns,
    'total_usuarios' => $conn->query("SELECT COUNT(*) as cnt FROM usuarios")->fetch_assoc()['cnt'],
    'sample_data' => $sampleData,
    'todos_usuarios' => $allUsers,
    'buscar_lebelawsky' => $foundUsers
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

$conn->close();
exit;
