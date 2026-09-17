<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Prueba de conexión a la base de datos</h2>";

try {
    require_once __DIR__ . '/../php/config.php';
    require_once('../conexion.php');

    if (!isset($conexion)) {
        throw new Exception('Variable $conexion no encontrada');
    }

    if ($conexion->connect_error) {
        throw new Exception('Error de conexión: ' . $conexion->connect_error);
    }

    echo "<p style='color: green;'>✓ Conexión exitosa a la base de datos</p>";
    
    // Probar consulta a la tabla usuarios
    $result = $conexion->query("SHOW TABLES");
    if ($result) {
        echo "<h3>Tablas encontradas:</h3><ul>";
        while ($row = $result->fetch_array()) {
            echo "<li>" . htmlspecialchars($row[0]) . "</li>";
        }
        echo "</ul>";
    }

    // Verificar tabla usuarios específicamente
    $result = $conexion->query("DESCRIBE usuarios");
    if ($result) {
        echo "<h3>Estructura de tabla 'usuarios':</h3><ul>";
        while ($row = $result->fetch_assoc()) {
            echo "<li>" . htmlspecialchars($row['Field']) . " - " . htmlspecialchars($row['Type']) . "</li>";
        }
        echo "</ul>";
    }

    $sql = "SELECT COUNT(*) as total FROM usuarios";
    $result = $conexion->query($sql);

    if ($result) {
        $row = $result->fetch_assoc();
        echo "Conexión exitosa. Total usuarios: " . $row['total'];
    } else {
        echo "Error al consultar usuarios: " . $conexion->error;
    }

    $conexion->close();

} catch (Exception $e) {
    echo "<p style='color: red;'>✗ Error: " . htmlspecialchars($e->getMessage()) . "</p>";
}
?>