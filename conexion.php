<?php
$servername = "127.0.0.1";
$username   = "root";
$password   = "";
$database   = "web_escolar";

$conn = new mysqli($servername, $username, $password, $database);

if ($conn->connect_error) {
    die("❌ Error de conexión a la base de datos: " . $conn->connect_error);
}
?>