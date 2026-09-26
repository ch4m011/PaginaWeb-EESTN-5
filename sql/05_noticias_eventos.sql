CREATE TABLE IF NOT EXISTS eventos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME,
    color VARCHAR(7) DEFAULT '#007bff',
    autor_id INT NOT NULL,
    estado ENUM('pendiente', 'activo', 'finalizado') DEFAULT 'pendiente',
    FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE CASCADE
);