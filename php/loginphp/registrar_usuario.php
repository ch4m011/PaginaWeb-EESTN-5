<?php
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Ruta del archivo JSON (asegúrate de que exista la carpeta /date)
$archivoUsuarios = __DIR__ . '/../../date/usuarios.json';

// Crear archivo si no existe
if (!file_exists($archivoUsuarios)) {
    file_put_contents($archivoUsuarios, json_encode([]));
}

// Leer datos enviados
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "Datos no válidos."]);
    exit;
}

// Variables
$nombre = trim($data["nombre"] ?? "");
$correo = trim($data["correo"] ?? "");
$contraseña = trim($data["contraseña"] ?? "");
$tipoCuenta = $data["tipoCuenta"] ?? "manual";
$rol = "usuario";

// Validaciones básicas
if ($correo === "" || $nombre === "") {
    echo json_encode(["success" => false, "message" => "El nombre y correo son obligatorios."]);
    exit;
}

// Si es registro manual, la contraseña es obligatoria
if ($tipoCuenta === "manual" && $contraseña === "") {
    echo json_encode(["success" => false, "message" => "La contraseña es obligatoria para cuentas manuales."]);
    exit;
}

// Leer usuarios existentes
$usuarios = json_decode(file_get_contents($archivoUsuarios), true) ?? [];

// Buscar usuario existente por correo
foreach ($usuarios as $u) {
    if (strcasecmp($u["correo"], $correo) === 0) {
        // Si ya existe, simplemente devolver el usuario existente
        echo json_encode([
            "success" => true,
            "message" => "Usuario ya existente, sesión iniciada.",
            "usuario" => $u
        ]);
        exit;
    }
}

// Crear nuevo usuario
$nuevoUsuario = [
    "id" => time(),
    "nombre" => $nombre,
    "correo" => $correo,
    "contraseña" => ($tipoCuenta === "google") ? "" : $contraseña,
    "rol" => $rol,
    "tipoCuenta" => $tipoCuenta
];

// Guardar en JSON
$usuarios[] = $nuevoUsuario;
file_put_contents($archivoUsuarios, json_encode($usuarios, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

// Responder
echo json_encode([
    "success" => true,
    "message" => "Usuario registrado correctamente.",
    "usuario" => $nuevoUsuario
]);
