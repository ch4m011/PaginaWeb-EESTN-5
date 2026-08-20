<?php
header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$archivo = __DIR__ . "/calendario.json";

// Si el archivo no existe, lo crea
if (!file_exists($archivo)) {
    file_put_contents($archivo, json_encode([]));
}

// Permitir preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo file_get_contents($archivo);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (!$data) { echo json_encode(["error"=>"Datos inválidos"]); exit; }

    file_put_contents($archivo, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo json_encode(["status"=>"ok"]);
    exit;
}

echo json_encode(["error"=>"Método no permitido"]);
?>
