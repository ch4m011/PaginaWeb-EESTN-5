<?php
/**
 * Verificador de eventos - Muestra el estado actual sin hacer cambios
 * Sirve para diagnosticar por qué eventos existentes está vacío
 */

require_once __DIR__ . '/../php/config.php';
session_start();

$usuario_actual = [
    'user_id' => $_SESSION['user_id'] ?? 'No definido',
    'user_email' => $_SESSION['user_email'] ?? 'No definido',
    'correo' => $_SESSION['correo'] ?? 'No definido',
];

// Total de eventos
$totalEventos = $mysqli->query("SELECT COUNT(*) as cnt FROM calendarios")->fetch_assoc()['cnt'];

// Eventos sin autor
$eventosSinAutor = $mysqli->query("SELECT COUNT(*) as cnt FROM calendarios WHERE (autor_id IS NULL OR autor_id = 0) AND (autor_email IS NULL OR autor_email = '')")->fetch_assoc()['cnt'];

// Eventos con autor_id
$eventosConId = $mysqli->query("SELECT COUNT(*) as cnt FROM calendarios WHERE autor_id IS NOT NULL AND autor_id > 0")->fetch_assoc()['cnt'];

// Eventos con autor_email
$eventosConEmail = $mysqli->query("SELECT COUNT(*) as cnt FROM calendarios WHERE autor_email IS NOT NULL AND autor_email != ''")->fetch_assoc()['cnt'];

// Eventos del usuario actual (si está logueado)
$eventosDelUsuario = 0;
if (!empty($_SESSION['user_id'])) {
    $eventosDelUsuario = $mysqli->query("SELECT COUNT(*) as cnt FROM calendarios WHERE autor_id = " . intval($_SESSION['user_id']))->fetch_assoc()['cnt'];
}

// Últimos 10 eventos
$ultimosEventos = [];
$result = $mysqli->query("SELECT id, fecha, titulo, tipo, autor_id, autor_email, fecha_creacion FROM calendarios ORDER BY fecha_creacion DESC LIMIT 10");
while ($row = $result->fetch_assoc()) {
    $ultimosEventos[] = $row;
}

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verificador de Eventos - Calendario</title>
    <style>
        * { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        body { background: #f5f5f5; padding: 20px; }
        .container { max-width: 900px; margin: 0 auto; }
        .card { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; margin-top: 0; }
        h2 { color: #0066cc; font-size: 18px; margin-top: 20px; border-bottom: 2px solid #0066cc; padding-bottom: 10px; }
        .stat { display: inline-block; margin: 10px 20px 10px 0; padding: 15px; background: #f9f9f9; border-left: 4px solid #0066cc; border-radius: 4px; }
        .stat strong { display: block; font-size: 24px; color: #0066cc; }
        .stat-label { font-size: 12px; color: #666; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f0f0f0; font-weight: bold; }
        tr:hover { background: #f9f9f9; }
        .success { color: #28a745; }
        .warning { color: #ff9800; }
        .error { color: #dc3545; }
        .info { background: #e3f2fd; padding: 15px; border-left: 4px solid #2196F3; border-radius: 4px; margin: 10px 0; }
        .button { background: #0066cc; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin: 5px; }
        .button:hover { background: #0052a3; }
        .button-back { background: #666; }
        .button-back:hover { background: #555; }
    </style>
</head>
<body>
<div class="container">
    <h1>🔍 Verificador de Eventos - Calendario</h1>
    
    <!-- Usuario actual -->
    <div class="card">
        <h2>👤 Usuario Actual (Sesión)</h2>
        <table>
            <tr>
                <th>Campo</th>
                <th>Valor</th>
            </tr>
            <tr>
                <td><strong>user_id</strong></td>
                <td><?= htmlspecialchars($usuario_actual['user_id'], ENT_QUOTES) ?></td>
            </tr>
            <tr>
                <td><strong>user_email</strong></td>
                <td><?= htmlspecialchars($usuario_actual['user_email'], ENT_QUOTES) ?></td>
            </tr>
            <tr>
                <td><strong>correo</strong></td>
                <td><?= htmlspecialchars($usuario_actual['correo'], ENT_QUOTES) ?></td>
            </tr>
        </table>
        <?php if (empty($_SESSION['user_id']) && empty($_SESSION['user_email']) && empty($_SESSION['correo'])): ?>
            <div class="info" style="margin-top: 15px;">
                <strong>⚠️ Advertencia:</strong> No hay usuario logueado en esta sesión. Los eventos no tendrán autor asignado.
            </div>
        <?php endif; ?>
    </div>

    <!-- Estadísticas -->
    <div class="card">
        <h2>📊 Estadísticas de Eventos</h2>
        <div>
            <div class="stat">
                <strong><?= $totalEventos ?></strong>
                <span class="stat-label">Total de eventos</span>
            </div>
            <div class="stat">
                <strong><?= $eventosConId ?></strong>
                <span class="stat-label">Con autor_id asignado</span>
            </div>
            <div class="stat">
                <strong><?= $eventosConEmail ?></strong>
                <span class="stat-label">Con autor_email asignado</span>
            </div>
            <div class="stat">
                <strong><?= $eventosSinAutor ?></strong>
                <span class="stat-label">Sin autor (huérfanos)</span>
            </div>
            <div class="stat">
                <strong><?= $eventosDelUsuario ?></strong>
                <span class="stat-label">Del usuario actual</span>
            </div>
        </div>
    </div>

    <!-- Últimos eventos -->
    <div class="card">
        <h2>📅 Últimos 10 Eventos en la Base de Datos</h2>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th>Título</th>
                    <th>Tipo</th>
                    <th>Autor ID</th>
                    <th>Autor Email</th>
                    <th>Creado</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach ($ultimosEventos as $ev): ?>
                <tr>
                    <td><?= $ev['id'] ?></td>
                    <td><?= $ev['fecha'] ?></td>
                    <td><?= htmlspecialchars($ev['titulo'], ENT_QUOTES) ?></td>
                    <td><?= htmlspecialchars($ev['tipo'], ENT_QUOTES) ?></td>
                    <td><?= $ev['autor_id'] ?? '<span class="error">NULL</span>' ?></td>
                    <td><?= htmlspecialchars($ev['autor_email'] ?? '<span class="error">NULL</span>', ENT_QUOTES) ?></td>
                    <td><?= substr($ev['fecha_creacion'], 0, 10) ?></td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>

    <!-- Recomendaciones -->
    <div class="card">
        <h2>💡 Recomendaciones</h2>
        <?php if ($eventosSinAutor > 0): ?>
            <div class="info" style="background: #fff3cd; border-left-color: #ffc107;">
                <strong>⚠️ Se detectaron <?= $eventosSinAutor ?> eventos sin autor asignado.</strong>
                <p>Estos eventos no aparecerán en "Eventos existentes" del panel del escritor porque no tienen autor.</p>
                <button class="button" onclick="location.href='../date/migrate_eventos.php'">📝 Ver opción de migración</button>
            </div>
        <?php endif; ?>

        <?php if ($eventosDelUsuario > 0): ?>
            <div class="info" style="background: #d4edda; border-left-color: #28a745;">
                <strong>✅ Tienes <?= $eventosDelUsuario ?> evento(s) en la BD.</strong>
                <p>Deberían aparecer en tu panel de "Eventos existentes".</p>
            </div>
        <?php elseif (!empty($_SESSION['user_id'])): ?>
            <div class="info" style="background: #f8d7da; border-left-color: #dc3545;">
                <strong>❌ No tienes eventos creados aún.</strong>
                <p>Crea un nuevo evento desde el panel del escritor.</p>
            </div>
        <?php endif; ?>
    </div>

    <!-- Botones de acción -->
    <div class="card">
        <button class="button" onclick="location.href='../pagina/panel_escritor.html'">📝 Ir al Panel del Escritor</button>
        <button class="button" onclick="location.href='../index.html'">🏠 Ir al Inicio</button>
        <button class="button button-back" onclick="history.back()">⬅️ Volver</button>
    </div>

</div>
</body>
</html>
