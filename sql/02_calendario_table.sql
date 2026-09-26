-- ========================================
-- Tabla: calendarios
-- Descripción: Almacena eventos del calendario escolar
-- Campos: id, autor_id fecha, titulo, tipo, descripcion, hora_inicio, hora_fin, fecha_creacion
-- ========================================

CREATE TABLE IF NOT EXISTS calendarios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    autor_id INT(11) DEFAULT NULL,
    fecha DATE NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    tipo ENUM('evento', 'feriado', 'no-clases') NOT NULL DEFAULT 'evento',
    descripcion TEXT DEFAULT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fecha (fecha),
    INDEX idx_tipo (tipo),
    
    FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar algunos datos de ejemplo (opcional)
INSERT INTO calendarios (id, autor_id, fecha, titulo, tipo, descripcion, hora_inicio, hora_fin, fecha_creacion) VALUES
(1, 33, '2025-10-30', 'porque es sabado', 'evento', '123', '14:52:00', '17:56:00', '2025-10-29'),
(2, 33, '2025-10-15', 'feriado', 'feriado', 'dia de la independencia', '22:36:00', '01:37:00', '2025-10-14')
ON DUPLICATE KEY UPDATE id=id;