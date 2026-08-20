<?php
// debug_bom.php - muestra primeros bytes para detectar BOM
header('Content-Type: text/plain; charset=UTF-8');

$path = __DIR__ . '/obtener_imagen_usuario.php';
if (!file_exists($path)) {
    echo "No existe: $path\n";
    exit;
}

$contents = file_get_contents($path);
$first3 = substr($contents, 0, 3);
echo "Bytes hex (primeros 3): " . bin2hex($first3) . "\n";
echo "¿Comienza con '<?php' en posición 0?: " . (strpos($contents, '<?php') === 0 ? "SI\n" : "NO\n");
echo "Primeras 200 chars:\n" . substr($contents, 0, 200) . "\n";