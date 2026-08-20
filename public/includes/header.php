<?php
if (session_status() === PHP_SESSION_NONE) session_start();
?>
<div class="user-profile">
    <div class="avatar">
        <?php
        $avatar = '/uploads/perfiles/avatar.jpg';
        if (!empty($_SESSION['imagen_perfil'])) {
            // si la ruta guardada es relativa o completa, úsala directamente
            $avatar = $_SESSION['imagen_perfil'];
        }
        ?>
        <img src="<?php echo htmlspecialchars($avatar, ENT_QUOTES); ?>" alt="Avatar">
    </div>
    <div class="username"><?php echo !empty($_SESSION['nombre']) ? htmlspecialchars($_SESSION['nombre'], ENT_QUOTES) : 'Usuario'; ?></div>
</div>
<div class="profile-dropdown">
    <div class="profile-menu">
        <a href="/perfil.html">Mi perfil</a>
        <?php if (!empty($_SESSION['rol'])): ?>
            <?php if ($_SESSION['rol'] === 'admin'): ?>
                <a href="/pagina/panel_admin.html">Panel admin</a>
            <?php endif; ?>
            <?php if ($_SESSION['rol'] === 'escritor'): ?>
                <a href="/pagina/panel_escritor.html">Panel escritor</a>
            <?php endif; ?>
            <?php if ($_SESSION['rol'] === 'usuario'): ?>
                <a href="/pagina/panel_usuario.html">Panel usuario</a>
            <?php endif; ?>
        <?php endif; ?>
        <a href="/public/iniciar_borrado_cuenta.php">Cerrar sesión</a>
    </div>
</div>