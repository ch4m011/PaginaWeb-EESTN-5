<?php
// Script para limpiar rutas duplicadas en imágenes de noticias
header('Content-Type: application/json; charset=utf-8');

require_once 'config.php';

try {
    // 1. Encontrar noticias con rutas duplicadas
    $query = "SELECT id, imagen FROM noticias WHERE imagen LIKE '%/web-escolar//web-escolar/%'";
    $result = $conexion->query($query);
    
    if (!$result) {
        throw new Exception("Error en SELECT: " . $conexion->error);
    }
    
    $noticias_encontradas = [];
    while ($row = $result->fetch_assoc()) {
        $noticias_encontradas[] = $row;
    }
    
    if (empty($noticias_encontradas)) {
        echo json_encode([
            'success' => true,
            'message' => 'No se encontraron rutas duplicadas',
            'noticias_actualizadas' => 0
        ]);
        exit;
    }
    
    // 2. Limpiar rutas duplicadas
    $query = "UPDATE noticias SET imagen = REPLACE(imagen, '/web-escolar//web-escolar/', '/web-escolar/') WHERE imagen LIKE '%/web-escolar//web-escolar/%'";
    
    if (!$conexion->query($query)) {
        throw new Exception("Error en UPDATE: " . $conexion->error);
    }
    
    $affected = $conexion->affected_rows;
    
    echo json_encode([
        'success' => true,
        'message' => 'Rutas duplicadas corregidas',
        'noticias_actualizadas' => $affected,
        'noticias_afectadas' => $noticias_encontradas
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}

$conexion->close();
?>
