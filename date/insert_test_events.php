<?php
/**
 * Script para insertar eventos de prueba en la BD
 * Archivo: date/insert_test_events.php
 * 
 * IMPORTANTE: Ejecuta este archivo UNA SOLA VEZ
 * Luego puedes eliminarlo o comentar el código
 */

require_once __DIR__ . '/../php/config.php';

header('Content-Type: application/json; charset=utf-8');

if (!$mysqli) {
    echo json_encode(['error' => 'No connection']);
    exit;
}

// Verificar que la tabla existe
$check = $mysqli->query("SHOW TABLES LIKE 'calendarios'");
if (!$check || $check->num_rows === 0) {
    // Crear tabla si no existe
    $create = "CREATE TABLE IF NOT EXISTS calendarios (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        fecha DATE NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        tipo ENUM('titulo-evento', 'titulo-feriado', 'titulo-no-clases') NOT NULL DEFAULT 'titulo-evento',
        descripcion TEXT DEFAULT NULL,
        horaInicio TIME NOT NULL,
        horaFin TIME NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_fecha (fecha),
        INDEX idx_tipo (tipo)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    if (!$mysqli->query($create)) {
        echo json_encode(['error' => 'Error creating table: ' . $mysqli->error]);
        exit;
    }
}

// Insertar eventos de prueba
$eventos_test = [
    [
        'fecha' => date('Y-m-d', strtotime('+1 day')),
        'titulo' => 'Prueba evento importante',
        'tipo' => 'titulo-evento',
        'descripcion' => 'Este es un evento de prueba para verificar que funciona',
        'horaInicio' => '10:00:00',
        'horaFin' => '12:00:00'
    ],
    [
        'fecha' => date('Y-m-d', strtotime('+5 days')),
        'titulo' => 'Día feriado de prueba',
        'tipo' => 'titulo-feriado',
        'descripcion' => 'Prueba de feriado',
        'horaInicio' => '00:00:00',
        'horaFin' => '23:59:59'
    ],
    [
        'fecha' => date('Y-m-d', strtotime('+10 days')),
        'titulo' => 'Día sin clases',
        'tipo' => 'titulo-no-clases',
        'descripcion' => 'Receso escolar de prueba',
        'horaInicio' => '00:00:00',
        'horaFin' => '23:59:59'
    ]
];

$insertados = 0;
$errores = [];

$query = "INSERT INTO calendarios (fecha, titulo, tipo, descripcion, horaInicio, horaFin)
          VALUES (?, ?, ?, ?, ?, ?)";

$stmt = $mysqli->prepare($query);
if (!$stmt) {
    echo json_encode(['error' => 'Error preparing statement: ' . $mysqli->error]);
    exit;
}

foreach ($eventos_test as $evento) {
    $stmt->bind_param(
        'ssssss',
        $evento['fecha'],
        $evento['titulo'],
        $evento['tipo'],
        $evento['descripcion'],
        $evento['horaInicio'],
        $evento['horaFin']
    );
    
    if ($stmt->execute()) {
        $insertados++;
    } else {
        $errores[] = 'Error en evento "' . $evento['titulo'] . '": ' . $stmt->error;
    }
}

$stmt->close();

echo json_encode([
    'success' => true,
    'mensaje' => 'Eventos de prueba insertados',
    'insertados' => $insertados,
    'errores' => $errores,
    'instrucciones' => 'Ahora abre: index.html o pagina/panel_escritor.html para ver los eventos'
]);

?>
