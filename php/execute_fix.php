<?php
// execute_fix.php
// Ejecuta directamente el UPDATE para sincronizar autor_email con autor_id
require_once __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');

if (!$conn || $conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'No hay conexión a BD']);
    exit;
}

// Paso 1: Ver qué noticias se corregirían (preview)
$previewSql = "SELECT n.id, n.titulo, n.autor_id, n.autor_email,
                      u.id AS usuario_id, u.nombre, u.apellido, u.correo
               FROM noticias n
               JOIN usuarios u ON LOWER(TRIM(n.autor_email)) = LOWER(TRIM(u.correo))
               WHERE n.autor_email IS NOT NULL AND n.autor_email <> ''
               LIMIT 100";

$preview = [];
$previewResult = $conn->query($previewSql);
if ($previewResult) {
    while ($r = $previewResult->fetch_assoc()) {
        $preview[] = $r;
    }
}

// Paso 2: Ejecutar UPDATE
$updateSql = "UPDATE noticias n
              JOIN usuarios u ON LOWER(TRIM(n.autor_email)) = LOWER(TRIM(u.correo))
              SET n.autor_id = u.id
              WHERE n.autor_email IS NOT NULL AND n.autor_email <> ''";

$result = $conn->query($updateSql);
$affected = $conn->affected_rows;

if ($result === TRUE) {
    // Paso 3: Verificar resultado
    $verifySql = "SELECT n.id, n.titulo, n.autor_id, n.autor_email FROM noticias WHERE autor_email IS NOT NULL LIMIT 100";
    $afterUpdate = [];
    $verifyResult = $conn->query($verifySql);
    if ($verifyResult) {
        while ($r = $verifyResult->fetch_assoc()) {
            $afterUpdate[] = $r;
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => "Actualizadas $affected filas",
        'affected_rows' => $affected,
        'preview_before' => $preview,
        'after_update' => $afterUpdate
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $conn->error,
        'preview' => $preview
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}

$conn->close();
exit;
