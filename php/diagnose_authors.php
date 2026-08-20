<?php
// diagnose_authors.php
// Devuelve JSON con diagnóstico de coincidencias entre noticias.autor_email / autor_id y usuarios.correo / id
require_once __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');

if (!$conn || $conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => 'No hay conexión a la BD']);
    exit;
}

$sql = "SELECT id, titulo, autor_id, autor_email FROM noticias ORDER BY id DESC LIMIT 200";
$res = $conn->query($sql);
if (!$res) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al leer noticias: ' . $conn->error]);
    exit;
}

$rows = [];
while ($r = $res->fetch_assoc()) {
    $id = intval($r['id']);
    $aid = intval($r['autor_id']);
    $aemail = trim(strtolower($r['autor_email'] ?? ''));

    $match = null;
    $userById = null;
    $userByEmail = null;
    $errors = [];

    // Intentar por autor_id primero
    if ($aid > 0) {
        $stmt = $conn->prepare("SELECT id, nombre, correo, imagen_perfil FROM usuarios WHERE id = ? LIMIT 1");
        if ($stmt) {
            $stmt->bind_param('i', $aid);
            if ($stmt->execute()) {
                $u = $stmt->get_result()->fetch_assoc();
                if ($u) {
                    $match = ['by' => 'id', 'user' => $u];
                    $userById = $u;
                } else {
                    $userById = null;
                }
            } else {
                $errors['by_id_execute'] = $stmt->error;
            }
            $stmt->close();
        } else {
            $errors['by_id_prepare'] = $conn->error;
        }
    }

    // Si no encontrado por id, intentar por email (normalizado)
    if (!$match && $aemail !== '') {
        $stmt = $conn->prepare("SELECT id, nombre, correo, imagen_perfil FROM usuarios WHERE TRIM(LOWER(correo)) = ? LIMIT 1");
        if ($stmt) {
            $stmt->bind_param('s', $aemail);
            if ($stmt->execute()) {
                $u = $stmt->get_result()->fetch_assoc();
                if ($u) {
                    $match = ['by' => 'email', 'user' => $u];
                    $userByEmail = $u;
                } else {
                    $userByEmail = null;
                }
            } else {
                $errors['by_email_execute'] = $stmt->error;
            }
            $stmt->close();
        } else {
            $errors['by_email_prepare'] = $conn->error;
        }
    }

    $rows[] = [
        'noticia_id' => $id,
        'titulo' => $r['titulo'],
        'autor_id' => $aid,
        'autor_email_raw' => $r['autor_email'],
        'autor_email_norm' => $aemail,
        'matched' => $match !== null,
        'match' => $match,
        'user_by_id' => $userById,
        'user_by_email' => $userByEmail,
        'errors' => $errors
    ];
}

echo json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
exit;
