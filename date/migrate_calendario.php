<?php
/**
 * Script para migrar datos del calendario.json a la BD
 * Archivo: date/migrate_calendario.php
 * 
 * Este script carga los eventos del JSON y los inserta en la tabla calendarios
 */

require_once __DIR__ . '/../php/config.php';

header('Content-Type: application/json; charset=utf-8');

if (!$mysqli) {
    echo json_encode(['error' => 'No connection to database']);
    exit;
}

// Verificar que la tabla existe
$check_table = "SHOW TABLES LIKE 'calendarios'";
if ($mysqli->query($check_table)->num_rows === 0) {
    echo json_encode([
        'error' => 'Tabla calendarios no existe. Ejecuta api_calendario.php primero.'
    ]);
    exit;
}

// Cargar datos del JSON
$archivo_json = __DIR__ . '/calendario.json';
if (!file_exists($archivo_json)) {
    echo json_encode([
        'success' => false,
        'message' => 'Archivo calendario.json no encontrado',
        'migrados' => 0
    ]);
    exit;
}

$json_data = json_decode(file_get_contents($archivo_json), true);
if (!is_array($json_data)) {
    echo json_encode([
        'error' => 'JSON inválido',
        'migrados' => 0
    ]);
    exit;
}

// Preparar statement para insertar
$query = "INSERT INTO calendarios (fecha, titulo, tipo, descripcion, horaInicio, horaFin)
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE id=id"; // Evitar duplicados

$stmt = $mysqli->prepare($query);
if (!$stmt) {
    echo json_encode([
        'error' => 'Error preparando inserción: ' . $mysqli->error
    ]);
    exit;
}

$migrados = 0;
$errores = [];

foreach ($json_data as $evento) {
    // Validar que tenga los campos necesarios
    if (empty($evento['fecha']) || empty($evento['titulo'])) {
        $errores[] = 'Evento sin fecha o título: ' . json_encode($evento);
        continue;
    }

    $fecha = $evento['fecha'];
    $titulo = $evento['titulo'];
    $tipo = $evento['tipo'] ?? 'titulo-evento';
    $descripcion = $evento['descripcion'] ?? null;
    $horaInicio = $evento['horaInicio'] ?? '00:00:00';
    $horaFin = $evento['horaFin'] ?? '00:00:00';

    $stmt->bind_param('ssssss', $fecha, $titulo, $tipo, $descripcion, $horaInicio, $horaFin);
    
    if ($stmt->execute()) {
        $migrados++;
    } else {
        $errores[] = 'Error insertando: ' . $stmt->error;
    }
}

$stmt->close();

echo json_encode([
    'success' => true,
    'message' => "Migración completada: $migrados eventos importados",
    'migrados' => $migrados,
    'errores' => $errores,
    'total_json' => count($json_data)
]);

?>
