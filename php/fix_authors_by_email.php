<?php
// fix_authors_by_email.php
// GET: devuelve preview de noticias que serían actualizadas
// POST (apply=1): ejecuta UPDATE para setear noticias.autor_id según usuarios.id emparejando por autor_email

require_once __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');

if (!$conn || $conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'No hay conexión a la BD']);
    exit;
}

// Query que lista las noticias que deberían actualizarse
$sqlPreview = "SELECT n.id AS noticia_id, n.titulo, n.autor_id AS noticia_autor_id, n.autor_email,
                u.id AS usuario_id, u.nombre, u.apellido, u.correo AS usuario_correo
               FROM noticias n
               JOIN usuarios u ON TRIM(LOWER(n.autor_email)) = TRIM(LOWER(u.correo))
               WHERE n.autor_email IS NOT NULL AND n.autor_email <> ''
                 AND (n.autor_id IS NULL OR n.autor_id = 0 OR n.autor_id <> u.id)
               LIMIT 1000";

$res = $conn->query($sqlPreview);
if (!$res) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al preparar preview: ' . $conn->error]);
    exit;
}

$rows = [];
while ($r = $res->fetch_assoc()) {
    $rows[] = $r;
}

// Si es POST y apply=1 -> ejecutar
if ($_SERVER['REQUEST_METHOD'] === 'POST' && (isset($_POST['apply']) && $_POST['apply'] == '1')) {
    if (count($rows) === 0) {
        echo json_encode(['applied' => 0, 'message' => 'No hay filas a corregir']);
        exit;
    }

    // Ejecutar actualización
    $updateSql = "UPDATE noticias n
                  JOIN usuarios u ON TRIM(LOWER(n.autor_email)) = TRIM(LOWER(u.correo))
                  SET n.autor_id = u.id
                  WHERE n.autor_email IS NOT NULL AND n.autor_email <> ''
                    AND (n.autor_id IS NULL OR n.autor_id = 0 OR n.autor_id <> u.id)";

    if ($conn->query($updateSql) === TRUE) {
        $affected = $conn->affected_rows;
        // Recuperar filas actualizadas para devolver detalles
        $res2 = $conn->query("SELECT id AS noticia_id, titulo, autor_id, autor_email FROM noticias WHERE id IN (" . implode(',', array_map(function($r){return intval($r['noticia_id']);}, $rows)) . ")");
        $after = [];
        if ($res2) {
            while ($a = $res2->fetch_assoc()) $after[] = $a;
        }
        echo json_encode(['applied' => $affected, 'updated' => $after]);
        exit;
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Error al ejecutar UPDATE: ' . $conn->error]);
        exit;
    }
}

// Default: devolver preview
echo json_encode(['preview_count' => count($rows), 'preview' => $rows], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
exit;
