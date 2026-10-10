-- Recuperación de contraseña: tabla NUEVA. No modifica `usuarios` ni ninguna otra tabla.
-- Ejecutar en phpMyAdmin (base web-escolar > pestaña SQL o Importar).
-- (Si no lo hacés, php/recuperar/solicitar_recuperacion.php la crea sola la primera vez.)

CREATE TABLE IF NOT EXISTS password_resets (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ip VARCHAR(45) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY token_hash (token_hash),
  KEY user_created (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
