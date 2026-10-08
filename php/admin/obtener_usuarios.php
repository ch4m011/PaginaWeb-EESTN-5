<?php
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
session_start();
require_once __DIR__ . '/../config.php';

// Solo administradores
if (!isset($_SESSION['rol']) || $_SESSION['rol'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acceso no autorizado.']);
    exit;
}

try {
    if (!isset($conn) || $conn->connect_error) {
        throw new Exception('No se pudo conectar con la base de datos.');
    }

    $result = $conn->query("SELECT id, nombre, email, rol, fecha_registro FROM usuarios ORDER BY fecha_registro DESC");
    if (!$result) {
        throw new Exception('Error en la consulta: ' . $conn->error);
    }

    $usuarios = [];
    while ($row = $result->fetch_assoc()) {
        $usuarios[] = [
            'id' => $row['id'],
            'nombre' => $row['nombre'],
            'email' => $row['email'],
            'rol' => $row['rol'] ?? 'usuario',
            'fecha_registro' => $row['fecha_registro']
        ];
    }

    echo json_encode(['success' => true, 'usuarios' => $usuarios]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} finally {
    if (isset($conn) && $conn instanceof mysqli) {
        $conn->close();
    }
}