<?php

$host = "localhost";
$usuario = "root";
$password = "";

$conn = new mysqli($host, $usuario, $password);

if ($conn->connect_error) {
    die("Error de conexión: " . $conn->connect_error);
}

$db = "web-escolar";

$conn->query("CREATE DATABASE IF NOT EXISTS `$db`");
$conn->select_db($db);