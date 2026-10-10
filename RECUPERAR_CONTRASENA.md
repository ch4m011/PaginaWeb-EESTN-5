# Recuperar contraseña — archivos nuevos

Copiá estas carpetas encima de tu proyecto (en htdocs/web-escolar). No pisan ningún archivo existente:

- html/olvide_contrasena.html
- html/restablecer_contrasena.html
- js/recuperar_contrasena.js
- php/recuperar/solicitar_recuperacion.php
- php/recuperar/restablecer_contrasena.php
- sql/06_password_resets.sql   (opcional: la tabla también se crea sola al primer uso)

Probar: http://localhost/web-escolar/html/olvide_contrasena.html

Opcional: en php/.env agregar APP_URL=https://tu-dominio para el link del mail en producción.
Opcional: link en login.html:  <a href="olvide_contrasena.html">¿Olvidaste tu contraseña?</a>
