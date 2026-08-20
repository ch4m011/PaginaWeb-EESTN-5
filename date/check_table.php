<?php
// Verificar si la tabla calendarios existe
require_once __DIR__ . '/../php/config.php';

if ($mysqli) {
    // Verificar si existe la tabla
    $result = $mysqli->query("SHOW TABLES LIKE 'calendarios'");
    if ($result && $result->num_rows > 0) {
        echo json_encode([
            'status' => 'ok',
            'message' => 'Tabla calendarios existe',
            'table_exists' => true
        ]);
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'Tabla calendarios NO existe',
            'table_exists' => false
        ]);
    }
    
    // Mostrar estructura de la tabla
    $structure = $mysqli->query("SHOW COLUMNS FROM calendarios");
    if ($structure) {
        $columns = [];
        while ($col = $structure->fetch_assoc()) {
            $columns[] = $col;
        }
        echo json_encode([
            'columns' => $columns
        ]);
    }
} else {
    echo json_encode(['error' => 'No connection']);
}
?>
