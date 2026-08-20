<?php
// Archivo: date/init_calendario_table.php
// Este script crea la tabla calendarios si no existe

require_once __DIR__ . '/../php/config.php';

header('Content-Type: application/json; charset=utf-8');

if (!$mysqli) {
    echo json_encode(['error' => 'No connection to database']);
    exit;
}

// SQL para crear la tabla
$sql = "CREATE TABLE IF NOT EXISTS calendarios (
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

if ($mysqli->query($sql)) {
    echo json_encode([
        'success' => true,
        'message' => 'Tabla calendarios creada/verificada correctamente'
    ]);
} else {
    echo json_encode([
        'error' => $mysqli->error,
        'message' => 'Error al crear la tabla calendarios'
    ]);
}

$mysqli->close();
?>
