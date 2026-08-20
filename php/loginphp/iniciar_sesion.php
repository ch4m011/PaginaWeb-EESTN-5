<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

define('LOG_DIR', __DIR__ . '/logs');
define('LOG_FILE', LOG_DIR . '/debug.log');
if (!is_dir(LOG_DIR)) mkdir(LOG_DIR, 0777, true);
function debug_log($m){ file_put_contents(LOG_FILE,"[".date('Y-m-d H:i:s')."] $m\n", FILE_APPEND); }

session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/../config.php';

debug_log("=== intento login ===");
debug_log("POST: ".json_encode($_POST));

$username = isset($_POST['username']) ? trim($_POST['username']) : '';
$password = isset($_POST['password']) ? $_POST['password'] : '';

if ($username === '' || $password === '') {
    debug_log("Faltan campos");
    echo json_encode(['success'=>false,'message'=>'Complete usuario y contraseña']);
    exit;
}

try {
    if (!isset($conexion) || $conexion->connect_error) {
        debug_log("Sin conexión a BD");
        echo json_encode(['success'=>false,'message'=>'Error de conexión con la base de datos']);
        exit;
    }

    $sql = "SELECT * FROM usuarios WHERE (correo = ? OR nombre = ?) AND deleted_at IS NULL LIMIT 1";
    $stmt = $conexion->prepare($sql);
    if (!$stmt) {
        debug_log("Error prepare: ".$conexion->error);
        throw new Exception('Error en la consulta');
    }
    $stmt->bind_param('ss',$username,$username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($user = $result->fetch_assoc()) {
        debug_log("Usuario encontrado id={$user['id']} correo={$user['correo']} rol={$user['rol']}");
        
        if (password_verify($password, $user['contrasena'])) {
            // Login exitoso - asignar sesión
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['id'] = $user['id'];  // por compatibilidad
            $_SESSION['nombre'] = $user['nombre'];
            $_SESSION['correo'] = $user['correo'];
            $_SESSION['rol'] = $user['rol'];  // IMPORTANTE: guardar rol
            
            debug_log("Login exitoso para usuario_id={$user['id']} rol={$user['rol']}");
            
            echo json_encode([
                'success' => true,
                'message' => 'Inicio de sesión exitoso',
                'user' => [
                    'id' => $user['id'],
                    'nombre' => $user['nombre'],
                    'correo' => $user['correo'],
                    'rol' => $user['rol'] ?? 'usuario',
                    'foto' => $user['foto'] ?? null
                ],
                'redirect' => '../index.html'
            ]);
            exit;
        } else {
            debug_log("Contraseña NO coincide para usuario_id={$user['id']}");
            echo json_encode(['success'=>false,'message'=>'Correo o contraseña incorrectos']);
            exit;
        }
    } else {
        debug_log("Usuario no encontrado para: $username");
        echo json_encode(['success'=>false,'message'=>'Correo o contraseña incorrectos']);
        exit;
    }

} catch (Exception $e) {
    debug_log("Excepción: ".$e->getMessage());
    echo json_encode(['success'=>false,'message'=>'Error del servidor: '.$e->getMessage()]);
    exit;
}
?>
