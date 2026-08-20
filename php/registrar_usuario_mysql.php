<?php
// registrar_usuario_mysql.php
// Registro seguro en MySQL con contraseñas cifradas
session_start();
require_once "config.php"; // Debe definir $mysqli (mysqli_connect)
header('Content-Type: application/json; charset=UTF-8');

// Añadir logging
function logRegistro($mensaje) {
    file_put_contents(__DIR__ . '/registro_debug.txt', '['.date('Y-m-d H:i:s').'] '.$mensaje."\n", FILE_APPEND);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $nombre = trim($data["nombre"] ?? "");
    $correo = trim($data["correo"] ?? "");
    $contrasena = trim($data["contrasena"] ?? "");
    $tipoCuenta = $data["tipoCuenta"] ?? "manual";
    $rol = "usuario";

    // Log datos recibidos
    logRegistro("Datos POST recibidos: " . print_r($_POST, true));

    if ($nombre === "" || $correo === "" || $contrasena === "") {
        echo json_encode(["success" => false, "message" => "Todos los campos son obligatorios."]);
        exit;
    }

    // Verificar si ya existe
    $stmt = $mysqli->prepare("SELECT id FROM usuarios WHERE correo = ?");
    $stmt->bind_param("s", $correo);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows > 0) {
        logRegistro("Error: Usuario ya existe con correo: " . $correo);
        echo json_encode(["success" => false, "message" => "El correo ya está registrado."]);
        exit;
    }
    $stmt->close();

    // Cifrar contraseña
    $hash = password_hash($contrasena, PASSWORD_BCRYPT);
    $stmt = $mysqli->prepare("INSERT INTO usuarios (nombre, correo, contrasena, rol, tipoCuenta) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("sssss", $nombre, $correo, $hash, $rol, $tipoCuenta);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        $id_usuario = $stmt->insert_id;
        logRegistro("Usuario registrado exitosamente. ID: " . $id_usuario);
        
        echo json_encode([
            "success" => true,
            "message" => "Usuario registrado correctamente.",
            "usuario" => [
                "id" => $id_usuario,
                "nombre" => $nombre,
                "correo" => $correo,
                "rol" => "usuario"
            ]
        ]);
    } else {
        logRegistro("Error al registrar usuario: " . $mysqli->error);
        echo json_encode(["success" => false, "message" => "Error al registrar usuario."]);
    }
    $stmt->close();
}
?>
