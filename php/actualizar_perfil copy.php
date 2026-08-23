<?php
header('Content-Type: application/json');
require_once 'config.php';

// Activar mensajes de error para debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$data = json_decode(file_get_contents('php://input'), true);
$correo = trim($data['correo'] ?? '');
$nombre = trim($data['nombre'] ?? '');

if (!$correo || !$nombre) {
    echo json_encode(['success' => false, 'message' => 'Faltan datos.']);
    exit;
}

// Validar formato de email
if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'El correo no es válido.']);
    exit;
}

// Sanitizar nombre (evitar tags/html)
$nombre = strip_tags($nombre);

try {
    // Aseguramos que PDO lance excepciones si algo falla
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Actualizar en la base de datos
    $stmt = $pdo->prepare('UPDATE usuarios SET nombre = ? WHERE correo = ?');
    $stmt->execute([$nombre, $correo]);

    if ($stmt->rowCount() > 0) {
        // También actualizar en el archivo JSON por compatibilidad temporal
        $jsonPath = '../data/usuarios.json'; // corregido: era '../date/...'

        if (file_exists($jsonPath)) {
            try {
                $contenido = file_get_contents($jsonPath);
                $usuarios = json_decode($contenido, true);

                if (is_array($usuarios)) {
                    foreach ($usuarios as &$usuario) {
                        if (isset($usuario['correo']) && $usuario['correo'] === $correo) {
                            $usuario['nombre'] = $nombre;
                            break;
                        }
                    }
                    unset($usuario);
                    file_put_contents($jsonPath, json_encode($usuarios, JSON_PRETTY_PRINT));
                } else {
                    // El JSON estaba corrupto o vacío: no rompemos la respuesta,
                    // pero avisamos que la sync falló
                    error_log("usuarios.json corrupto o no es un array al sincronizar $correo");
                }
            } catch (Exception $eJson) {
                error_log('Error sincronizando JSON: ' . $eJson->getMessage());
                // No interrumpe la respuesta principal: la DB ya se actualizó bien
            }
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
    error_log('Error en actualizar_nombre.php: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        // En producción, sacá el detalle real y dejá solo un mensaje genérico
        'message' => 'Error en el servidor: ' . $e->getMessage()
    ]);
}
?>