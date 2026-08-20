<?php
// Asegura que la tabla calendarios tenga columnas para autor_id y autor_email
require_once __DIR__ . '/../php/config.php';
header('Content-Type: application/json; charset=utf-8');

if (!$mysqli) {
    echo json_encode(['error'=>'No DB connection']);
    exit;
}

$cols = [];
$res = $mysqli->query("SHOW COLUMNS FROM calendarios");
if ($res) {
    while ($row = $res->fetch_assoc()) $cols[] = $row['Field'];
}

$queries = [];
if (!in_array('autor_id', $cols)) {
    $queries[] = "ALTER TABLE calendarios ADD COLUMN autor_id INT NULL AFTER id";
}
if (!in_array('autor_email', $cols)) {
    $queries[] = "ALTER TABLE calendarios ADD COLUMN autor_email VARCHAR(255) NULL AFTER autor_id";
}

$results = [];
foreach ($queries as $q) {
    if ($mysqli->query($q)) {
        $results[] = ['query'=>$q, 'result'=>'ok'];
    } else {
        $results[] = ['query'=>$q, 'result'=>'error', 'error'=>$mysqli->error];
    }
}

echo json_encode(['queries'=>$results, 'note'=>'Ejecuta solo si es necesario.']);
?>