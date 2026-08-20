<?php
// debug_email_match.php
// Busca por qué email no coincide y muestra coincidencias parciales
require_once __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');

if (!$conn || $conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'No hay conexión a BD']);
    exit;
}

// Obtener todos los emails problemáticos de noticias
$sqlProblematic = "SELECT DISTINCT n.autor_email FROM noticias n 
                   WHERE n.autor_email IS NOT NULL AND n.autor_email <> '' 
                   AND n.autor_email NOT IN (
                     SELECT u.correo FROM usuarios u 
                     WHERE TRIM(LOWER(n.autor_email)) = TRIM(LOWER(u.correo)
                   ))";

$res = $conn->query($sqlProblematic);
$problematic = [];
if ($res) {
    while ($r = $res->fetch_assoc()) {
        $problematic[] = $r['autor_email'];
    }
}

// Para cada email problemático, buscar coincidencias parciales
$results = [];
foreach ($problematic as $email) {
    $normalized = strtolower(trim($email));
    
    // Búsqueda exacta (normalizada)
    $stmt1 = $conn->prepare("SELECT id, nombre, apellido, correo FROM usuarios WHERE TRIM(LOWER(correo)) = ? LIMIT 1");
    $exact = null;
    if ($stmt1) {
        $stmt1->bind_param('s', $normalized);
        $stmt1->execute();
        $exact = $stmt1->get_result()->fetch_assoc();
        $stmt1->close();
    }

    // Búsqueda LIKE (parcial)
    $likeEmail = '%' . str_replace('@', '%', $normalized) . '%';
    $stmt2 = $conn->prepare("SELECT id, nombre, apellido, correo FROM usuarios WHERE correo LIKE ? LIMIT 10");
    $similar = [];
    if ($stmt2) {
        $stmt2->bind_param('s', $likeEmail);
        $stmt2->execute();
        $resL = $stmt2->get_result();
        while ($u = $resL->fetch_assoc()) {
            $similar[] = $u;
        }
        $stmt2->close();
    }

    // Listar todos los usuarios para referencia
    $stmt3 = $conn->prepare("SELECT id, nombre, apellido, correo FROM usuarios LIMIT 100");
    $allUsers = [];
    if ($stmt3) {
        $stmt3->execute();
        $resA = $stmt3->get_result();
        while ($u = $resA->fetch_assoc()) {
            $allUsers[] = $u;
        }
        $stmt3->close();
    }

    $results[] = [
        'autor_email_raw' => $email,
        'autor_email_norm' => $normalized,
        'exact_match' => $exact,
        'similar_matches' => $similar,
        'all_usuarios' => $allUsers
    ];
}

echo json_encode([
    'problematic_count' => count($problematic),
    'problematic_emails' => $problematic,
    'details' => $results
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
exit;
