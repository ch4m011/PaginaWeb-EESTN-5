<?php

// filepath: c:\xampp\htdocs\web-escolar\php\api_noticias.php
// API REST para gestión de noticias
// Conecta a tabla: noticias
// Requiere: config.php

ob_start();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// ============================================================
// CAPTURAR ERRORES PHP COMO JSON
// ============================================================

set_error_handler(function($errno, $errstr, $errfile, $errline) {

    http_response_code(500);

    echo json_encode([
        'error' => "PHP Error: $errstr (línea $errline)"
    ]);

    exit;
});

register_shutdown_function(function() {

    $err = error_get_last();

    if ($err && $err['type'] === E_ERROR) {

        http_response_code(500);

        echo json_encode([
            'error' => "PHP Fatal: {$err['message']}"
        ]);

        exit;
    }
});

// ============================================================
// CARGAR CONFIGURACIÓN
// ============================================================

require_once __DIR__ . '/config.php';

// Validar conexión

if (!$mysqli || $mysqli->connect_error) {

    http_response_code(503);

    echo json_encode([
        'error' => 'Conexión a BD no disponible. Por favor, intenta más tarde.'
    ]);

    exit;
}

// ============================================================
// ASEGURAR SESIÓN
// ============================================================

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

// ============================================================
// ROUTING
// ============================================================

$action = $_GET['action'] ?? 'obtener';
$method = $_SERVER['REQUEST_METHOD'];

try {

    switch ($action) {

        case 'obtener':
            obtenerNoticias($mysqli);
            break;

        case 'obtener_por_id':
            obtenerNoticiaPorId(
                $mysqli,
                intval($_GET['id'] ?? 0)
            );
            break;

        case 'obtener_por_autor':
            obtenerNoticiasPorAutor(
                $mysqli,
                intval($_GET['autor_id'] ?? 0)
            );
            break;

        case 'crear':

            if ($method !== 'POST') {

                http_response_code(405);

                echo json_encode([
                    'error' => 'Método no permitido'
                ]);

                exit;
            }

            crearNoticia($mysqli);
            break;

        case 'actualizar':

            if ($method !== 'POST' && $method !== 'PUT') {

                http_response_code(405);

                echo json_encode([
                    'error' => 'Método no permitido'
                ]);

                exit;
            }

            actualizarNoticia($mysqli);
            break;

        case 'eliminar':

            if ($method !== 'POST' && $method !== 'DELETE') {

                http_response_code(405);

                echo json_encode([
                    'error' => 'Método no permitido'
                ]);

                exit;
            }

            eliminarNoticia($mysqli);
            break;

        default:

            http_response_code(400);

            echo json_encode([
                'error' => 'Acción no reconocida'
            ]);
    }

} catch (Exception $e) {

    http_response_code(500);

    echo json_encode([
        'error' => $e->getMessage()
    ]);

    exit;
}


// ============================================================
// OBTENER TODAS LAS NOTICIAS
// ============================================================

function obtenerNoticias($mysqli) {

    $estado = $_GET['estado'] ?? 'publicada';
    $limite = intval($_GET['limite'] ?? 50);
    $offset = intval($_GET['offset'] ?? 0);

    $query = "
        SELECT
            n.id,
            n.titulo,
            n.contenido,
            n.resumen,
            n.imagen_mime,
            n.imagen_blob,
            n.tipo,
            n.destacado,
            n.prioridad,
            n.autor_id,
            n.fecha_creacion,
            n.estado,
            n.visitas,
            COALESCE(u.nombre, 'Anónimo') AS autor_nombre
        FROM noticias n
        LEFT JOIN usuarios u
            ON n.autor_id = u.id
        WHERE n.estado = ?
        ORDER BY
            n.prioridad DESC,
            n.fecha_creacion DESC
        LIMIT ? OFFSET ?
    ";

    $stmt = $mysqli->prepare($query);

    if (!$stmt) {
        throw new Exception(
            "Error preparando consulta: " . $mysqli->error
        );
    }

    $stmt->bind_param(
        'sii',
        $estado,
        $limite,
        $offset
    );

    if (!$stmt->execute()) {
        throw new Exception(
            "Error ejecutando consulta: " . $stmt->error
        );
    }

    $result = $stmt->get_result();

    $noticias = [];

    while ($row = $result->fetch_assoc()) {

        // Convertir BLOB a Base64 para poder enviarlo como JSON
        if (!empty($row['imagen_blob'])) {

            $row['imagen_blob'] = base64_encode(
                $row['imagen_blob']
            );

        } else {

            $row['imagen_blob'] = null;
        }

        $noticias[] = $row;
    }

    $stmt->close();

    echo json_encode(
        $noticias,
        JSON_UNESCAPED_UNICODE
    );
}


// ============================================================
// OBTENER NOTICIA POR ID
// ============================================================

function obtenerNoticiaPorId($mysqli, $id) {

    if ($id <= 0) {

        http_response_code(400);

        echo json_encode([
            'error' => 'ID inválido'
        ]);

        return;
    }

    $query = "
        SELECT
            n.*,
            COALESCE(u.nombre, 'Anónimo') AS autor_nombre
        FROM noticias n
        LEFT JOIN usuarios u
            ON n.autor_id = u.id
        WHERE n.id = ?
        AND n.estado = 'publicada'
        LIMIT 1
    ";

    $stmt = $mysqli->prepare($query);

    if (!$stmt) {

        throw new Exception(
            "Error preparando consulta: " . $mysqli->error
        );
    }

    $stmt->bind_param('i', $id);

    $stmt->execute();

    $result = $stmt->get_result();

    $noticia = $result->fetch_assoc();

    $stmt->close();

    if ($noticia) {

        // Convertir BLOB a Base64
        if (!empty($noticia['imagen_blob'])) {

            $noticia['imagen_blob'] = base64_encode(
                $noticia['imagen_blob']
            );

        } else {

            $noticia['imagen_blob'] = null;
        }

        // Incrementar visitas

        $updateQuery = "
            UPDATE noticias
            SET visitas = visitas + 1
            WHERE id = ?
        ";

        $updateStmt = $mysqli->prepare($updateQuery);

        $updateStmt->bind_param('i', $id);

        $updateStmt->execute();

        $updateStmt->close();

        echo json_encode(
            $noticia,
            JSON_UNESCAPED_UNICODE
        );

    } else {

        http_response_code(404);

        echo json_encode([
            'error' => 'Noticia no encontrada'
        ]);
    }
}


// ============================================================
// OBTENER NOTICIAS POR AUTOR
// ============================================================

function obtenerNoticiasPorAutor($mysqli, $autor_id) {

    if ($autor_id <= 0) {

        http_response_code(400);

        echo json_encode([
            'error' => 'ID de autor inválido'
        ]);

        return;
    }

    $query = "
        SELECT
            n.*,
            COALESCE(u.nombre, 'Anónimo') AS autor_nombre
        FROM noticias n
        LEFT JOIN usuarios u
            ON n.autor_id = u.id
        WHERE n.autor_id = ?
        ORDER BY n.fecha_creacion DESC
    ";

    $stmt = $mysqli->prepare($query);

    if (!$stmt) {

        throw new Exception(
            "Error preparando consulta: " . $mysqli->error
        );
    }

    $stmt->bind_param('i', $autor_id);

    if (!$stmt->execute()) {

        throw new Exception(
            "Error ejecutando consulta: " . $stmt->error
        );
    }

    $result = $stmt->get_result();

    $noticias = [];

    while ($row = $result->fetch_assoc()) {

        if (!empty($row['imagen_blob'])) {

            $row['imagen_blob'] = base64_encode(
                $row['imagen_blob']
            );

        } else {

            $row['imagen_blob'] = null;
        }

        $noticias[] = $row;
    }

    $stmt->close();

    echo json_encode(
        $noticias,
        JSON_UNESCAPED_UNICODE
    );
}


// ============================================================
// CREAR NUEVA NOTICIA
// ============================================================

function crearNoticia($mysqli) {

    $data = json_decode(
        file_get_contents('php://input'),
        true
    );

    if (!$data) {

        http_response_code(400);

        echo json_encode([
            'error' => 'JSON inválido'
        ]);

        return;
    }

    // ========================================================
    // VALIDAR CAMPOS OBLIGATORIOS
    // ========================================================

    if (
        empty($data['titulo']) ||
        empty($data['contenido'])
    ) {

        http_response_code(400);

        echo json_encode([
            'error' => 'Título y contenido son obligatorios'
        ]);

        return;
    }

    $titulo = $data['titulo'];

    $contenido = $data['contenido'];

    $resumen = $data['resumen']
        ?? substr($data['contenido'], 0, 150);

    $tipo = $data['tipo']
        ?? 'secundaria';

    $destacado = !empty($data['destacado'])
        ? 1
        : 0;

    $prioridad = intval(
        $data['prioridad'] ?? 0
    );

    // ========================================================
    // AUTOR DESDE LA SESIÓN
    // ========================================================

    $autor_id = intval(
        $_SESSION['id'] ?? 0
    );

    if ($autor_id <= 0) {

        http_response_code(401);

        echo json_encode([
            'error' => 'No hay un usuario autenticado'
        ]);

        return;
    }

    // ========================================================
    // IMAGEN BLOB + MIME
    // ========================================================

    $imagenBlob = null;
    $imagenMime = null;

    if (!empty($data['imagen_blob'])) {

        $imagenBlob = base64_decode(
            $data['imagen_blob'],
            true
        );

        if ($imagenBlob === false) {

            http_response_code(400);

            echo json_encode([
                'error' => 'La imagen enviada no es válida'
            ]);

            return;
        }

        $imagenMime = $data['imagen_mime'] ?? null;

        if (empty($imagenMime)) {

            http_response_code(400);

            echo json_encode([
                'error' => 'Falta el tipo MIME de la imagen'
            ]);

            return;
        }
    }

    // ========================================================
    // INSERT
    // ========================================================

    $query = "
        INSERT INTO noticias
        (
            titulo,
            contenido,
            resumen,
            imagen_blob,
            imagen_mime,
            tipo,
            destacado,
            prioridad,
            autor_id,
            estado
        )
        VALUES
        (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, 'publicada'
        )
    ";

    $stmt = $mysqli->prepare($query);

    if (!$stmt) {

        throw new Exception(
            "Error preparando consulta: "
            . $mysqli->error
        );
    }

    /*
     * Parámetros:
     *
     * 0 titulo       = s
     * 1 contenido    = s
     * 2 resumen      = s
     * 3 imagen_blob  = b
     * 4 imagen_mime  = s
     * 5 tipo         = s
     * 6 destacado    = i
     * 7 prioridad    = i
     * 8 autor_id     = i
     */

    $stmt->bind_param(
        'sssbssiii',
        $titulo,
        $contenido,
        $resumen,
        $imagenBlob,
        $imagenMime,
        $tipo,
        $destacado,
        $prioridad,
        $autor_id
    );

    // Enviar el BLOB correctamente
    if ($imagenBlob !== null) {

        $stmt->send_long_data(
            3,
            $imagenBlob
        );
    }

    if ($stmt->execute()) {

        $noticia_id = $mysqli->insert_id;

        echo json_encode([
            'success' => true,
            'id' => $noticia_id,
            'message' => 'Noticia creada correctamente'
        ]);

    } else {

        throw new Exception(
            "Error insertando noticia: "
            . $stmt->error
        );
    }

    $stmt->close();
}


// ============================================================
// ACTUALIZAR NOTICIA
// ============================================================

function actualizarNoticia($mysqli) {

    $data = json_decode(
        file_get_contents('php://input'),
        true
    );

    $id = intval(
        $data['id'] ?? 0
    );

    if ($id <= 0) {

        http_response_code(400);

        echo json_encode([
            'error' => 'ID inválido'
        ]);

        return;
    }

    $updates = [];
    $params = [];
    $types = '';

    // ========================================================
    // CAMPOS NORMALES
    // ========================================================

    if (isset($data['titulo'])) {

        $updates[] = "titulo = ?";
        $params[] = $data['titulo'];
        $types .= 's';
    }

    if (isset($data['contenido'])) {

        $updates[] = "contenido = ?";
        $params[] = $data['contenido'];
        $types .= 's';
    }

    if (isset($data['resumen'])) {

        $updates[] = "resumen = ?";
        $params[] = $data['resumen'];
        $types .= 's';
    }

    // ========================================================
    // IMAGEN BLOB
    // ========================================================

    $imagenBlob = null;

    if (
        isset($data['imagen_blob']) &&
        !empty($data['imagen_blob'])
    ) {

        $imagenBlob = base64_decode(
            $data['imagen_blob'],
            true
        );

        if ($imagenBlob === false) {

            http_response_code(400);

            echo json_encode([
                'error' => 'La imagen enviada no es válida'
            ]);

            return;
        }

        $updates[] = "imagen_blob = ?";
        $params[] = $imagenBlob;
        $types .= 'b';

        if (isset($data['imagen_mime'])) {

            $updates[] = "imagen_mime = ?";
            $params[] = $data['imagen_mime'];
            $types .= 's';
        }
    }

    // ========================================================
    // TIPO
    // ========================================================

    if (isset($data['tipo'])) {

        $updates[] = "tipo = ?";
        $params[] = $data['tipo'];
        $types .= 's';
    }

    // ========================================================
    // DESTACADO
    // ========================================================

    if (isset($data['destacado'])) {

        $updates[] = "destacado = ?";

        $params[] = $data['destacado']
            ? 1
            : 0;

        $types .= 'i';
    }

    // ========================================================
    // PRIORIDAD
    // ========================================================

    if (isset($data['prioridad'])) {

        $updates[] = "prioridad = ?";

        $params[] = intval(
            $data['prioridad']
        );

        $types .= 'i';
    }

    // ========================================================
    // NADA QUE ACTUALIZAR
    // ========================================================

    if (empty($updates)) {

        http_response_code(400);

        echo json_encode([
            'error' => 'Nada que actualizar'
        ]);

        return;
    }

    // Agregar ID al final

    $params[] = $id;
    $types .= 'i';

    $query =
        "UPDATE noticias SET "
        . implode(', ', $updates)
        . " WHERE id = ?";

    $stmt = $mysqli->prepare($query);

    if (!$stmt) {

        throw new Exception(
            "Error preparando consulta: "
            . $mysqli->error
        );
    }

    $stmt->bind_param(
        $types,
        ...$params
    );

    /*
     * Si se está actualizando la imagen,
     * enviar el BLOB con send_long_data().
     *
     * Buscamos la posición del parámetro b.
     */

    if ($imagenBlob !== null) {

        $posicionBlob = strpos(
            $types,
            'b'
        );

        if ($posicionBlob !== false) {

            $stmt->send_long_data(
                $posicionBlob,
                $imagenBlob
            );
        }
    }

    if ($stmt->execute()) {

        echo json_encode([
            'success' => true,
            'message' => 'Noticia actualizada'
        ]);

    } else {

        throw new Exception(
            "Error actualizando noticia: "
            . $stmt->error
        );
    }

    $stmt->close();
}


// ============================================================
// ELIMINAR NOTICIA
// ============================================================

function eliminarNoticia($mysqli) {

    $data = json_decode(
        file_get_contents('php://input'),
        true
    );

    $id = intval(
        $data['id'] ?? 0
    );

    if ($id <= 0) {

        http_response_code(400);

        echo json_encode([
            'error' => 'ID inválido'
        ]);

        return;
    }

    // Soft delete

    $query = "
        UPDATE noticias
        SET estado = 'archivada'
        WHERE id = ?
    ";

    $stmt = $mysqli->prepare($query);

    if (!$stmt) {

        throw new Exception(
            "Error preparando consulta: "
            . $mysqli->error
        );
    }

    $stmt->bind_param(
        'i',
        $id
    );

    if ($stmt->execute()) {

        echo json_encode([
            'success' => true,
            'message' => 'Noticia eliminada'
        ]);

    } else {

        throw new Exception(
            "Error eliminando noticia: "
            . $stmt->error
        );
    }

    $stmt->close();
}

?>
