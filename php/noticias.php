<?php

// Shim de compatibilidad para panel_escritor.js
// Devuelve noticias en JSON con datos del usuario

require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

$limit = isset($_GET['limite'])
    ? intval($_GET['limite'])
    : 20;

$sql = "
    SELECT
        n.id,
        n.titulo,
        COALESCE(
            n.resumen,
            LEFT(n.contenido, 200)
        ) AS resumen,
        n.contenido,
        n.imagen_blob,
        n.imagen_mime,
        n.fecha_creacion AS fecha,
        n.autor_id,
        u.nombre AS autor_nombre
    FROM noticias n
    LEFT JOIN usuarios u
        ON n.autor_id = u.id
    WHERE n.estado = 'publicada'
    ORDER BY n.fecha_creacion DESC
    LIMIT ?
";

$stmt = $mysqli->prepare($sql);

if (!$stmt) {

    echo json_encode([
        'error' => 'Error en prepare: ' . $mysqli->error
    ]);

    exit;
}

$stmt->bind_param(
    'i',
    $limit
);

if (!$stmt->execute()) {

    echo json_encode([
        'error' => 'Error en execute: ' . $stmt->error
    ]);

    exit;
}

$result = $stmt->get_result();

$noticias = [];

while ($row = $result->fetch_assoc()) {

    $row['fecha_formato'] = date(
        'd/m/Y',
        strtotime($row['fecha'])
    );

    // Convertir BLOB a Base64 para enviarlo por JSON
    if (!empty($row['imagen_blob'])) {

        $row['imagen_blob'] = base64_encode(
            $row['imagen_blob']
        );

    } else {

        $row['imagen_blob'] = null;
    }

    $noticias[] = $row;
}

$stmt->close();

echo json_encode(
    $noticias,
    JSON_UNESCAPED_UNICODE
);

exit;

?>
