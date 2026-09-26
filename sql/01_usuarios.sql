  -- phpMyAdmin SQL Dump
  -- version 5.2.1
  -- https://www.phpmyadmin.net/
  --
  -- Servidor: 127.0.0.1
  -- Tiempo de generación: 10-11-2025 a las 18:57:05
  -- Versión del servidor: 10.4.32-MariaDB
  -- Versión de PHP: 8.0.30

  SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
  START TRANSACTION;
  SET time_zone = '+00:00';
  --
  -- Estructura de tabla para la tabla `usuarios`
  --
  CREATE TABLE IF NOT EXISTS usuarios (
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    contrasena VARCHAR(255) DEFAULT NULL,
    celular VARCHAR(20) DEFAULT NULL,

    rol ENUM('admin', 'usuario', 'escritor') NOT NULL DEFAULT 'usuario',
    tipo ENUM('manual', 'google') NOT NULL DEFAULT 'manual',

    firebase_uid VARCHAR(128) DEFAULT NULL,
    google_sub VARCHAR(255) DEFAULT NULL,

    imagen_blob LONGBLOB DEFAULT NULL,
    imagen_mime VARCHAR(100) DEFAULT NULL,

    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso TIMESTAMP NULL DEFAULT NULL,
    activo TINYINT(1) NOT NULL DEFAULT 1,

    deleted_at DATETIME DEFAULT NULL,
    deletion_token VARCHAR(64) DEFAULT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY email (email),
    KEY deleted_at (deleted_at),
    KEY deletion_token (deletion_token)
);

INSERT INTO usuarios (
    id,
    nombre,
    email,
    contrasena,
    celular,
    rol,
    tipo,
    firebase_uid,
    google_sub,
    imagen_blob,
    imagen_mime,
    fecha_registro,
    ultimo_acceso,
    activo,
    deleted_at,
    deletion_token
)
SELECT
    33,
    'Juan Andrés Figueroa',
    'jaafigueroarabanales@eest5.com',
    '$2y$10$CJerzvnmJ/y5AsgGJaBUXOD31MjyCbju/4w1qL2Xmiu8l6vFoXLQK',
    NULL,
    'usuario',
    'manual',
    NULL,
    NULL,
    NULL,
    NULL,
    '2025-11-10 17:03:35',
    NULL,
    1,
    NULL,
    NULL
WHERE NOT EXISTS (
    SELECT 1
    FROM usuarios
    WHERE id = 33
);