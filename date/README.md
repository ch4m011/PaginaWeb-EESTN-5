# 📅 Sistema de Calendario - Adaptación a Base de Datos

## Descripción

El sistema de calendario se ha adaptado completamente para usar **MySQL** en lugar de archivos JSON. Todos los eventos ahora se guardan en la tabla `calendarios` de la base de datos `web_escolar`.

## Estructura de la Base de Datos

### Tabla: `calendarios`

```sql
CREATE TABLE calendarios (
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
);
```

**Campos:**
- `id`: Identificador único del evento (BigInt)
- `fecha`: Fecha del evento (DATE)
- `titulo`: Título del evento (VARCHAR 255)
- `tipo`: Tipo de evento (ENUM: evento, feriado, no-clases)
- `descripcion`: Descripción del evento (TEXT, opcional)
- `horaInicio`: Hora de inicio (TIME)
- `horaFin`: Hora de finalización (TIME)
- `fecha_creacion`: Timestamp de creación (auto-generado)

## Archivos Modificados

### 1. **Nuevos Archivos API**

#### `date/api_calendario.php`
- API REST completa para gestionar eventos del calendario
- **Métodos:**
  - `GET ?action=obtener` - Obtener todos los eventos
  - `GET ?action=obtener_por_id&id=X` - Obtener evento específico
  - `POST ?action=crear` - Crear nuevo evento
  - `PUT ?action=actualizar` - Actualizar evento
  - `DELETE ?action=eliminar` - Eliminar evento

**Ejemplo de uso:**
```javascript
// Obtener eventos
fetch('date/api_calendario.php?action=obtener')
    .then(r => r.json())
    .then(eventos => console.log(eventos));

// Crear evento
fetch('date/api_calendario.php?action=crear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        fecha: '2025-12-15',
        titulo: 'Acto de fin de año',
        tipo: 'titulo-evento',
        descripcion: 'Celebración de fin de año',
        horaInicio: '14:00:00',
        horaFin: '17:00:00'
    })
})
```

#### `date/setup_calendario.php`
- Script de configuración automática
- Crea la tabla si no existe
- Migra datos del JSON a la BD
- Verifica la integridad del sistema

#### `date/migrate_calendario.php`
- Script para migrar datos del `calendario.json` a la base de datos
- Útil si necesitas reintentar la migración

### 2. **Archivos JavaScript Modificados**

#### `js/calendario.js` (Adaptado)
**Cambios principales:**
- Ahora carga eventos de `api_calendario.php` en lugar de `calendario.php`
- Las funciones de CRUD (crear, actualizar, eliminar) usan la API
- Cada operación se persiste directamente en la BD

**Funciones principales:**
```javascript
// Cargar eventos desde BD
await cargarEventosJSON(); // Llama a api_calendario.php

// Crear evento en BD
await crearEventoBD(datosEvento);

// Actualizar evento en BD
await actualizarEventoBD(id, datosEvento);

// Eliminar evento en BD
await eliminarEvento(id);
```

#### `js/calendario_flotante.js` (Adaptado)
**Cambios principales:**
- Ahora carga eventos de `api_calendario.php?action=obtener`
- Muestra los eventos en el panel flotante del calendario
- Soporta descripciones desplegables

**Funcionamiento:**
- El botón flotante 📅 en `index.html` abre el panel
- Carga automáticamente los eventos de la BD
- Muestra solo eventos relevantes con iconos según el tipo

## Setup Inicial

### Opción 1: Setup Automático (Recomendado)

1. Abre en tu navegador: `http://localhost/web-escolar/date/setup.html`
2. Haz clic en "▶️ Ejecutar Setup Completo"
3. El sistema va a:
   - Crear la tabla `calendarios` si no existe
   - Verificar la estructura
   - Migrar datos del `calendario.json` (si existen)
   - Verificar integridad

### Opción 2: Setup Manual

Ejecuta el SQL directamente en phpMyAdmin:

```sql
-- Crear tabla calendarios
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
```

## Uso del Sistema

### Crear Evento
1. Ve a la página del calendario: `/pagina/calendario.html` (o desde panel de administrador)
2. Selecciona una fecha en el calendario
3. Llena el formulario con:
   - Título
   - Tipo (Evento, Feriado, Sin clases)
   - Descripción
   - Horas de inicio y fin
4. Haz clic en "Crear Evento"
5. El evento se guarda automáticamente en la BD

### Ver Eventos
- **Panel Flotante**: Haz clic en el botón 📅 en la esquina de `index.html`
- **Calendario Completo**: Accede a `/pagina/calendario.html`
- **API Directa**: `GET /date/api_calendario.php?action=obtener`

### Editar Evento
1. En la página de calendario, haz clic en "✏️ Editar" en el evento
2. Modifica los campos
3. Haz clic en "Actualizar"

### Eliminar Evento
1. Haz clic en "🗑️ Eliminar" en el evento
2. Confirma la eliminación
3. El evento se elimina de la BD

## Estructura de Datos (JSON Request/Response)

### Formato de Evento

**Entrada (al crear/actualizar):**
```json
{
    "fecha": "2025-12-25",
    "titulo": "Navidad",
    "tipo": "titulo-feriado",
    "descripcion": "Día festivo",
    "horaInicio": "00:00:00",
    "horaFin": "23:59:59"
}
```

**Salida (al obtener):**
```json
{
    "id": 1,
    "fecha": "2025-12-25",
    "titulo": "Navidad",
    "tipo": "titulo-feriado",
    "descripcion": "Día festivo",
    "horaInicio": "00:00:00",
    "horaFin": "23:59:59",
    "fecha_creacion": "2025-11-18 10:30:45"
}
```

## Tipos de Eventos

| Tipo | Icono | Color | Uso |
|------|-------|-------|-----|
| `titulo-evento` | 🎉 | Azul | Eventos importantes |
| `titulo-feriado` | 📅 | Rojo | Días festivos |
| `titulo-no-clases` | ⚠️ | Naranja | Días sin clases |

## Panel Flotante (index.html)

El calendario flotante en `index.html` muestra:
- Un botón flotante 📅 en la esquina inferior derecha
- Al hacer clic, abre un panel con los próximos eventos
- Ordenados del más reciente al más antiguo
- Muestra descripciones desplegables

**HTML en index.html:**
```html
<div id="btnCalendarioFlotante" class="calendario-flotante" title="Fechas importantes">📅</div>
<div id="panelCalendario" class="panel-calendario">
    <div class="panel-header">
        <h3>Fechas Importantes</h3>
        <button id="cerrarPanelCalendario">❌</button>
    </div>
    <ul id="panelEventosLista"></ul>
</div>
```

## Migrando desde JSON

Si tienes datos en `date/calendario.json` y quieres migrarlos:

1. **Opción A:** Usa el setup automático
   - Abre `date/setup.html`
   - Ejecuta "Setup Completo"

2. **Opción B:** Script manual
   - Accede a `date/migrate_calendario.php`
   - Verá el resultado de la migración

## Verificación

Para verificar que todo funciona:

1. Abre: `http://localhost/web-escolar/date/setup.html`
2. Haz clic en "📋 Ver Eventos Actuales"
3. Deberías ver los eventos cargados en la BD

## Troubleshooting

### "Error de conexión a BD"
- Verifica que MySQL esté corriendo
- Verifica las credenciales en `php/config.php`
- Verifica que la BD `web_escolar` exista

### "Tabla calendarios no existe"
- Ejecuta el setup automático desde `date/setup.html`
- O crea la tabla manualmente en phpMyAdmin

### "Los eventos no se guardan"
- Verifica que la tabla tenga permisos de lectura/escritura
- Revisa los logs de PHP en `php/debug_log.txt`

### "El panel flotante no carga eventos"
- Verifica que `js/calendario_flotante.js` esté cargando
- Abre la consola del navegador (F12) y busca errores
- Verifica que la API responda: `curl http://localhost/web-escolar/date/api_calendario.php?action=obtener`

## API Endpoints Detallados

### GET: Obtener todos los eventos
```
GET /date/api_calendario.php?action=obtener&orden=ASC
```
**Parámetros:**
- `orden`: ASC o DESC (por fecha)

**Respuesta:**
```json
[
    { "id": 1, "fecha": "2025-12-25", ... },
    { "id": 2, "fecha": "2025-12-31", ... }
]
```

### POST: Crear evento
```
POST /date/api_calendario.php?action=crear
```
**Body:**
```json
{
    "fecha": "2025-12-25",
    "titulo": "Navidad",
    "tipo": "titulo-feriado",
    "descripcion": "Día festivo",
    "horaInicio": "00:00:00",
    "horaFin": "23:59:59"
}
```

### PUT: Actualizar evento
```
PUT /date/api_calendario.php?action=actualizar
```
**Body:**
```json
{
    "id": 1,
    "titulo": "Navidad (Actualizado)",
    "descripcion": "Día festivo - Modificado"
}
```

### DELETE: Eliminar evento
```
DELETE /date/api_calendario.php?action=eliminar
```
**Body:**
```json
{
    "id": 1
}
```

## Próximos Pasos

1. ✅ Configurar la base de datos (tabla calendarios)
2. ✅ Crear eventos desde la interfaz
3. ✅ Ver eventos en el panel flotante
4. ✅ Editar y eliminar eventos
5. 🔄 Integrar con otras partes del sistema si es necesario

## Soporte

Para preguntas o problemas:
1. Revisa la consola del navegador (F12)
2. Revisa los logs de PHP
3. Verifica que la API responda correctamente
4. Contacta con el equipo de desarrollo
