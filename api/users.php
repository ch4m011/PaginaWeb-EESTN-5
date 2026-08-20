<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$usuariosPath = __DIR__ . "/../date/usuarios.json";

// Leer usuarios
function getUsuarios($path) {
    if (!file_exists($path)) return [];
    $json = file_get_contents($path);
    return json_decode($json, true) ?? [];
}

// Guardar usuarios
function saveUsuarios($path, $usuarios) {
    file_put_contents($path, json_encode($usuarios, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// Si es una pre-solicitud (CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ===============================
// GET - Listar usuarios
// ===============================
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(getUsuarios($usuariosPath));
    exit;
}

// ===============================
// PATCH - Modificar usuario
// ===============================
if ($_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $url = $_SERVER['REQUEST_URI'];
    $partes = explode('/', $url);
    $id = intval(end($partes)); // último valor de la URL es el ID

    $input = json_decode(file_get_contents("php://input"), true);
    if (!$input || !$id) {
        http_response_code(400);
        echo json_encode(["error" => "Datos inválidos"]);
        exit;
    }

    $usuarios = getUsuarios($usuariosPath);
    $found = false;

    foreach ($usuarios as &$u) {
        if (intval($u['id']) === $id) {
            foreach ($input as $key => $val) {
                $u[$key] = $val; // actualiza el campo enviado
            }
            $found = true;
            break;
        }
    }

    if (!$found) {
        http_response_code(404);
        echo json_encode(["error" => "Usuario no encontrado"]);
        exit;
    }

    saveUsuarios($usuariosPath, $usuarios);
    echo json_encode(["ok" => true, "usuario" => $u]);
    exit;
}

// Si llega otra cosa
http_response_code(405);
echo json_encode(["error" => "Método no permitido"]);
