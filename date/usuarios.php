<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, PATCH, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$archivo = __DIR__ . "/usuarios.json";

// Permitir preflight (para PATCH)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Verificar que el archivo existe
if (!file_exists($archivo)) {
    echo json_encode(["error" => "Archivo usuarios.json no encontrado"]);
    http_response_code(404);
    exit;
}

// Leer usuarios actuales
$usuarios = json_decode(file_get_contents($archivo), true);
if (!is_array($usuarios)) $usuarios = [];

// Ruta esperada: usuarios.php?id=12345
$id = $_GET['id'] ?? null;

// PATCH → modificar usuario existente
if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $input = json_decode(file_get_contents("php://input"), true);
    if (!$id || !$input) {
        http_response_code(400);
        echo json_encode(["error" => "ID o datos faltantes"]);
        exit;
    }

    $actualizado = false;
    foreach ($usuarios as &$u) {
        if ($u['id'] == $id) {
            foreach ($input as $clave => $valor) {
                $u[$clave] = $valor;
            }
            $actualizado = true;
            break;
        }
    }

    if ($actualizado) {
        file_put_contents($archivo, json_encode($usuarios, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(["success" => true]);
    } else {
        http_response_code(404);
        echo json_encode(["error" => "Usuario no encontrado"]);
    }
    exit;
}

// GET → devolver usuarios.json completo
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo file_get_contents($archivo);
    exit;
}

http_response_code(405);
echo json_encode(["error" => "Método no permitido"]);
?>
