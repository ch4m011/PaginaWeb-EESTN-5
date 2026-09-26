<?php

require_once "conexion.php";

$carpeta = "../../sql/";

$archivos = glob($carpeta . "*.sql");

sort($archivos);

foreach ($archivos as $archivo) {

    $nombre = basename($archivo);
    $sql = file_get_contents($archivo);

    try {

        $conn->multi_query($sql);

        // Procesar todos los resultados del archivo
        do {

            if ($resultado = $conn->store_result()) {
                $resultado->free();
            }

        } while ($conn->more_results() && $conn->next_result());

        // Si alguna consulta del archivo falló
        if ($conn->errno) {
            throw new Exception($conn->error);
        }

        echo "OK: $nombre<br>";

    } catch (Throwable $e) {

        echo "<br>";
        echo "<strong>ERROR en $nombre</strong><br>";
        echo $e->getMessage();
        echo "<br><br>";
        echo "<strong>Instalación cancelada.</strong>";

        exit;
    }
}

echo "<br><strong>Base de datos 'web-escolar' instalada correctamente.</strong>";