<?php
// filepath: c:\xampp\htdocs\web-escolar\php\api_noticias.php
// 
// API REST para gestión de noticias
// Conecta a tabla: noticias
// Requiere: config.php (conexión BD)
//

// Proteger output: siempre JSON
ob_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Capturar errores PHP como JSON (no como HTML)
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
require_once __DIR__ . '/config.php';

// Validar conexión a BD
if (!$mysqli || $mysqli->connect_error) {
    http_response_code(503);
    echo json_encode(['error' => 'Conexión a BD no disponible. Por favor, intenta más tarde.']);
    exit;
}

// Asegurar sesión activa (para obtener user_id y correo del autor)
if (session_status() !== PHP_SESSION_ACTIVE) session_start();

// ========== AUTO-SYNC: Sincronizar noticias.autor_email con usuarios.correo ==========
/**
 * Sincronizar automáticamente: si noticias.autor_email coincide con usuarios.correo,
 * actualizar noticias.autor_id sin intervención manual.
 */
function autoSyncAuthorsOnStartup($mysqli) {
    // Paso 1: Normalizar todos los emails en noticias (minúsculas, sin espacios)
    $normalize_sql = "UPDATE noticias 
                      SET autor_email = LOWER(TRIM(autor_email))
                      WHERE autor_email IS NOT NULL AND autor_email <> ''
                        AND autor_email != LOWER(TRIM(autor_email))";
    $mysqli->query($normalize_sql);
    
    // Paso 2: Sincronizar — actualizar autor_id basado en email coincidente
    // Usa comparación directa (ya normalizados) O normaliza en la comparación
    $sync_sql = "UPDATE noticias n
                 INNER JOIN usuarios u ON n.autor_email = u.correo OR LOWER(TRIM(n.autor_email)) = LOWER(TRIM(u.correo))
                 SET n.autor_id = u.id
                 WHERE n.autor_email IS NOT NULL AND n.autor_email <> ''
                   AND (n.autor_id IS NULL OR n.autor_id = 0 OR n.autor_id <> u.id)
                 LIMIT 10000";
    
    if ($result = $mysqli->query($sync_sql)) {
        $affected = $mysqli->affected_rows;
        if ($affected > 0) {
            error_log("✅ [AUTO-SYNC] Sincronizadas $affected noticias: autor_email → autor_id");
        }
    } else {
        error_log("⚠️ [AUTO-SYNC] Error en sincronización: " . $mysqli->error);
    }
}

// Ejecutar sincronización automática al inicio
autoSyncAuthorsOnStartup($mysqli);

// ========== ROUTING ==========
$action = $_GET['action'] ?? 'obtener';
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($action) {
        case 'obtener':
            obtenerNoticias($mysqli);
            break;
        case 'obtener_por_id':
            obtenerNoticiaPorId($mysqli, intval($_GET['id'] ?? 0));
            break;
        case 'obtener_por_autor':
            obtenerNoticiasPorAutor($mysqli, intval($_GET['autor_id'] ?? 0));
            break;
        case 'crear':
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(['error' => 'Método no permitido']);
                exit;
            }
            crearNoticia($mysqli);
            break;
        case 'actualizar':
            if ($method !== 'POST' && $method !== 'PUT') {
                http_response_code(405);
                echo json_encode(['error' => 'Método no permitido']);
                exit;
            }
            actualizarNoticia($mysqli);
            break;
        case 'eliminar':
            if ($method !== 'POST' && $method !== 'DELETE') {
                http_response_code(405);
                echo json_encode(['error' => 'Método no permitido']);
                exit;
            }
            eliminarNoticia($mysqli);
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

// ========== FUNCIONES (igual que antes, pero documentadas) ==========

/**
 * Obtener todas las noticias publicadas
 * @param mysqli $mysqli Conexión a BD
 */
function obtenerNoticias($mysqli) {
    $estado = $_GET['estado'] ?? 'publicada';
    $limite = intval($_GET['limite'] ?? 50);
    $offset = intval($_GET['offset'] ?? 0);

    // Intentar query con JOIN a usuarios (si existen las columnas)
        // Intentamos traer datos del usuario por autor_id y, si existe, por autor_email (case-insensitive)
        $query = "SELECT n.id, n.titulo, n.contenido, n.resumen, n.imagen, n.tipo, n.destacado, 
                n.prioridad, n.autor_id, n.autor_email, n.fecha_creacion, n.estado, n.visitas,
                COALESCE(u.nombre, 'Anónimo') as autor_nombre,
                u.imagen_perfil
            FROM noticias n
            LEFT JOIN usuarios u ON (n.autor_id = u.id OR (n.autor_email IS NOT NULL AND TRIM(LOWER(n.autor_email)) = TRIM(LOWER(u.correo))))
            WHERE n.estado = ?
            ORDER BY n.prioridad DESC, n.fecha_creacion DESC
            LIMIT ? OFFSET ?";    $stmt = $mysqli->prepare($query);
    
    // Si el JOIN falla (tabla usuarios no existe), fallback a query simple
    if (!$stmt) {
        error_log("⚠️ JOIN con usuarios falló, usando query simple: " . $mysqli->error);
        $query = "SELECT id, titulo, contenido, resumen, imagen, tipo, destacado, 
                         prioridad, autor_id, fecha_creacion, estado, visitas,
                         'Anónimo' as autor_nombre, NULL as imagen_perfil
                  FROM noticias 
                  WHERE estado = ?
                  ORDER BY prioridad DESC, fecha_creacion DESC
                  LIMIT ? OFFSET ?";
        $stmt = $mysqli->prepare($query);
        if (!$stmt) {
            throw new Exception("Error preparando consulta: " . $mysqli->error);
        }
    }

    $stmt->bind_param('sii', $estado, $limite, $offset);
    if (!$stmt->execute()) {
        throw new Exception("Error ejecutando consulta: " . $stmt->error);
    }

    $result = $stmt->get_result();
    $noticias = [];
    while ($row = $result->fetch_assoc()) {
        $noticias[] = $row;
    }

    // Si usamos el fallback simple (sin JOIN) intentamos enriquecer los datos
    // consultando la tabla usuarios por los autor_id retornados (si existe)
    if (stripos($query, "'Anónimo' as autor_nombre") !== false && !empty($noticias)) {
        $autorIds = [];
        foreach ($noticias as $r) {
            $aid = intval($r['autor_id'] ?? 0);
            if ($aid > 0) $autorIds[$aid] = $aid;
        }
        $autorIds = array_values($autorIds);
        if (count($autorIds) > 0) {
            // Preparar consulta dinámica
            $placeholders = implode(',', array_fill(0, count($autorIds), '?'));
            $types = str_repeat('i', count($autorIds));
            $sqlUsers = "SELECT id, nombre, imagen_perfil FROM usuarios WHERE id IN ($placeholders)";
            $stmtUsers = $mysqli->prepare($sqlUsers);
            if ($stmtUsers) {
                // bind_param dinámico requiere referencias
                $refs = [];
                foreach ($autorIds as $k => $v) $refs[] = &$autorIds[$k];
                array_unshift($refs, $types);
                call_user_func_array([$stmtUsers, 'bind_param'], $refs);
                if ($stmtUsers->execute()) {
                    $resU = $stmtUsers->get_result();
                    $map = [];
                    while ($u = $resU->fetch_assoc()) {
                        $map[intval($u['id'])] = $u;
                    }
                    // Asignar datos encontrados a cada noticia
                    foreach ($noticias as &$n) {
                        $aid = intval($n['autor_id'] ?? 0);
                        if ($aid > 0 && isset($map[$aid])) {
                            $u = $map[$aid];
                            $n['autor_nombre'] = $u['nombre'] ?? 'Anónimo';
                            $n['imagen_perfil'] = $u['imagen_perfil'];
                        }
                    }
                    unset($n);
                }
                $stmtUsers->close();
            }
        }
    }

    // Si todavía hay noticias con autor anónimo pero tienen autor_email, enriquecer por correo
    $emails = [];
    foreach ($noticias as $r) {
        $mail = trim($r['autor_email'] ?? '');
        $needName = empty(trim($r['autor_nombre'] ?? '')) || ($r['autor_nombre'] === 'Anónimo');
        $noFoto = empty($r['imagen_perfil']);
        if ($mail !== '' && ($needName || $noFoto)) $emails[$mail] = $mail;
    }
    if (!empty($emails)) {
        $emails = array_values($emails);
        $placeholders = implode(',', array_fill(0, count($emails), '?'));
        $types = str_repeat('s', count($emails));
        $sqlUsersByEmail = "SELECT id, nombre, correo, imagen_perfil FROM usuarios WHERE TRIM(LOWER(correo)) IN ($placeholders)";
        $stmtE = $mysqli->prepare($sqlUsersByEmail);
        if ($stmtE) {
            $refs = [];
            // Normalizar a minúsculas/trim para comparación consistente
            foreach ($emails as $k => $v) $emails[$k] = strtolower(trim($emails[$k]));
            foreach ($emails as $k => $v) $refs[] = &$emails[$k];
            array_unshift($refs, $types);
            call_user_func_array([$stmtE, 'bind_param'], $refs);
            if ($stmtE->execute()) {
                $resE = $stmtE->get_result();
                $mapE = [];
                while ($u = $resE->fetch_assoc()) {
                    $mapE[strtolower(trim($u['correo']))] = $u;
                }
                foreach ($noticias as &$n) {
                    $mail = strtolower(trim($n['autor_email'] ?? ''));
                    if ($mail && isset($mapE[$mail])) {
                        $u = $mapE[$mail];
                        $n['autor_nombre'] = $u['nombre'] ?? $n['autor_nombre'];
                        $n['imagen_perfil'] = $u['imagen_perfil'] ?? $n['imagen_perfil'];
                    }
                }
                unset($n);
            }
            $stmtE->close();
        }
    }

    $stmt->close();
    echo json_encode($noticias);
}

/**
 * Obtener noticia por ID
 * @param mysqli $mysqli Conexión a BD
 * @param int $id ID de noticia
 */
function obtenerNoticiaPorId($mysqli, $id) {
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'ID inválido']);
        return;
    }

    // Intentar obtener noticia e incluir datos del autor por autor_id o autor_email
    $query = "SELECT n.*, COALESCE(u.nombre, 'Anónimo') as autor_nombre, u.imagen_perfil
              FROM noticias n
              LEFT JOIN usuarios u ON (n.autor_id = u.id OR (n.autor_email IS NOT NULL AND TRIM(LOWER(n.autor_email)) = TRIM(LOWER(u.correo))))
              WHERE n.id = ? AND n.estado = 'publicada' LIMIT 1";
    $stmt = $mysqli->prepare($query);
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $mysqli->error);
    }

    $stmt->bind_param('i', $id);
    $stmt->execute();
    $result = $stmt->get_result();
    $noticia = $result->fetch_assoc();
    $stmt->close();

    if ($noticia) {
        // Incrementar visitas
        $updateQuery = "UPDATE noticias SET visitas = visitas + 1 WHERE id = ?";
        $updateStmt = $mysqli->prepare($updateQuery);
        $updateStmt->bind_param('i', $id);
        $updateStmt->execute();
        $updateStmt->close();

        // Enriquecer por autor_email si es necesario
        $mail = trim($noticia['autor_email'] ?? '');
        $needName = empty(trim($noticia['autor_nombre'] ?? '')) || ($noticia['autor_nombre'] === 'Anónimo');
        $noFoto = empty($noticia['imagen_perfil']);
        if ($mail !== '' && ($needName || $noFoto)) {
            $stmtU = $mysqli->prepare("SELECT nombre, correo, imagen_perfil FROM usuarios WHERE correo = ? LIMIT 1");
            if ($stmtU) {
                $stmtU->bind_param('s', $mail);
                if ($stmtU->execute()) {
                    $resU = $stmtU->get_result();
                    $u = $resU->fetch_assoc();
                    if ($u) {
                        $noticia['autor_nombre'] = $u['nombre'] ?? $noticia['autor_nombre'];
                        $noticia['imagen_perfil'] = $u['imagen_perfil'] ?? $noticia['imagen_perfil'];
                    }
                }
                $stmtU->close();
            }
        }

        echo json_encode($noticia);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Noticia no encontrada']);
    }
}

/**
 * Obtener noticias por autor (incluye datos del usuario)
 * @param mysqli $mysqli Conexión a BD
 * @param int $autor_id ID del autor
 */
function obtenerNoticiasPorAutor($mysqli, $autor_id) {
    if ($autor_id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'ID de autor inválido']);
        return;
    }

    // Intentar query con JOIN a usuarios
        // Obtener noticias por autor_id. También intentar obtener datos del usuario si autor_email coincide.
        $query = "SELECT n.*, 
                COALESCE(u.nombre, 'Anónimo') as autor_nombre,
                u.imagen_perfil
            FROM noticias n
            LEFT JOIN usuarios u ON (n.autor_id = u.id OR (n.autor_email IS NOT NULL AND TRIM(LOWER(n.autor_email)) = TRIM(LOWER(u.correo))))
            WHERE n.autor_id = ?
            ORDER BY n.fecha_creacion DESC";

    $stmt = $mysqli->prepare($query);
    
    // Si el JOIN falla, fallback
    if (!$stmt) {
        error_log("⚠️ JOIN en obtenerNoticiasPorAutor falló, usando query simple: " . $mysqli->error);
        $query = "SELECT *, 'Anónimo' as autor_nombre, NULL as imagen_perfil
                  FROM noticias 
                  WHERE autor_id = ?
                  ORDER BY fecha_creacion DESC";
        $stmt = $mysqli->prepare($query);
        if (!$stmt) {
            throw new Exception("Error preparando consulta: " . $mysqli->error);
        }
    }

    $stmt->bind_param('i', $autor_id);
    if (!$stmt->execute()) {
        throw new Exception("Error ejecutando consulta: " . $stmt->error);
    }

    $result = $stmt->get_result();
    $noticias = [];
    while ($row = $result->fetch_assoc()) {
        $noticias[] = $row;
    }

    $stmt->close();
    // Enriquecer por autor_email si es necesario (caso donde autor_id join no devolvió datos)
    $emails = [];
    foreach ($noticias as $r) {
        $mail = trim($r['autor_email'] ?? '');
        $needName = empty(trim($r['autor_nombre'] ?? '')) || ($r['autor_nombre'] === 'Anónimo');
        $noFoto = empty($r['imagen_perfil']);
        if ($mail !== '' && ($needName || $noFoto)) $emails[$mail] = $mail;
    }
    if (!empty($emails)) {
        $emails = array_values($emails);
        $placeholders = implode(',', array_fill(0, count($emails), '?'));
        $types = str_repeat('s', count($emails));
        $sqlUsersByEmail = "SELECT id, nombre, correo, imagen_perfil FROM usuarios WHERE TRIM(LOWER(correo)) IN ($placeholders)";
        $stmtE = $mysqli->prepare($sqlUsersByEmail);
        if ($stmtE) {
            $refs = [];
            // Normalizar a minúsculas/trim para comparación consistente
            foreach ($emails as $k => $v) $emails[$k] = strtolower(trim($emails[$k]));
            foreach ($emails as $k => $v) $refs[] = &$emails[$k];
            array_unshift($refs, $types);
            call_user_func_array([$stmtE, 'bind_param'], $refs);
            if ($stmtE->execute()) {
                $resE = $stmtE->get_result();
                $mapE = [];
                while ($u = $resE->fetch_assoc()) {
                    $mapE[strtolower(trim($u['correo']))] = $u;
                }
                foreach ($noticias as &$n) {
                    $mail = strtolower(trim($n['autor_email'] ?? ''));
                    if ($mail && isset($mapE[$mail])) {
                        $u = $mapE[$mail];
                        $n['autor_nombre'] = $u['nombre'] ?? $n['autor_nombre'];
                        $n['imagen_perfil'] = $u['imagen_perfil'] ?? $n['imagen_perfil'];
                    }
                }
                unset($n);
            }
            $stmtE->close();
        }
    }

    echo json_encode($noticias);
}

/**
 * Crear nueva noticia
 * @param mysqli $mysqli Conexión a BD
 */
function crearNoticia($mysqli) {
    $data = json_decode(file_get_contents('php://input'), true);

    // Validar campos obligatorios
    if (empty($data['titulo']) || empty($data['contenido'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Título y contenido son obligatorios']);
        return;
    }

    $titulo = $data['titulo'];
    $contenido = $data['contenido'];
    $resumen = $data['resumen'] ?? substr($data['contenido'], 0, 150);
    $imagen = !empty($data['imagen']) ? $data['imagen'] : null;
    $tipo = $data['tipo'] ?? 'secundaria';
    $destacado = $data['destacado'] ? 1 : 0;
    $prioridad = intval($data['prioridad'] ?? 0);
    // Preferir autor desde la sesión del servidor
    $autor_id = 0;
    if (!empty($_SESSION['user_id'])) {
        $autor_id = intval($_SESSION['user_id']);
    } else {
        $autor_id = intval($data['autor_id'] ?? 0);
    }
    
        // Logging para debug
        error_log("📝 Crear noticia - Datos recibidos: " . json_encode($data));
        error_log("📝 Título: '" . $titulo . "' (length: " . strlen($titulo) . ")");
        error_log("📝 Contenido: '" . substr($contenido, 0, 50) . "...' (length: " . strlen($contenido) . ")");
        error_log("📝 Imagen: '" . $imagen . "'");
        error_log("📝 Autor resolved (session): " . $autor_id);

    $query = "INSERT INTO noticias (titulo, contenido, resumen, imagen, tipo, destacado, prioridad, autor_id, estado) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'publicada')";

    $stmt = $mysqli->prepare($query);
    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $mysqli->error);
    }

    // Normalizar lectura de email/nombre desde la sesión (hay varios nombres usados en el código)
    $session_email = $_SESSION['correo'] ?? $_SESSION['user_email'] ?? $_SESSION['email'] ?? null;
    if ($session_email) $session_email = strtolower(trim($session_email));
    $session_nombre = $_SESSION['nombre'] ?? $_SESSION['user_nombre'] ?? $_SESSION['user_name'] ?? null;

    // Si la tabla noticias tiene la columna autor_email, guardarla también (si está en sesión)
    $autor_email = $session_email ?? ($data['autor_email'] ?? null);
    if ($autor_email) $autor_email = strtolower(trim($autor_email));
    $hasAutorEmail = false;
    $check = $mysqli->query("SHOW COLUMNS FROM noticias LIKE 'autor_email'");
    if ($check && $check->num_rows > 0) {
        $hasAutorEmail = true;
        $stmt->close();
        $query = "INSERT INTO noticias (titulo, contenido, resumen, imagen, tipo, destacado, prioridad, autor_id, autor_email, estado) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'publicada')";
        $stmt = $mysqli->prepare($query);
        if (!$stmt) throw new Exception("Error preparando consulta con autor_email: " . $mysqli->error);
        $stmt->bind_param('ssssssiis', $titulo, $contenido, $resumen, $imagen, $tipo, $destacado, $prioridad, $autor_id, $autor_email);
    } else {
        $stmt->bind_param('sssssiii', $titulo, $contenido, $resumen, $imagen, $tipo, $destacado, $prioridad, $autor_id);
    }
    
    if ($stmt->execute()) {
        $noticia_id = $mysqli->insert_id;
        echo json_encode([
            'success' => true,
            'id' => $noticia_id,
            'message' => 'Noticia creada correctamente'
        ]);
    } else {
        throw new Exception("Error insertando noticia: " . $stmt->error);
    }

    $stmt->close();
}

/**
 * Actualizar noticia existente
 * @param mysqli $mysqli Conexión a BD
 */
function actualizarNoticia($mysqli) {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id'] ?? 0);

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'ID inválido']);
        return;
    }

    $updates = [];
    $params = [];
    $types = '';

    if (isset($data['titulo'])) { $updates[] = "titulo = ?"; $params[] = $data['titulo']; $types .= 's'; }
    if (isset($data['contenido'])) { $updates[] = "contenido = ?"; $params[] = $data['contenido']; $types .= 's'; }
    if (isset($data['resumen'])) { $updates[] = "resumen = ?"; $params[] = $data['resumen']; $types .= 's'; }
    if (isset($data['imagen']) && !empty($data['imagen'])) { $updates[] = "imagen = ?"; $params[] = $data['imagen']; $types .= 's'; }
    if (isset($data['tipo'])) { $updates[] = "tipo = ?"; $params[] = $data['tipo']; $types .= 's'; }
    if (isset($data['destacado'])) { $updates[] = "destacado = ?"; $params[] = ($data['destacado'] ? 1 : 0); $types .= 'i'; }
    if (isset($data['prioridad'])) { $updates[] = "prioridad = ?"; $params[] = intval($data['prioridad']); $types .= 'i'; }

    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['error' => 'Nada que actualizar']);
        return;
    }

    $params[] = $id;
    $types .= 'i';

    $query = "UPDATE noticias SET " . implode(', ', $updates) . " WHERE id = ?";
    $stmt = $mysqli->prepare($query);

    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $mysqli->error);
    }

    $stmt->bind_param($types, ...$params);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Noticia actualizada']);
    } else {
        throw new Exception("Error actualizando noticia: " . $stmt->error);
    }

    $stmt->close();
}

/**
 * Eliminar noticia (soft delete)
 * @param mysqli $mysqli Conexión a BD
 */
function eliminarNoticia($mysqli) {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id'] ?? 0);

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['error' => 'ID inválido']);
        return;
    }

    // Soft delete: marcar como archivada (no eliminación física)
    $query = "UPDATE noticias SET estado = 'archivada' WHERE id = ?";
    $stmt = $mysqli->prepare($query);

    if (!$stmt) {
        throw new Exception("Error preparando consulta: " . $mysqli->error);
    }

    $stmt->bind_param('i', $id);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Noticia eliminada']);
    } else {
        throw new Exception("Error eliminando noticia: " . $stmt->error);
    }

    $stmt->close();
}

?>