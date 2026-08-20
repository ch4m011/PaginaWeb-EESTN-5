<?php
header('Content-Type: application/json');
require_once 'config.php';

// Activar mensajes de error para debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$data = json_decode(file_get_contents('php://input'), true);
$correo = $data['correo'] ?? '';
$nombre = $data['nombre'] ?? '';

if (!$correo || !$nombre) {
    echo json_encode(['success' => false, 'message' => 'Faltan datos.']);
    exit;
}

try {
    // Actualizar en la base de datos
    $stmt = $pdo->prepare('UPDATE usuarios SET nombre = ? WHERE correo = ?');
    $stmt->execute([$nombre, $correo]);
    
    if ($stmt->rowCount() > 0) {
        // También actualizar en el archivo JSON por compatibilidad temporal
        $jsonPath = '../date/usuarios.json';
        if (file_exists($jsonPath)) {
            $usuarios = json_decode(file_get_contents($jsonPath), true);
            foreach ($usuarios as &$usuario) {
                if ($usuario['correo'] === $correo) {
                    $usuario['nombre'] = $nombre;
                    break;
                }
            }
            file_put_contents($jsonPath, json_encode($usuarios, JSON_PRETTY_PRINT));
        }
        
        echo json_encode([
            'success' => true, 
            'message' => 'Nombre actualizado correctamente en la base de datos.'
        ]);
    } else {
        // Verificar si el usuario existe pero no hubo cambios
        $stmt = $pdo->prepare('SELECT nombre FROM usuarios WHERE correo = ?');
        $stmt->execute([$correo]);
        $usuarioExiste = $stmt->fetch();
        
        if ($usuarioExiste) {
            if ($usuarioExiste['nombre'] === $nombre) {
                echo json_encode([
                    'success' => true, 
                    'message' => 'El nombre es el mismo que ya estaba guardado.'
                ]);
            } else {
                echo json_encode([
                    'success' => false, 
                    'message' => 'No se pudo actualizar el nombre.'
                ]);
            }
        } else {
            echo json_encode([
                'success' => false, 
                'message' => 'Usuario no encontrado en la base de datos.'
            ]);
        }
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false, 
        'message' => 'Error en el servidor: ' . $e->getMessage()
    ]);
}
?>
