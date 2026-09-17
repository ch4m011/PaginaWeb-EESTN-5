<?php
session_start();
require_once('../../conexion.php');

// Verificar sesión admin
if (!isset($_SESSION['rol']) || $_SESSION['rol'] !== 'admin') {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Acceso no autorizado']);
    exit;
}

// Forzar uso de MySQL
try {
    // Debug - Mostrar conexión
    if ($conn->connect_error) {
        throw new Exception("Error de conexión: " . $conn->connect_error);
    }

    // Consulta para obtener usuarios
    $query = "SELECT id, nombre, correo, rol, fecha_registro FROM usuarios";
    $result = $conn->query($query);
    
    if (!$result) {
        throw new Exception($conn->error);
    }
    
    $usuarios = array();
    while ($row = $result->fetch_assoc()) {
        $usuarios[] = array(
            'id' => $row['id'],
            'nombre' => $row['nombre'],
            'correo' => $row['correo'],
            'rol' => $row['rol'] ?? 'usuario',
            'fecha_registro' => $row['fecha_registro']
        );
    }
    
    echo json_encode([
        'success' => true,
        'usuarios' => $usuarios
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener usuarios: ' . $e->getMessage()
    ]);
}

$conn->close();
?>