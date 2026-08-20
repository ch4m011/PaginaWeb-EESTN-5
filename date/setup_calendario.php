<?php
/**
 * Setup y Verificación del Sistema de Calendario
 * Archivo: date/setup_calendario.php
 * 
 * Este archivo:
 * 1. Crea la tabla calendarios si no existe
 * 2. Migra datos del JSON a la BD
 * 3. Verifica que todo esté funcionando correctamente
 */

require_once __DIR__ . '/../php/config.php';

header('Content-Type: application/json; charset=utf-8');

$resultado = [
    'pasos' => [],
    'exito' => false,
    'errores' => []
];

if (!$mysqli) {
    echo json_encode([
        'exito' => false,
        'errores' => ['No connection to database']
    ]);
    exit;
}

// ========== PASO 1: Crear tabla ==========
$paso1 = [
    'nombre' => 'Crear tabla calendarios',
    'exito' => false,
    'mensaje' => ''
];

// Verificar si la tabla ya existe
$check_table = $mysqli->query("SHOW TABLES LIKE 'calendarios'");
if ($check_table && $check_table->num_rows > 0) {
    $paso1['exito'] = true;
    $paso1['mensaje'] = 'Tabla ya existe';
} else {
    $create_table = "CREATE TABLE IF NOT EXISTS calendarios (
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
    
    if ($mysqli->query($create_table)) {
        $paso1['exito'] = true;
        $paso1['mensaje'] = 'Tabla creada correctamente';
    } else {
        $paso1['exito'] = false;
        $paso1['mensaje'] = 'Error: ' . $mysqli->error;
    }
}

$resultado['pasos'][] = $paso1;

// ========== PASO 2: Verificar estructura de tabla ==========
$paso2 = [
    'nombre' => 'Verificar estructura de tabla',
    'exito' => false,
    'mensaje' => '',
    'columnas' => []
];

$columns = $mysqli->query("SHOW COLUMNS FROM calendarios");
if ($columns) {
    $expected_cols = ['id', 'fecha', 'titulo', 'tipo', 'descripcion', 'horaInicio', 'horaFin', 'fecha_creacion'];
    $found_cols = [];
    
    while ($col = $columns->fetch_assoc()) {
        $found_cols[] = $col['Field'];
        $paso2['columnas'][] = [
            'nombre' => $col['Field'],
            'tipo' => $col['Type']
        ];
    }
    
    $missing = array_diff($expected_cols, $found_cols);
    if (empty($missing)) {
        $paso2['exito'] = true;
        $paso2['mensaje'] = 'Estructura correcta';
    } else {
        $paso2['exito'] = false;
        $paso2['mensaje'] = 'Faltan columnas: ' . implode(', ', $missing);
    }
} else {
    $paso2['exito'] = false;
    $paso2['mensaje'] = 'Error consultando estructura: ' . $mysqli->error;
}

$resultado['pasos'][] = $paso2;

// ========== PASO 3: Migrar datos del JSON ==========
$paso3 = [
    'nombre' => 'Migrar datos desde JSON',
    'exito' => false,
    'mensaje' => '',
    'migrados' => 0,
    'json_encontrado' => false
];

$archivo_json = __DIR__ . '/calendario.json';
if (file_exists($archivo_json)) {
    $paso3['json_encontrado'] = true;
    $json_data = json_decode(file_get_contents($archivo_json), true);
    
    if (is_array($json_data) && count($json_data) > 0) {
        $query = "INSERT INTO calendarios (fecha, titulo, tipo, descripcion, horaInicio, horaFin)
                  VALUES (?, ?, ?, ?, ?, ?)
                  ON DUPLICATE KEY UPDATE id=id";
        
        $stmt = $mysqli->prepare($query);
        if ($stmt) {
            $migrados = 0;
            foreach ($json_data as $evento) {
                if (empty($evento['fecha']) || empty($evento['titulo'])) continue;
                
                $fecha = $evento['fecha'];
                $titulo = $evento['titulo'];
                $tipo = $evento['tipo'] ?? 'titulo-evento';
                $descripcion = $evento['descripcion'] ?? null;
                $horaInicio = $evento['horaInicio'] ?? '00:00:00';
                $horaFin = $evento['horaFin'] ?? '00:00:00';
                
                $stmt->bind_param('ssssss', $fecha, $titulo, $tipo, $descripcion, $horaInicio, $horaFin);
                
                if ($stmt->execute()) {
                    $migrados++;
                }
            }
            $stmt->close();
            
            $paso3['exito'] = true;
            $paso3['migrados'] = $migrados;
            $paso3['mensaje'] = "$migrados eventos importados de JSON";
        } else {
            $paso3['exito'] = false;
            $paso3['mensaje'] = 'Error preparando inserción: ' . $mysqli->error;
        }
    } else {
        $paso3['exito'] = true;
        $paso3['mensaje'] = 'JSON vacío o inválido';
    }
} else {
    $paso3['exito'] = true;
    $paso3['mensaje'] = 'JSON no encontrado (no es crítico)';
}

$resultado['pasos'][] = $paso3;

// ========== PASO 4: Contar eventos en BD ==========
$paso4 = [
    'nombre' => 'Verificar eventos en BD',
    'exito' => false,
    'mensaje' => '',
    'total_eventos' => 0
];

$count = $mysqli->query("SELECT COUNT(*) as total FROM calendarios");
if ($count) {
    $row = $count->fetch_assoc();
    $paso4['total_eventos'] = intval($row['total']);
    $paso4['exito'] = true;
    $paso4['mensaje'] = "Total de eventos en BD: " . $paso4['total_eventos'];
} else {
    $paso4['exito'] = false;
    $paso4['mensaje'] = 'Error contando eventos: ' . $mysqli->error;
}

$resultado['pasos'][] = $paso4;

// ========== PASO 5: Obtener muestra de eventos ==========
$paso5 = [
    'nombre' => 'Muestra de eventos',
    'exito' => false,
    'mensaje' => '',
    'eventos_muestra' => []
];

$muestra = $mysqli->query("SELECT id, fecha, titulo, tipo, horaInicio, horaFin FROM calendarios LIMIT 5");
if ($muestra) {
    $paso5['exito'] = true;
    while ($evento = $muestra->fetch_assoc()) {
        $paso5['eventos_muestra'][] = $evento;
    }
    $paso5['mensaje'] = 'Primeros 5 eventos recuperados';
} else {
    $paso5['exito'] = false;
    $paso5['mensaje'] = 'Error: ' . $mysqli->error;
}

$resultado['pasos'][] = $paso5;

// ========== RESUMEN FINAL ==========
$todos_exitosos = array_reduce($resultado['pasos'], function($carry, $item) {
    return $carry && $item['exito'];
}, true);

$resultado['exito'] = $todos_exitosos;
$resultado['resumen'] = $todos_exitosos 
    ? '✅ Sistema de calendario configurado correctamente' 
    : '⚠️ Hubo algunos problemas en la configuración';

$resultado['siguiente_paso'] = $todos_exitosos
    ? 'El calendario está listo para usar. Abre la página del calendario para crear nuevos eventos.'
    : 'Revisa los errores anteriores y contacta con el administrador si persisten.';

echo json_encode($resultado, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

?>
