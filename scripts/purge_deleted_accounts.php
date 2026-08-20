<?php
// Ejecutar desde CLI o tarea programada. Ajusta ruta a includes/db.php
require_once __DIR__ . '/../includes/db.php'; // $mysqli

$grace_days = 7; // días de gracia antes de borrar
$sql = "SELECT id, avatar FROM usuarios WHERE deleted_at IS NOT NULL AND deleted_at < (NOW() - INTERVAL ? DAY)";
$stmt = $mysqli->prepare($sql);
if (!$stmt) { error_log($mysqli->error); exit(1); }
$stmt->bind_param('i', $grace_days);
$stmt->execute();
$result = $stmt->get_result();

$ids = [];
while ($row = $result->fetch_assoc()) {
    $ids[] = (int)$row['id'];
    // borrar archivos asociados (avatar)
    if (!empty($row['avatar'])) {
        $path = __DIR__ . '/../uploads/perfiles/' . basename($row['avatar']);
        if (file_exists($path)) unlink($path);
    }
}
$stmt->close();

if ($ids) {
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $types = str_repeat('i', count($ids));
    $sqlDel = "DELETE FROM usuarios WHERE id IN ($placeholders)";
    $stmtDel = $mysqli->prepare($sqlDel);
    if (!$stmtDel) { error_log($mysqli->error); exit(1); }

    // bind dinámico
    $refs = [];
    foreach ($ids as $k => $id) $refs[$k] = &$ids[$k];
    array_unshift($refs, $types);
    call_user_func_array([$stmtDel, 'bind_param'], $refs);
    $stmtDel->execute();
    $stmtDel->close();
    echo "Eliminadas cuentas: " . implode(',', $ids) . PHP_EOL;
} else {
    echo "No hay cuentas para eliminar." . PHP_EOL;
}
?>