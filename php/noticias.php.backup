<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

$baseDir = dirname(__DIR__);
$archivoNoticias = $baseDir . '/date/noticias.json';
$carpetaImagenes = $baseDir . '/date/img/';

if (!is_dir($carpetaImagenes)) mkdir($carpetaImagenes, 0777, true);
if (!file_exists($archivoNoticias)) file_put_contents($archivoNoticias, json_encode([]));

// -------------------------
// OPTIONS (preflight)
// -------------------------
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// -------------------------
// GET → listar todas
// -------------------------
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo file_get_contents($archivoNoticias);
    exit;
}

// -------------------------
// POST → crear o editar noticia
// -------------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $noticias = json_decode(file_get_contents($archivoNoticias), true) ?: [];

    $id = $_POST['id'] ?? null;
    $titulo = trim($_POST['titulo'] ?? '');
    $contenido = trim($_POST['contenido'] ?? '');
    $autor = trim($_POST['autor'] ?? '');
    $fecha = trim($_POST['fecha'] ?? '');

    if (!$titulo || !$contenido || !$autor || !$fecha) {
        http_response_code(400);
        echo json_encode(["error" => "Faltan campos obligatorios."]);
        exit;
    }

    // ----------------------------------------
    // Subida o conservación de la imagen
    // ----------------------------------------
    $rutaImagen = '';

    // Si es una edición, buscamos la noticia existente
    if ($id) {
        foreach ($noticias as &$n) {
            if ($n['id'] == $id) {
                $rutaImagen = $n['imagen'] ?? ''; // Mantener imagen anterior
                break;
            }
        }
    }

    // Si se sube una imagen nueva, reemplazamos
    if (!empty($_FILES['imagen']) && $_FILES['imagen']['error'] === UPLOAD_ERR_OK) {
        $ext = strtolower(pathinfo($_FILES['imagen']['name'], PATHINFO_EXTENSION));
        $permitidas = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        if (!in_array($ext, $permitidas)) {
            http_response_code(400);
            echo json_encode(["error" => "Formato de imagen no permitido."]);
            exit;
        }

        // Si existía una imagen previa, eliminarla
        if (!empty($rutaImagen)) {
            $imgAnterior = $baseDir . '/' . $rutaImagen;
            if (file_exists($imgAnterior)) unlink($imgAnterior);
        }

        $nombreFinal = 'noticia_' . time() . '.' . $ext;
        $rutaDestino = $carpetaImagenes . $nombreFinal;
        move_uploaded_file($_FILES['imagen']['tmp_name'], $rutaDestino);
        $rutaImagen = 'date/img/' . $nombreFinal;
    }

    // ----------------------------------------
    // MODO CREAR NUEVA NOTICIA
    // ----------------------------------------
    if (!$id) {
        $nueva = [
            "id" => time(),
            "titulo" => $titulo,
            "contenido" => $contenido,
            "imagen" => $rutaImagen,
            "autor" => $autor,
            "fecha" => $fecha
        ];
        $noticias[] = $nueva;
        file_put_contents($archivoNoticias, json_encode($noticias, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(["mensaje" => "✅ Noticia guardada correctamente", "noticia" => $nueva]);
        exit;
    }

    // ----------------------------------------
    // MODO EDITAR NOTICIA EXISTENTE
    // ----------------------------------------
    $editada = false;
    foreach ($noticias as &$n) {
        if ($n['id'] == $id) {
            $n['titulo'] = $titulo;
            $n['contenido'] = $contenido;
            $n['autor'] = $autor;
            $n['fecha'] = $fecha;
            $n['imagen'] = $rutaImagen;
            $editada = true;
            break;
        }
    }

    if (!$editada) {
        http_response_code(404);
        echo json_encode(["error" => "No se encontró la noticia para editar."]);
        exit;
    }

    file_put_contents($archivoNoticias, json_encode($noticias, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo json_encode(["mensaje" => "✏️ Noticia actualizada correctamente"]);
    exit;
}

// -------------------------
// DELETE → eliminar noticia + imagen
// -------------------------
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "Falta el ID de la noticia."]);
        exit;
    }

    $id = $data['id'];
    $noticias = json_decode(file_get_contents($archivoNoticias), true) ?: [];
    $encontrada = false;

    foreach ($noticias as $i => $n) {
        if ($n['id'] == $id) {
            $encontrada = true;
            if (!empty($n['imagen'])) {
                $imgPath = $baseDir . '/' . $n['imagen'];
                if (file_exists($imgPath)) unlink($imgPath);
            }
            array_splice($noticias, $i, 1);
            break;
        }
    }

    if (!$encontrada) {
        http_response_code(404);
        echo json_encode(["error" => "Noticia no encontrada."]);
        exit;
    }

    file_put_contents($archivoNoticias, json_encode($noticias, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo json_encode(["mensaje" => "🗑️ Noticia eliminada correctamente."]);
    exit;
}

// -------------------------
http_response_code(405);
echo json_encode(["error" => "Método no permitido."]);
