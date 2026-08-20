<?php
/**
 * Script de migración de eventos - Permite asignar autor a eventos huérfanos
 */

require_once __DIR__ . '/../php/config.php';
session_start();

// Si es POST, ejecutar la migración
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json; charset=utf-8');
    
    $action = $_POST['action'] ?? '';
    
    if ($action === 'assign_to_current_user') {
        // Asignar todos los eventos sin autor al usuario actual
        if (empty($_SESSION['user_id'])) {
            echo json_encode(['error' => 'Usuario no logueado']);
            exit;
        }
        
        $user_id = intval($_SESSION['user_id']);
        $user_email = strtolower(trim($_SESSION['user_email'] ?? $_SESSION['correo'] ?? ''));
        
        // Query de UPDATE
        $query = "UPDATE calendarios 
                  SET autor_id = ?, autor_email = ? 
                  WHERE (autor_id IS NULL OR autor_id = 0) AND (autor_email IS NULL OR autor_email = '')";
        
        $stmt = $mysqli->prepare($query);
        if (!$stmt) {
            echo json_encode(['error' => 'Error preparando query: ' . $mysqli->error]);
            exit;
        }
        
        $stmt->bind_param('is', $user_id, $user_email);
        if ($stmt->execute()) {
            $updated = $stmt->affected_rows;
            echo json_encode(['success' => true, 'message' => "Se asignaron $updated eventos al usuario actual"]);
        } else {
            echo json_encode(['error' => 'Error ejecutando query: ' . $stmt->error]);
        }
        $stmt->close();
        exit;
    }
    
    if ($action === 'delete_orphaned') {
        // Eliminar eventos sin autor (CUIDADO: esto es destructivo)
        $query = "DELETE FROM calendarios WHERE (autor_id IS NULL OR autor_id = 0) AND (autor_email IS NULL OR autor_email = '')";
        $result = $mysqli->query($query);
        if ($result) {
            $deleted = $mysqli->affected_rows;
            echo json_encode(['success' => true, 'message' => "Se eliminaron $deleted eventos sin autor"]);
        } else {
            echo json_encode(['error' => 'Error: ' . $mysqli->error]);
        }
        exit;
    }
}

// GET: mostrar página HTML
$eventosSinAutor = $mysqli->query("SELECT COUNT(*) as cnt FROM calendarios WHERE (autor_id IS NULL OR autor_id = 0) AND (autor_email IS NULL OR autor_email = '')")->fetch_assoc()['cnt'];
$totalEventos = $mysqli->query("SELECT COUNT(*) as cnt FROM calendarios")->fetch_assoc()['cnt'];
$usuarioActual = [
    'user_id' => $_SESSION['user_id'] ?? null,
    'user_email' => $_SESSION['user_email'] ?? $_SESSION['correo'] ?? null,
];

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Migración de Eventos - Calendario</title>
    <style>
        * { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        body { background: #f5f5f5; padding: 20px; }
        .container { max-width: 700px; margin: 0 auto; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
        h1 { color: #333; }
        h2 { color: #0066cc; font-size: 16px; }
        .info { background: #e3f2fd; padding: 15px; border-left: 4px solid #2196F3; border-radius: 4px; margin: 15px 0; }
        .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; border-radius: 4px; margin: 15px 0; }
        .success { background: #d4edda; padding: 15px; border-left: 4px solid #28a745; border-radius: 4px; margin: 15px 0; }
        .error { background: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; border-radius: 4px; margin: 15px 0; }
        button { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin: 5px; font-size: 14px; }
        .btn-primary { background: #0066cc; color: white; }
        .btn-primary:hover { background: #0052a3; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-danger:hover { background: #c82333; }
        .btn-secondary { background: #666; color: white; }
        .btn-secondary:hover { background: #555; }
        .stat { font-size: 24px; font-weight: bold; color: #0066cc; }
        table { width: 100%; margin-top: 10px; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    </style>
</head>
<body>
<div class="container">
    <h1>📊 Migración de Eventos - Calendario</h1>

    <div class="card">
        <h2>Estado Actual</h2>
        <table>
            <tr>
                <td><strong>Total de eventos:</strong></td>
                <td><span class="stat"><?= $totalEventos ?></span></td>
            </tr>
            <tr>
                <td><strong>Eventos sin autor:</strong></td>
                <td><span class="stat" style="color: <?= $eventosSinAutor > 0 ? '#ff9800' : '#28a745' ?>"><?= $eventosSinAutor ?></span></td>
            </tr>
        </table>
    </div>

    <?php if (empty($usuarioActual['user_id']) && empty($usuarioActual['user_email'])): ?>
        <div class="error">
            <strong>❌ Error:</strong> No hay usuario logueado. Por favor, inicia sesión en el panel del escritor primero.
        </div>
        <div class="card">
            <button class="btn-secondary" onclick="location.href='../pagina/panel_escritor.html'">Ir al Panel del Escritor</button>
        </div>
    <?php elseif ($eventosSinAutor === 0): ?>
        <div class="success">
            <strong>✅ Todo en orden:</strong> No hay eventos huérfanos. Todos los eventos tienen un autor asignado.
        </div>
        <div class="card">
            <button class="btn-secondary" onclick="location.href='../pagina/panel_escritor.html'">Volver al Panel</button>
        </div>
    <?php else: ?>
        <div class="warning">
            <strong>⚠️ Eventos sin autor detectados:</strong> Hay <?= $eventosSinAutor ?> evento(s) que no tienen autor asignado.
        </div>

        <div class="card">
            <h2>Opciones de Migración</h2>
            
            <h3>Opción 1: Asignar al usuario actual</h3>
            <div class="info">
                <p>Asigna todos los eventos huérfanos al usuario logueado (<strong><?= htmlspecialchars($usuarioActual['user_email'] ?? $usuarioActual['user_id'], ENT_QUOTES) ?></strong>).</p>
                <button class="btn-primary" onclick="asignarAlUsuarioActual()">✅ Asignar <?= $eventosSinAutor ?> evento(s)</button>
            </div>

            <h3>Opción 2: Eliminar eventos huérfanos</h3>
            <div class="warning">
                <p><strong>⚠️ Advertencia:</strong> Esto eliminará permanentemente los eventos sin autor. Esta acción no se puede deshacer.</p>
                <button class="btn-danger" onclick="if(confirm('¿Estás seguro? Se eliminarán ' + <?= $eventosSinAutor ?> + ' evento(s).')) eliminarHuerfanos()">🗑️ Eliminar eventos sin autor</button>
            </div>
        </div>

        <div id="resultado"></div>
    <?php endif; ?>

    <div class="card" style="margin-top: 30px;">
        <button class="btn-secondary" onclick="location.href='../date/verificador_eventos.php'">🔍 Verificador de Eventos</button>
        <button class="btn-secondary" onclick="location.href='../pagina/panel_escritor.html'">📝 Panel del Escritor</button>
        <button class="btn-secondary" onclick="location.href='../index.html'">🏠 Inicio</button>
    </div>
</div>

<script>
    async function asignarAlUsuarioActual() {
        const form = new FormData();
        form.append('action', 'assign_to_current_user');
        
        try {
            const response = await fetch(window.location.href, { method: 'POST', body: form });
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('resultado').innerHTML = 
                    '<div class="success"><strong>✅ Éxito:</strong> ' + data.message + '<br><button class="btn-secondary" onclick="location.reload()">Recargar página</button></div>';
            } else {
                document.getElementById('resultado').innerHTML = 
                    '<div class="error"><strong>❌ Error:</strong> ' + data.error + '</div>';
            }
        } catch (err) {
            document.getElementById('resultado').innerHTML = 
                '<div class="error"><strong>❌ Error:</strong> ' + err.message + '</div>';
        }
    }

    async function eliminarHuerfanos() {
        const form = new FormData();
        form.append('action', 'delete_orphaned');
        
        try {
            const response = await fetch(window.location.href, { method: 'POST', body: form });
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('resultado').innerHTML = 
                    '<div class="success"><strong>✅ Éxito:</strong> ' + data.message + '<br><button class="btn-secondary" onclick="location.reload()">Recargar página</button></div>';
            } else {
                document.getElementById('resultado').innerHTML = 
                    '<div class="error"><strong>❌ Error:</strong> ' + data.error + '</div>';
            }
        } catch (err) {
            document.getElementById('resultado').innerHTML = 
                '<div class="error"><strong>❌ Error:</strong> ' + err.message + '</div>';
        }
    }
</script>
</body>
</html>
