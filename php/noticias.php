<?php
// Shim de compatibilidad para panel_escritor.js
// Devuelve noticias en JSON con datos del usuario
require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

// ========== AUTO-SYNC: Sincronizar noticias.autor_email con usuarios.correo ==========
/**
 * Sincronizar automáticamente: si noticias.autor_email coincide con usuarios.correo,
 * actualizar noticias.autor_id sin intervención manual.
 */
function autoSyncAuthorsOnStartup($conn) {
    // Paso 1: Normalizar todos los emails en noticias (minúsculas, sin espacios)
    $normalize_sql = "UPDATE noticias 
                      SET autor_email = LOWER(TRIM(autor_email))
                      WHERE autor_email IS NOT NULL AND autor_email <> ''
                        AND autor_email != LOWER(TRIM(autor_email))";
    $conn->query($normalize_sql);
    
    // Paso 2: Sincronizar — actualizar autor_id basado en email coincidente
    $sync_sql = "UPDATE noticias n
                 INNER JOIN usuarios u ON n.autor_email = u.correo OR LOWER(TRIM(n.autor_email)) = LOWER(TRIM(u.correo))
                 SET n.autor_id = u.id
                 WHERE n.autor_email IS NOT NULL AND n.autor_email <> ''
                   AND (n.autor_id IS NULL OR n.autor_id = 0 OR n.autor_id <> u.id)
                 LIMIT 10000";
    
    if ($result = $conn->query($sync_sql)) {
        $affected = $conn->affected_rows;
        if ($affected > 0) {
            error_log("✅ [AUTO-SYNC noticias.php] Sincronizadas $affected noticias: autor_email → autor_id");
        }
    } else {
        error_log("⚠️ [AUTO-SYNC noticias.php] Error: " . $conn->error);
    }
}

// Ejecutar sincronización automática al inicio
autoSyncAuthorsOnStartup($conn);

$limit = isset($_GET['limite']) ? intval($_GET['limite']) : 20;
 $sql = "SELECT n.id, n.titulo, COALESCE(n.resumen, LEFT(n.contenido, 200)) AS resumen, n.contenido, n.imagen, 
         n.fecha_creacion as fecha, n.autor_id, n.autor_email,
         u.nombre, u.imagen_perfil
    FROM noticias n
    LEFT JOIN usuarios u ON (n.autor_id = u.id OR (n.autor_email IS NOT NULL AND TRIM(LOWER(n.autor_email)) = TRIM(LOWER(u.correo))))
     WHERE n.estado = 'publicada'
     ORDER BY n.fecha_creacion DESC
     LIMIT ?";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode(['error' => 'Error en prepare: ' . $conn->error]);
    exit;
}

$stmt->bind_param('i', $limit);
if (!$stmt->execute()) {
    echo json_encode(['error' => 'Error en execute: ' . $stmt->error]);
    exit;
}

$result = $stmt->get_result();
$noticias = [];

while ($row = $result->fetch_assoc()) {
    $row['fecha_formato'] = date('d/m/Y', strtotime($row['fecha']));
    // Generar nombre de autor desde tabla usuarios (retrocompatibilidad)
    if (!empty($row['nombre'])) {
        $row['autor_nombre'] = $row['nombre'];
        $row['autor'] = $row['autor_nombre']; // retrocompatibilidad
    } else {
        $row['autor_nombre'] = 'Anónimo';
        $row['autor'] = 'Anónimo';
    }
    $noticias[] = $row;
}

// Enriquecer por autor_email si hay filas con autor Anónimo
$emails = [];
foreach ($noticias as $r) {
    $need = empty(trim($r['autor_nombre'] ?? '')) || $r['autor_nombre'] === 'Anónimo';
    $mail = trim($r['autor_email'] ?? '');
    if ($need && $mail !== '') $emails[$mail] = $mail;
}
if (!empty($emails)) {
    $emails = array_values($emails);
    $placeholders = implode(',', array_fill(0, count($emails), '?'));
    $types = str_repeat('s', count($emails));
    $sqlU = "SELECT nombre, correo, imagen_perfil FROM usuarios WHERE TRIM(LOWER(correo)) IN ($placeholders)";
    $stmtU = $conn->prepare($sqlU);
    if ($stmtU) {
        $refs = [];
        // Normalizar a minúsculas/trim para comparación consistente
        foreach ($emails as $k => $v) $emails[$k] = strtolower(trim($emails[$k]));
        foreach ($emails as $k => $v) $refs[] = &$emails[$k];
        array_unshift($refs, $types);
        call_user_func_array([$stmtU, 'bind_param'], $refs);
        if ($stmtU->execute()) {
            $resU = $stmtU->get_result();
            $map = [];
            while ($u = $resU->fetch_assoc()) {
                $map[strtolower(trim($u['correo']))] = $u;
            }
            foreach ($noticias as &$n) {
                $mail = strtolower(trim($n['autor_email'] ?? ''));
                if ($mail && isset($map[$mail])) {
                    $u = $map[$mail];
                    $n['autor_nombre'] = $u['nombre'] ?? $n['autor_nombre'];
                    $n['imagen_perfil'] = $u['imagen_perfil'] ?? $n['imagen_perfil'];
                    $n['autor'] = $n['autor_nombre'];
                }
            }
            unset($n);
        }
        $stmtU->close();
    }
}

$stmt->close();
echo json_encode($noticias);
exit;
