<?php
/**
 * API REST para gestión de calendario
 * Archivo: php/api_calendario.php
 * 
 * Endpoints:
 * - GET: Obtener todos los eventos del calendario
 * - POST: Crear nuevo evento
 * - PUT/POST: Actualizar evento existente
 * - DELETE/POST: Eliminar evento
 */

// Configurar headers JSON
ob_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Capturar errores PHP como JSON
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    http_response_code(500);
    echo json_encode(['error' => "PHP Error: $errstr (línea $errline)"]);
    exit;
});

register_shutdown_function(function() {
    $err = error_get_last();
    if ($err && $err['type'] === E_ERROR) {
        http_response_code(500);
        echo json_encode(['error' => "PHP Fatal: {$err['message']}"]);
        exit;
    }
});

// ========== CARGAR CONFIGURACIÓN ==========
require_once __DIR__ . '/../php/config.php';

// Validar conexión a BD
if (!$mysqli || $mysqli->connect_error) {
    http_response_code(503);
    echo json_encode(['error' => 'Conexión a BD no disponible']);
    exit;
}

// Crear tabla si no existe (en la primera solicitud)
$check_table = "SHOW TABLES LIKE 'calendarios'";
if ($mysqli->query($check_table)->num_rows === 0) {
    $create_table = "CREATE TABLE IF NOT EXISTS calendarios (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        fecha DATE NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        tipo ENUM('titulo-evento', 'titulo-feriado', 'titulo-no-clases') NOT NULL DEFAULT 'titulo-evento',
        descripcion TEXT DEFAULT NULL,
        hora_inicio TIME NOT NULL,
        hora_fin TIME NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_fecha (fecha),
        INDEX idx_tipo (tipo)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    if (!$mysqli->query($create_table)) {
        http_response_code(500);
        echo json_encode(['error' => 'Error al crear tabla calendarios: ' . $mysqli->error]);
        exit;
    }
}

// Asegurar columnas para autor (autor_id, autor_email)
$cols = [];
$resCols = $mysqli->query("SHOW COLUMNS FROM calendarios");
if ($resCols) {
    while ($r = $resCols->fetch_assoc()) $cols[] = $r['Field'];
}
if (!in_array('autor_id', $cols)) {
    $mysqli->query("ALTER TABLE calendarios ADD COLUMN autor_id INT NULL AFTER id");
}
if (!in_array('autor_email', $cols)) {
    $mysqli->query("ALTER TABLE calendarios ADD COLUMN autor_email VARCHAR(255) NULL AFTER autor_id");
}

// Permitir preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Eliminar automáticamente los eventos cuya fecha/hora de fin ya pasó.
// Se ejecuta en cada request a esta API, antes de cualquier acción,
// para que el calendario siempre muestre únicamente eventos vigentes.
purgarEventosVencidos($mysqli);

// ========== ROUTING ==========
$action = $_GET['action'] ?? 'obtener';
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($action) {
        // 'session_debug' se eliminó: era un endpoint de depuración sin uso
        // desde ningún JS/HTML activo, que además exponía $_SESSION completa
        // (y hacía las mismas queries sin prepared statements) a quien
        // conociera la URL. Por el mismo motivo se eliminó php/debug_sesion.php.
        // Si hace falta depurar sesión de nuevo, agregar el guard de admin
        // que ya usa el resto de php/admin/*.php.
        case 'obtener':
            obtenerEventos($mysqli);
            break;
        case 'obtener_por_autor':
            obtenerEventosPorAutor($mysqli, intval($_GET['autor_id'] ?? 0));
            break;
        case 'obtener_por_id':
            obtenerEventoPorId($mysqli, intval($_GET['id'] ?? 0));
            break;
        case 'crear':
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(['error' => 'Método no permitido']);
                exit;
            }
            crearEvento($mysqli);
            break;
        case 'actualizar':
            if ($method !== 'POST' && $method !== 'PUT') {
                http_response_code(405);
                echo json_encode(['error' => 'Método no permitido']);
                exit;
            }
            actualizarEvento($mysqli);
            break;
        case 'eliminar':
            if ($method !== 'POST' && $method !== 'DELETE') {
                http_response_code(405);
                echo json_encode(['error' => 'Método no permitido']);
                exit;
            }
            eliminarEvento($mysqli);
            break;
        default:
            http_response_code(400);
            echo json_encode(['error' => 'Acción no reconocida']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

// ========== FUNCIONES CRUD ==========

/**
 * Elimina de la BD todos los eventos cuya fecha/hora de finalización
 * ya haya pasado respecto al momento actual del servidor.
 *
 * El fin real del evento es fecha + hora_fin, salvo que hora_fin sea
 * menor que hora_inicio (evento que cruza la medianoche, ej: empieza
 * 22:36 y termina 01:37), en cuyo caso el fin real cae al día siguiente.
 */
function purgarEventosVencidos($mysqli) {
    $query = "DELETE FROM calendarios WHERE
        (hora_fin >= hora_inicio AND TIMESTAMP(fecha, hora_fin) < NOW())
        OR
        (hora_fin < hora_inicio AND TIMESTAMP(DATE_ADD(fecha, INTERVAL 1 DAY), hora_fin) < NOW())";
    // No se debe interrumpir la API si esto falla; solo se registra el error.
    if (!$mysqli->query($query)) {
        error_log('[api_calendario] Error al purgar eventos vencidos: ' . $mysqli->error);
    }
}

/**
 * Obtener todos los eventos del calendario
 */
function obtenerEventos($mysqli) {
    // Auto-sync: normalizar autor_email y actualizar autor_id si hay coincidencia en usuarios
    try {
        $mysqli->query("UPDATE calendarios SET autor_email = LOWER(TRIM(autor_email)) WHERE autor_email IS NOT NULL AND autor_email <> '' AND autor_email != LOWER(TRIM(autor_email))");
        $mysqli->query("UPDATE calendarios n INNER JOIN usuarios u ON LOWER(TRIM(n.autor_email)) = LOWER(TRIM(u.email)) SET n.autor_id = u.id WHERE (n.autor_id IS NULL OR n.autor_id = 0) AND n.autor_email IS NOT NULL AND n.autor_email <> ''");
    } catch (Exception $e) {
        // no bloquear si falla
        error_log('[api_calendario] auto-sync error: ' . $e->getMessage());
    }
    $orden = $_GET['orden'] ?? 'DESC'; // Permitir ordenar por fecha (ASC o DESC)
    $orden = strtoupper($orden) === 'ASC' ? 'ASC' : 'DESC';
    // Soporte para "mine=1" -> devuelve solo eventos del usuario en sesión
    $mine = isset($_GET['mine']) && $_GET['mine'] == '1';
    $where = '';
    if ($mine) {
        // usar sesión para filtrar
        $user_id = $_SESSION['id'] ?? null;
        $user_email = $_SESSION['email'] ?? null;
        if ($user_id) {
            $where = "WHERE autor_id = " . intval($user_id);
        } elseif ($user_email) {
            $user_email_esc = $mysqli->real_escape_string(trim(strtolower($user_email)));
            $where = "WHERE LOWER(TRIM(autor_email)) = '" . $user_email_esc . "'";
        }
    }

    $query = "SELECT id, fecha, titulo, tipo, descripcion, hora_inicio, hora_fin, fecha_creacion, autor_id, autor_email
              FROM calendarios
              $where
              ORDER BY fecha $orden";
    
    $result = $mysqli->query($query);
    if (!$result) {
        throw new Exception("Error ejecutando consulta: " . $mysqli->error);
    }
    
    $eventos = [];
    while ($row = $result->fetch_assoc()) {
        $eventos[] = $row;
    }
    
    echo json_encode($eventos);
}

/**
 * Obtener eventos por autor (por autor_id)
 */
function obtenerEventosPorAutor($mysqli, $autor_id) {
    if ($autor_id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'autor_id inválido']);
        return;
    }

    $query = "SELECT c.id, c.fecha, c.titulo, c.tipo, c.descripcion, c.hora_inicio, c.hora_fin, c.fecha_creacion, c.autor_id, c.autor_email,
                     u.nombre AS autor_nombre, u.email AS autor_email
              FROM calendarios c
              LEFT JOIN usuarios u ON (c.autor_id = u.id OR (c.autor_email IS NOT NULL AND TRIM(LOWER(c.autor_email)) = TRIM(LOWER(u.email))))
              WHERE c.autor_id = ?
              ORDER BY c.fecha ASC";

    $stmt = $mysqli->prepare($query);
    if (!$stmt) {
        throw new Exception('Error preparando consulta: ' . $mysqli->error);
    }
    $stmt->bind_param('i', $autor_id);
    if (!$stmt->execute()) {
        throw new Exception('Error ejecutando consulta: ' . $stmt->error);
    }
    $res = $stmt->get_result();
    $rows = [];
    while ($r = $res->fetch_assoc()) $rows[] = $r;
    echo json_encode($rows);
}

/**
 * Obtener evento específico por ID
 */
function obtenerEventoPorId($mysqli, $id) {
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'ID inválido']);
        return;
    }
    
    $query = "SELECT id, fecha, titulo, tipo, descripcion, hora_inicio, hora_fin, fecha_creacion
              FROM calendarios
              WHERE id = ? LIMIT 1";
    
    $stmt = $mysqli->prepare($query);
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $mysqli->error);
    }
    
    $stmt->bind_param('i', $id);
    if (!$stmt->execute()) {
        throw new Exception("Error ejecutando consulta: " . $stmt->error);
    }
    
    $result = $stmt->get_result();
    $evento = $result->fetch_assoc();
    $stmt->close();
    
    if ($evento) {
        echo json_encode($evento);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Evento no encontrado']);
    }
}

/**
 * Crear nuevo evento
 */
function crearEvento($mysqli) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'JSON inválido']);
        return;
    }
    
    // Validar campos obligatorios
    $required = ['fecha', 'titulo', 'tipo', 'hora_inicio', 'hora_fin'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Campo obligatorio faltante: $field"]);
            return;
        }
    }
    
    $fecha = $data['fecha'];
    $titulo = $data['titulo'];
    $tipo = $data['tipo'];
    $descripcion = $data['descripcion'] ?? null;
    $hora_inicio = $data['hora_inicio'];
    $hora_fin = $data['hora_fin'];
    
    // Determinar si la tabla tiene columnas de autor
    $hasAuthorCols = false;
    $checkAuthor = $mysqli->query("SHOW COLUMNS FROM calendarios LIKE 'autor_id'");
    if ($checkAuthor && $checkAuthor->num_rows > 0) $hasAuthorCols = true;

    // Preparar query incluyendo autor si existe en sesión
    $session_user_id = $_SESSION['id'] ?? null;
    $session_user_email = $_SESSION['email'] ?? null;
    $session_user_email = $session_user_email ? strtolower(trim($session_user_email)) : null;

    if ($hasAuthorCols) {
        $query = "INSERT INTO calendarios (fecha, titulo, tipo, descripcion, hora_inicio, hora_fin, autor_id, autor_email)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $mysqli->prepare($query);
        if (!$stmt) {
            throw new Exception("Error preparando consulta: " . $mysqli->error);
        }
        $stmt->bind_param('ssssssis', $fecha, $titulo, $tipo, $descripcion, $hora_inicio, $hora_fin, $session_user_id, $session_user_email);
    } else {
        $query = "INSERT INTO calendarios (fecha, titulo, tipo, descripcion, hora_inicio, hora_fin)
                  VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $mysqli->prepare($query);
        if (!$stmt) {
            throw new Exception("Error preparando consulta: " . $mysqli->error);
        }
        $stmt->bind_param('ssssss', $fecha, $titulo, $tipo, $descripcion, $hora_inicio, $hora_fin);
    }
    
    if ($stmt->execute()) {
        $evento_id = $mysqli->insert_id;
        echo json_encode([
            'success' => true,
            'id' => $evento_id,
            'message' => 'Evento creado correctamente'
        ]);
    } else {
        throw new Exception("Error insertando evento: " . $stmt->error);
    }
    
    $stmt->close();
}

/**
 * Actualizar evento existente
 */
function actualizarEvento($mysqli) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'JSON inválido']);
        return;
    }
    
    $id = intval($data['id'] ?? 0);
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'ID inválido']);
        return;
    }
    
    $updates = [];
    $params = [];
    $types = '';
    
    // Campos actualizables
    if (isset($data['fecha'])) { 
        $updates[] = "fecha = ?"; 
        $params[] = $data['fecha']; 
        $types .= 's'; 
    }
    if (isset($data['titulo'])) { 
        $updates[] = "titulo = ?"; 
        $params[] = $data['titulo']; 
        $types .= 's'; 
    }
    if (isset($data['tipo'])) { 
        $updates[] = "tipo = ?"; 
        $params[] = $data['tipo']; 
        $types .= 's'; 
    }
    if (isset($data['descripcion'])) { 
        $updates[] = "descripcion = ?"; 
        $params[] = $data['descripcion']; 
        $types .= 's'; 
    }
    if (isset($data['hora_inicio'])) { 
        $updates[] = "hora_inicio = ?"; 
        $params[] = $data['hora_inicio']; 
        $types .= 's'; 
    }
    if (isset($data['hora_fin'])) { 
        $updates[] = "hora_fin = ?"; 
        $params[] = $data['hora_fin']; 
        $types .= 's'; 
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['error' => 'Nada que actualizar']);
        return;
    }
    
    $params[] = $id;
    $types .= 'i';
    
    $query = "UPDATE calendarios SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $mysqli->prepare($query);
    
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $mysqli->error);
    }
    
    $stmt->bind_param($types, ...$params);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Evento actualizado correctamente'
        ]);
    } else {
        throw new Exception("Error actualizando evento: " . $stmt->error);
    }
    
    $stmt->close();
}

/**
 * Eliminar evento
 */
function eliminarEvento($mysqli) {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        http_response_code(400);
        echo json_encode(['error' => 'JSON inválido']);
        return;
    }
    
    $id = intval($data['id'] ?? 0);
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'ID inválido']);
        return;
    }
    
    $query = "DELETE FROM calendarios WHERE id = ?";
    $stmt = $mysqli->prepare($query);
    
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $mysqli->error);
    }
    
    $stmt->bind_param('i', $id);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Evento eliminado correctamente'
            ]);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Evento no encontrado']);
        }
    } else {
        throw new Exception("Error eliminando evento: " . $stmt->error);
    }
    
    $stmt->close();
}

?>
