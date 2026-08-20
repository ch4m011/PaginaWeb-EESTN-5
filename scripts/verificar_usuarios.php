<?php
require_once __DIR__ . '/../php/config.php';

// Verificar conexión
if (!isset($conexion)) {
    die("Error: No hay conexión a la base de datos");
}

echo "<h2>Verificación de la tabla usuarios</h2>";

try {
    // Verificar si existe la tabla
    $sql = "SHOW TABLES LIKE 'usuarios'";
    $result = $conexion->query($sql);

    if ($result->num_rows > 0) {
        echo "✅ La tabla usuarios existe<br>";
        
        // Verificar estructura
        $sql = "DESCRIBE usuarios";
        $result = $conexion->query($sql);
        
        echo "<h3>Estructura de la tabla:</h3>";
        echo "<ul>";
        while ($row = $result->fetch_assoc()) {
            echo "<li>{$row['Field']} - {$row['Type']}</li>";
        }
        echo "</ul>";

        // Verificar datos
        $sql = "SELECT * FROM usuarios LIMIT 1";
        $result = $conexion->query($sql);
        
        if ($result->num_rows > 0) {
            echo "✅ La tabla contiene registros<br>";
            $usuario = $result->fetch_assoc();
            echo "<h3>Campos disponibles:</h3>";
            echo "<ul>";
            foreach ($usuario as $campo => $valor) {
                // No mostrar contraseñas ni datos sensibles
                if ($campo != 'contrasena' && $campo != 'password') {
                    echo "<li>$campo</li>";
                }
            }
            echo "</ul>";
        } else {
            echo "⚠️ La tabla está vacía<br>";
            
            // Crear usuario de prueba
            $sql = "INSERT INTO usuarios (nombre, correo, contrasena, rol, tipoCuenta) 
                   VALUES ('test', 'test@test.com', '123456', 'usuario', 'manual')";
            
            if ($conexion->query($sql)) {
                echo "✅ Usuario de prueba creado correctamente<br>";
            } else {
                echo "❌ Error creando usuario de prueba: " . $conexion->error . "<br>";
            }
        }
    } else {
        echo "❌ La tabla usuarios no existe<br>";
        
        // Crear tabla
        $sql = file_get_contents(__DIR__ . '/../php/usuarios.sql');
        if ($conexion->multi_query($sql)) {
            echo "✅ Tabla usuarios creada correctamente<br>";
        } else {
            echo "❌ Error creando tabla: " . $conexion->error . "<br>";
        }
    }

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage();
}