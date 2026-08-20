-- Verificar si las tablas existen y crearlas si no
CREATE TABLE IF NOT EXISTS noticias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT NOT NULL,
    imagen_principal VARCHAR(255),
    fecha_publicacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion DATETIME ON UPDATE CURRENT_TIMESTAMP,
    escritor_id INT NOT NULL,
    estado ENUM('borrador', 'publicado', 'archivado') DEFAULT 'borrador',
    destacada BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (escritor_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla para imágenes adicionales de noticias
CREATE TABLE IF NOT EXISTS imagenes_noticias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    noticia_id INT NOT NULL,
    ruta_imagen VARCHAR(255) NOT NULL,
    orden INT DEFAULT 0,
    FOREIGN KEY (noticia_id) REFERENCES noticias(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS eventos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME,
    color VARCHAR(7) DEFAULT '#007bff',
    escritor_id INT NOT NULL,
    estado ENUM('pendiente', 'activo', 'finalizado') DEFAULT 'pendiente',
    FOREIGN KEY (escritor_id) REFERENCES usuarios(id) ON DELETE CASCADE
);