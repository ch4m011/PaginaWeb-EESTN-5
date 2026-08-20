<?php
// php/migrate_autor_email.php
require_once __DIR__ . '/config.php'; // o conexion.php según tu proyecto

try {
    // 1) Añadir columna si no existe (silencioso si ya existe)
    $check = $mysqli->query("SHOW COLUMNS FROM noticias LIKE 'autor_email'");
    if ($check && $check->num_rows === 0) {
        $mysqli->query("ALTER TABLE noticias ADD COLUMN autor_email VARCHAR(255) NULL AFTER autor_id");
        echo \"Columna autor_email creada\\n\";
    } else {
        echo \"Columna autor_email ya existe\\n\";
    }

    // 2) Backfill desde usuarios (si hay autor_id)
    $res = $mysqli->query("
        UPDATE noticias n
        JOIN usuarios u ON u.id = n.autor_id
        SET n.autor_email = u.correo
        WHERE (n.autor_email IS NULL OR n.autor_email = '')
    ");
    echo \"Filas actualizadas: \" . ($mysqli->affected_rows) . \"\\n\";

    // 3) Crear índice si no existe
    $resIdx = $mysqli->query(\"SHOW INDEX FROM noticias WHERE Key_name = 'idx_autor_email'\");
    if ($resIdx && $resIdx->num_rows === 0) {
        $mysqli->query(\"ALTER TABLE noticias ADD INDEX idx_autor_email (autor_email)\");
        echo \"Índice idx_autor_email creado\\n\";
    } else {
        echo \"Índice idx_autor_email ya existe\\n\";
    }

} catch (Exception $e) {
    echo \"Error: \" . $e->getMessage() . \"\\n\";
}