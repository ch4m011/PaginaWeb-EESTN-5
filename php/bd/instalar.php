<?php

$carpeta = __DIR__ . '/../../sql/';

$archivos = glob($carpeta . "*.sql");

sort($archivos);

foreach ($archivos as $archivo) {
    $nombre = basename($archivo);
    $sql = file_get_contents($archivo);

    try {

        $mysqli->multi_query($sql);

        // Procesar todos los resultados del archivo
        do {

            if ($resultado = $mysqli->store_result()) {
                $resultado->free();
            }

        } while ($mysqli->more_results() && $mysqli->next_result());

        // Si alguna consulta del archivo falló
        if ($mysqli->errno) {
            throw new Exception($mysqli->error);
        }

    } catch (Throwable $e) {

        echo "<br>";
        echo "<strong>ERROR en $nombre</strong><br>";
        echo $e->getMessage();
        echo "<br><br>";
        echo "<strong>Instalación cancelada.</strong>";

        exit;
    }
}