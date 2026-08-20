<?php

// Configuración de la base de datos
$host = 'localhost';
$user = 'root';
$password = ''; // Cambiar si tienes una contraseña configurada
$database = 'web_escolar';

// Crear conexión
$conn = new mysqli($host, $user, $password, $database);

// Verificar conexión
if ($conn->connect_error) {
    die('Error de conexión: ' . $conn->connect_error);
}

?>