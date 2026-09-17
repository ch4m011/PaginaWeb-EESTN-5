-- ========================================
-- Tabla: calendarios
-- Descripción: Almacena eventos del calendario escolar
-- Campos: id, fecha, titulo, tipo, descripcion, horaInicio, horaFin, fecha_creacion
-- ========================================

CREATE TABLE IF NOT EXISTS calendarios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    tipo ENUM('titulo-evento', 'titulo-feriado', 'titulo-no-clases') NOT NULL DEFAULT 'titulo-evento',
    descripcion TEXT DEFAULT NULL,
    horaInicio TIME NOT NULL,
    horaFin TIME NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_fecha (fecha),
    INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar algunos datos de ejemplo (opcional)
INSERT INTO calendarios (fecha, titulo, tipo, descripcion, horaInicio, horaFin) VALUES
('2025-10-30', 'porque es sabado', 'titulo-evento', '123', '14:52:00', '17:56:00'),
('2025-10-15', 'feriado', 'titulo-feriado', 'dia de la independencia', '22:36:00', '01:37:00')
ON DUPLICATE KEY UPDATE id=id;
