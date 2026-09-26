-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 17-11-2025 a las 04:22:39
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
--
-- Base de datos: `web-escolar`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `noticias`
--

CREATE TABLE IF NOT EXISTS `noticias` (
    id INT(11) NOT NULL AUTO_INCREMENT,
    titulo VARCHAR(255) NOT NULL,
    contenido LONGTEXT NOT NULL,
    resumen TEXT DEFAULT NULL,
    
    imagen_blob LONGBLOB DEFAULT NULL,
    imagen_mime VARCHAR(100) DEFAULT NULL,
    
    tipo ENUM('principal','secundaria') DEFAULT 'secundaria',
    destacado TINYINT(1) DEFAULT 0,
    prioridad INT(11) DEFAULT 0,
    autor_id INT(11) DEFAULT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    estado ENUM('borrador','publicada','archivada') DEFAULT 'publicada',
    visitas INT(11) DEFAULT 0,

    PRIMARY KEY (`id`),
    FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    KEY `fecha_creacion` (`fecha_creacion`),
    KEY `estado` (`estado`),
    KEY `tipo` (`tipo`)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;